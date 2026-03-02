/**
 * Google Sheets integration using Web Crypto API (Workers-compatible).
 * No Node.js SDK — uses JWT signing via SubtleCrypto for service account auth.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

/** Convert a PEM-encoded PKCS#8 private key to a CryptoKey */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/[\n\r\s]/g, "");

  const binaryDer = Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Base64url encode a Uint8Array or ArrayBuffer */
function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Create a signed JWT for Google service account auth */
async function createJWT(
  email: string,
  privateKey: string,
  scopes: string[],
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: scopes.join(" "),
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(privateKey);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(signingInput),
  );

  return `${signingInput}.${base64url(sig)}`;
}

/** Exchange a signed JWT for a Google access token */
async function getAccessToken(
  email: string,
  privateKey: string,
): Promise<string> {
  const jwt = await createJWT(email, privateKey, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Append a row to a Google Sheet tab */
export async function appendRow(
  sheetId: string,
  tab: string,
  values: string[],
  credentials: { email: string; privateKey: string },
): Promise<void> {
  if (!credentials.email || !credentials.privateKey || !sheetId) return;

  const token = await getAccessToken(credentials.email, credentials.privateKey);
  const range = encodeURIComponent(`${tab}!A:Z`);
  const url = `${SHEETS_API}/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Google Sheets append failed:", res.status, text);
  }
}

const GITHUB_API = "https://api.github.com";
const REPO = "jdgtl/aabo-advisory";

export async function fileExists(
  token: string,
  path: string,
  branch = "main",
): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  return res.ok;
}

export async function createFile(
  token: string,
  path: string,
  content: string,
  message: string,
  branch = "main",
): Promise<{ success: boolean; error?: string }> {
  // Base64 encode — chunked to avoid stack overflow on large content
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const encoded = btoa(binary);
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, content: encoded, branch }),
  });
  if (!res.ok && res.status !== 201) {
    const errBody = await res.text().catch(() => "");
    console.error(`GitHub createFile ${res.status}: ${errBody}`);
    return { success: false, error: `GitHub ${res.status}: ${errBody.slice(0, 200)}` };
  }
  return { success: true };
}

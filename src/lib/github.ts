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
): Promise<{ success: boolean }> {
  const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(content)));
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, content: encoded, branch }),
  });
  return { success: res.ok || res.status === 201 };
}

const BREVO_API = "https://api.brevo.com/v3";

interface CreateContactParams {
  email: string;
  name: string;
  org?: string;
  tags: string[];
  listIds?: number[];
  attributes?: Record<string, string | number>;
}

export async function createOrUpdateContact(
  apiKey: string,
  params: CreateContactParams,
): Promise<{ success: boolean; contactId?: string }> {
  if (!apiKey) return { success: true }; // Skip if key not configured

  const [firstName, ...rest] = params.name.split(" ");
  const lastName = rest.join(" ");

  const attributes: Record<string, string | number> = {
    FIRSTNAME: firstName,
    LASTNAME: lastName,
    COMPANY: params.org ?? "",
    LEAD_DATE: new Date().toISOString().split("T")[0],
    ...params.attributes,
  };

  const body: Record<string, unknown> = {
    email: params.email,
    attributes,
    listIds: params.listIds ?? [],
    updateEnabled: true,
  };

  const res = await fetch(`${BREVO_API}/contacts`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 204) {
    const data = res.status === 204 ? {} : (await res.json() as Record<string, unknown>);
    return { success: true, contactId: data.id as string | undefined };
  }

  // 409 = contact already exists, update via PUT
  if (res.status === 409) {
    const updateRes = await fetch(`${BREVO_API}/contacts/${encodeURIComponent(params.email)}`, {
      method: "PUT",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attributes,
        listIds: params.listIds ?? [],
      }),
    });
    return { success: updateRes.ok || updateRes.status === 204 };
  }

  return { success: false };
}

export async function sendTransactionalEmail(
  apiKey: string,
  to: string,
  templateId: number,
  params: Record<string, string>,
): Promise<void> {
  if (!apiKey) return;

  await fetch(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [{ email: to }],
      templateId,
      params,
    }),
  });
}

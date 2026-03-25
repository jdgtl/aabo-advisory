const BREVO_API = "https://api.brevo.com/v3";

interface CreateContactParams {
  email: string;
  name: string;
  org?: string;
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

interface SendHtmlEmailParams {
  to: string;
  toName?: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  htmlContent: string;
  attachments?: { content: string; name: string }[];
}

export async function sendHtmlEmail(
  apiKey: string,
  params: SendHtmlEmailParams,
): Promise<{ success: boolean }> {
  if (!apiKey) return { success: false };

  const body: Record<string, unknown> = {
    sender: { email: params.senderEmail, name: params.senderName },
    to: [{ email: params.to, name: params.toName ?? params.to }],
    subject: params.subject,
    htmlContent: params.htmlContent,
  };

  if (params.attachments?.length) {
    body.attachment = params.attachments;
  }

  const res = await fetch(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { success: res.ok };
}

export async function trackEvent(
  apiKey: string,
  email: string,
  eventName: string,
  eventProperties?: Record<string, unknown>,
  contactProperties?: Record<string, string | number>,
): Promise<{ success: boolean }> {
  if (!apiKey) return { success: true };

  const body: Record<string, unknown> = {
    event_name: eventName,
    identifiers: { email_id: email },
  };
  if (eventProperties) body.event_properties = eventProperties;
  if (contactProperties) body.contact_properties = contactProperties;

  const res = await fetch(`${BREVO_API}/events`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { success: res.ok || res.status === 204 };
}

export async function addContactToLists(
  apiKey: string,
  email: string,
  listIds: number[],
): Promise<{ success: boolean }> {
  if (!apiKey || listIds.length === 0) return { success: true };
  const res = await fetch(`${BREVO_API}/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ listIds }),
  });
  return { success: res.ok || res.status === 204 };
}

export async function removeContactFromLists(
  apiKey: string,
  email: string,
  listIds: number[],
): Promise<{ success: boolean }> {
  if (!apiKey || listIds.length === 0) return { success: true };
  const results = await Promise.all(
    listIds.map(async (listId) => {
      const res = await fetch(`${BREVO_API}/contacts/lists/${listId}/contacts/remove`, {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email] }),
      });
      return res.ok || res.status === 204;
    }),
  );
  return { success: results.every(Boolean) };
}

export async function getContact(
  apiKey: string,
  email: string,
): Promise<{ success: boolean; contact?: { listIds: number[]; attributes: Record<string, unknown> } }> {
  if (!apiKey) return { success: false };
  const res = await fetch(`${BREVO_API}/contacts/${encodeURIComponent(email)}`, {
    headers: { "api-key": apiKey },
  });
  if (!res.ok) return { success: false };
  const data = await res.json() as { listIds: number[]; attributes: Record<string, unknown> };
  return { success: true, contact: data };
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

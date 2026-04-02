export const prerender = false;
import type { APIRoute } from "astro";
import { getRuntimeEnv } from "@/lib/runtime-env";

const BREVO_API = "https://api.brevo.com/v3";

const COLLECTION_TO_TYPE: Record<string, string> = {
  "weekly-summaries": "weekly",
  "quarterly-reports": "quarterly",
};

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    const body = await request.json() as {
      collection?: string;
      slug?: string;
      title?: string;
    };

    const { collection, slug, title } = body;

    if (!collection || !slug || !title) {
      return new Response(JSON.stringify({ error: "collection, slug, and title are required" }), { status: 400, headers });
    }

    const kvKey = `newsletter-sent:${collection}:${slug}`;

    // Check if already sent
    if (env.RATE_LIMIT) {
      const existing = await env.RATE_LIMIT.get(kvKey);
      if (existing) {
        return new Response(JSON.stringify({ error: "This newsletter has already been sent" }), { status: 409, headers });
      }
    }

    // Map collection to URL type path
    const type = COLLECTION_TO_TYPE[collection];
    if (!type) {
      return new Response(JSON.stringify({ error: `Unknown collection: ${collection}` }), { status: 400, headers });
    }

    // Fetch pre-rendered email HTML from same deployment
    const emailUrl = new URL(`/newsletter/${type}/${slug}/email.html`, request.url);
    const emailRes = await fetch(emailUrl.toString());
    if (!emailRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch email template: ${emailRes.status}` }), { status: 500, headers });
    }
    const htmlContent = await emailRes.text();
    if (!htmlContent) {
      return new Response(JSON.stringify({ error: "Email template is empty" }), { status: 500, headers });
    }

    // Map collection to Brevo list ID
    const listMap: Record<string, string | undefined> = {
      "weekly-summaries": env.BREVO_LIST_WEEKLY,
      "quarterly-reports": env.BREVO_LIST_QUARTERLY,
    };
    const listIdStr = listMap[collection];
    if (!listIdStr) {
      return new Response(JSON.stringify({ error: `No Brevo list configured for ${collection}` }), { status: 500, headers });
    }
    const listId = parseInt(listIdStr, 10);

    const brevoKey = env.BREVO_API_KEY ?? "";
    if (!brevoKey) {
      return new Response(JSON.stringify({ error: "Brevo API key not configured" }), { status: 500, headers });
    }

    // Create Brevo campaign
    const createRes = await fetch(`${BREVO_API}/emailCampaigns`, {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        subject: title,
        sender: {
          email: env.BREVO_SENDER_EMAIL ?? "newsletter@aaboadvisory.com",
          name: env.BREVO_SENDER_NAME ?? "Aabo Advisory",
        },
        htmlContent,
        recipients: { listIds: [listId] },
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error("Brevo create campaign error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create email campaign" }), { status: 500, headers });
    }

    const campaign = await createRes.json() as { id: number };

    // Send campaign immediately
    const sendRes = await fetch(`${BREVO_API}/emailCampaigns/${campaign.id}/sendNow`, {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
    });

    if (!sendRes.ok) {
      const errorText = await sendRes.text();
      console.error("Brevo send campaign error:", errorText);
      return new Response(JSON.stringify({ error: "Campaign created but failed to send" }), { status: 500, headers });
    }

    // Write sent timestamp to KV
    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.put(kvKey, new Date().toISOString());
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Newsletter send error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
};

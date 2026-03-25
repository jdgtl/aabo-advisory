export const prerender = false;
import type { APIRoute } from "astro";
import { createOrUpdateContact, addContactToLists, trackEvent, sendHtmlEmail } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "newsletter-subscribe");
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...headers, "Retry-After": String(rateResult.retryAfter ?? 3600) },
      });
    }

    const body = await request.json() as {
      name?: string;
      email?: string;
      lists?: string[];
      interests?: string[];
      turnstileToken?: string;
    };

    const { name, email, lists, interests, turnstileToken } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), { status: 400, headers });
    }
    if (!lists || lists.length === 0) {
      return new Response(JSON.stringify({ error: "Select at least one newsletter" }), { status: 400, headers });
    }

    const turnstileSecret = env.TURNSTILE_SECRET_KEY ?? "";
    if (turnstileSecret) {
      const valid = await verifyTurnstile(turnstileToken ?? "", turnstileSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Verification failed" }), { status: 403, headers });
      }
    }

    const brevoKey = env.BREVO_API_KEY ?? "";
    if (!brevoKey) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    const token = crypto.randomUUID();

    await createOrUpdateContact(brevoKey, {
      email,
      name,
      attributes: {
        NEWSLETTER_SUBSCRIBER: "true",
        NEWSLETTER_TOKEN: token,
        NEWSLETTER_INTERESTS: (interests ?? []).join(","),
      },
    });

    const listMap: Record<string, string | undefined> = {
      daily: env.BREVO_LIST_DAILY,
      weekly: env.BREVO_LIST_WEEKLY,
      quarterly: env.BREVO_LIST_QUARTERLY,
    };
    const listIds = lists
      .map((l) => parseInt(listMap[l] ?? "", 10))
      .filter((id) => !isNaN(id));

    if (listIds.length > 0) {
      await addContactToLists(brevoKey, email, listIds);
    }

    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.put(`newsletter-token:${token}`, email);
    }

    await trackEvent(brevoKey, email, "newsletter_subscribed", {
      lists: lists.join(","),
      interests: (interests ?? []).join(","),
    });

    const siteUrl = "https://aaboadvisory.com";
    const preferencesUrl = `${siteUrl}/newsletter/preferences?token=${token}`;
    await sendHtmlEmail(brevoKey, {
      to: email,
      toName: name,
      senderEmail: env.BREVO_SENDER_EMAIL ?? "newsletter@aaboadvisory.com",
      senderName: env.BREVO_SENDER_NAME ?? "AABO Advisory",
      subject: "Welcome to the AABO Advisory Newsletter",
      htmlContent: `<p>Thank you for subscribing. You can manage your preferences anytime: <a href="${preferencesUrl}">Manage preferences</a></p>`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
};

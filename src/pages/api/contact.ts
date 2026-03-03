export const prerender = false;
import type { APIRoute } from "astro";
import { createOrUpdateContact } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "contact");
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...headers, "Retry-After": String(rateResult.retryAfter ?? 3600) },
      });
    }

    const body = (await request.json()) as {
      name?: string;
      org?: string;
      email?: string;
      message?: string;
      turnstile_token?: string;
    };

    const { name, org, email, message, turnstile_token } = body;

    // Validate required fields
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers,
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers,
      });
    }

    // Turnstile verification
    const turnstileSecret = env.TURNSTILE_SECRET_KEY ?? "";
    if (turnstileSecret) {
      const valid = await verifyTurnstile(turnstile_token ?? "", turnstileSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Turnstile verification failed" }), {
          status: 403,
          headers,
        });
      }
    }

    // Brevo integration
    const brevoKey = env.BREVO_API_KEY ?? "";
    const listId = parseInt(env.BREVO_LIST_ID ?? "2", 10);

    if (brevoKey) {
      await createOrUpdateContact(brevoKey, {
        email,
        name,
        org,
        tags: ["consultation-request"],
        listIds: listId ? [listId] : [],
        attributes: {
          SOURCE: "consultation",
          MESSAGE: message,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Contact form error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

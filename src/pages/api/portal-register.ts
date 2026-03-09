export const prerender = false;
import type { APIRoute } from "astro";
import { createOrUpdateContact, trackEvent } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "portal-register");
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...headers, "Retry-After": String(rateResult.retryAfter ?? 3600) },
      });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      turnstile_token?: string;
    };

    const { name, email, turnstile_token } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers,
      });
    }

    // Turnstile verification
    const turnstileSecret = env.TURNSTILE_SECRET_KEY ?? "";
    if (turnstileSecret) {
      const valid = await verifyTurnstile(turnstile_token ?? "", turnstileSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Verification failed" }), {
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
        listIds: listId ? [listId] : [],
        attributes: {
          SOURCE: "client-portal",
        },
      });

      await trackEvent(brevoKey, email, "portal_access_requested");
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Portal register error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

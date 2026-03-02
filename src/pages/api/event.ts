import type { APIRoute } from "astro";
import { getRuntimeEnv } from "@/lib/runtime-env";

/**
 * Plausible analytics proxy — forwards events to plausible.io/api/event.
 * Deployed as a Cloudflare Pages Function to bypass ad blockers.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const body = await request.text();
    const env = getRuntimeEnv(locals as Record<string, unknown>);
    const domain = env.PLAUSIBLE_DOMAIN ?? "";

    if (!domain) {
      return new Response(JSON.stringify({ error: "Analytics not configured" }), {
        status: 503,
        headers,
      });
    }

    const res = await fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") ?? "",
        "X-Forwarded-For": request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "",
      },
      body,
    });

    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Plausible proxy error:", err);
    return new Response(JSON.stringify({ error: "Proxy error" }), {
      status: 502,
      headers,
    });
  }
};

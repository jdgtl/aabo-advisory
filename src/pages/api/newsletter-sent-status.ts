export const prerender = false;
import type { APIRoute } from "astro";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getRuntimeEnv(locals as Record<string, unknown>);
  const { keys } = await request.json() as { keys: string[] };
  const statuses: Record<string, string | null> = {};
  for (const key of keys) {
    statuses[key] = env.RATE_LIMIT ? await env.RATE_LIMIT.get(key) : null;
  }
  return new Response(JSON.stringify(statuses), {
    headers: { "Content-Type": "application/json" },
  });
};

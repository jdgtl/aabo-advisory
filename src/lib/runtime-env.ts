/// <reference types="@cloudflare/workers-types" />

/**
 * Extracts Cloudflare runtime environment from Astro locals.
 * Secrets set via `wrangler pages secret put` or CF Pages dashboard
 * are available on locals.runtime.env, NOT import.meta.env at SSR time.
 */

export interface RuntimeEnv {
  RATE_LIMIT?: KVNamespace;
  TURNSTILE_SECRET_KEY?: string;
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  PLAUSIBLE_DOMAIN?: string;

  // Newsletter Brevo lists
  BREVO_LIST_WEEKLY?: string;
  BREVO_LIST_QUARTERLY?: string;

  // ClickUp integration
  CLICKUP_API_TOKEN?: string;
  CLICKUP_CHANNEL_ID?: string;

  // GitHub integration
  GITHUB_TOKEN?: string;

  // Ingest webhook
  INGEST_WEBHOOK_SECRET?: string;
}

export function getRuntimeEnv(locals: Record<string, unknown>): RuntimeEnv {
  const runtime = locals.runtime as { env?: RuntimeEnv } | undefined;
  return runtime?.env ?? {};
}

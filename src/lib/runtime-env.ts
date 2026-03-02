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
  BREVO_CONSULTATION_LIST_ID?: string;
  BREVO_CALCULATOR_LIST_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_SHEET_ID?: string;
  PLAUSIBLE_DOMAIN?: string;
}

export function getRuntimeEnv(locals: Record<string, unknown>): RuntimeEnv {
  const runtime = locals.runtime as { env?: RuntimeEnv } | undefined;
  return runtime?.env ?? {};
}

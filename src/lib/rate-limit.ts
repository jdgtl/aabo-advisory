/**
 * Rate limiting via Cloudflare KV.
 * Key: IP + endpoint, Limit: 5 submissions per hour per IP per endpoint.
 */

/// <reference types="@cloudflare/workers-types" />

const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 3600; // 1 hour

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  kv: KVNamespace | undefined,
  ip: string,
  endpoint: string,
  maxRequests: number = MAX_REQUESTS,
): Promise<RateLimitResult> {
  if (!kv) return { allowed: true, remaining: maxRequests };

  const key = `rl:${ip}:${endpoint}`;
  const now = Date.now();

  const stored = await kv.get<{ timestamps: number[] }>(key, "json");
  const timestamps = stored?.timestamps ?? [];

  // Filter to only timestamps within the current window
  const windowStart = now - WINDOW_SECONDS * 1000;
  const recent = timestamps.filter((t: number) => t > windowStart);

  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    const retryAfter = Math.ceil((oldest + WINDOW_SECONDS * 1000 - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Record this request
  recent.push(now);
  await kv.put(key, JSON.stringify({ timestamps: recent }), {
    expirationTtl: WINDOW_SECONDS,
  });

  return { allowed: true, remaining: maxRequests - recent.length };
}

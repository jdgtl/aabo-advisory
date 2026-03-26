export const prerender = false;
import type { APIRoute } from "astro";
import {
  getContact,
  addContactToLists,
  removeContactFromLists,
  createOrUpdateContact,
} from "@/lib/brevo";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { getNewsletterTags } from "@/lib/newsletter-tags";

const headers = { "Content-Type": "application/json" };

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Rate limiting
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for") ??
      "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "newsletter-preferences", 10);
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(rateResult.retryAfter ?? 3600) },
        },
      );
    }

    // Read token from query string
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers });
    }

    // Look up email from KV
    const email = await env.RATE_LIMIT?.get(`newsletter-token:${token}`);
    if (!email) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers,
      });
    }

    // Fetch Brevo contact
    const brevoKey = env.BREVO_API_KEY ?? "";
    const contactResult = await getContact(brevoKey, email);
    if (!contactResult.success || !contactResult.contact) {
      return new Response(JSON.stringify({ error: "Contact not found" }), {
        status: 404,
        headers,
      });
    }

    const { listIds, attributes } = contactResult.contact;

    const weeklyListId = parseInt(env.BREVO_LIST_WEEKLY ?? "0", 10);
    const quarterlyListId = parseInt(env.BREVO_LIST_QUARTERLY ?? "0", 10);

    const lists = {
      weekly: weeklyListId > 0 && listIds.includes(weeklyListId),
      quarterly: quarterlyListId > 0 && listIds.includes(quarterlyListId),
    };

    // Parse interests from contact attributes (stored as comma-separated string for Brevo multiple-choice)
    let interests: string[] = [];
    const rawInterests = attributes["NEWSLETTER_INTERESTS"];
    if (Array.isArray(rawInterests)) {
      interests = rawInterests as string[];
    } else if (typeof rawInterests === "string" && rawInterests) {
      interests = rawInterests.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const availableTags = getNewsletterTags();

    return new Response(
      JSON.stringify({
        email: maskEmail(email),
        lists,
        interests,
        availableTags,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    console.error("Newsletter preferences GET error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Rate limiting
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for") ??
      "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "newsletter-preferences", 10);
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(rateResult.retryAfter ?? 3600) },
        },
      );
    }

    const body = (await request.json()) as {
      token?: string;
      lists?: { weekly?: boolean; quarterly?: boolean };
      interests?: string[];
    };

    const { token, lists, interests } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers });
    }

    // Look up email from KV
    const email = await env.RATE_LIMIT?.get(`newsletter-token:${token}`);
    if (!email) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers,
      });
    }

    const brevoKey = env.BREVO_API_KEY ?? "";

    // Handle list add/remove operations
    if (lists) {
      const weeklyListId = parseInt(env.BREVO_LIST_WEEKLY ?? "0", 10);
      const quarterlyListId = parseInt(env.BREVO_LIST_QUARTERLY ?? "0", 10);

      const toAdd: number[] = [];
      const toRemove: number[] = [];

      const listMap: Array<{ id: number; enabled: boolean | undefined }> = [
        { id: weeklyListId, enabled: lists.weekly },
        { id: quarterlyListId, enabled: lists.quarterly },
      ];

      for (const { id, enabled } of listMap) {
        if (id <= 0) continue;
        if (enabled === true) toAdd.push(id);
        else if (enabled === false) toRemove.push(id);
      }

      await Promise.all([
        addContactToLists(brevoKey, email, toAdd),
        removeContactFromLists(brevoKey, email, toRemove),
      ]);
    }

    // Update interests attribute
    if (interests !== undefined) {
      // Fetch existing contact to preserve the name fields
      const existing = await getContact(brevoKey, email);
      const firstName = String(existing.contact?.attributes?.["FIRSTNAME"] ?? "");
      const lastName = String(existing.contact?.attributes?.["LASTNAME"] ?? "");
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Subscriber";

      await createOrUpdateContact(brevoKey, {
        email,
        name: fullName,
        attributes: {
          NEWSLETTER_INTERESTS: interests,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Newsletter preferences POST error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

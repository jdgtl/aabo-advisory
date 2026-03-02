/// <reference types="@cloudflare/workers-types" />
import type { APIRoute } from "astro";
import { createOrUpdateContact } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { appendRow } from "@/lib/google-sheets";
import { checkRateLimit } from "@/lib/rate-limit";

interface CalculatorData {
  priceRange?: string;
  units?: number;
  timeline?: number;
  verdict?: string;
  savings?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    // Rate limiting
    const runtime = (locals as Record<string, unknown>).runtime as
      | { env?: { RATE_LIMIT?: KVNamespace } }
      | undefined;
    const kv = runtime?.env?.RATE_LIMIT;
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateResult = await checkRateLimit(kv, ip, "calculator-lead");
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
      turnstile_token?: string;
      calculatorData?: CalculatorData;
    };

    const { name, org, email, turnstile_token, calculatorData } = body;

    // Validate required fields
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers,
      });
    }

    // Turnstile verification
    const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY ?? "";
    if (turnstileSecret) {
      const valid = await verifyTurnstile(turnstile_token ?? "", turnstileSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Turnstile verification failed" }), {
          status: 403,
          headers,
        });
      }
    }

    // Determine tags
    const tags = ["calculator-lead"];
    const units = calculatorData?.units ?? 0;
    const priceRange = calculatorData?.priceRange ?? "";
    const priceNum = parseInt(priceRange.replace(/[^0-9]/g, ""), 10) || 0;
    if (units > 5 || priceNum > 3_000_000) {
      tags.push("high-value");
    }

    // Brevo integration
    const brevoKey = import.meta.env.BREVO_API_KEY ?? "";
    const listId = parseInt(import.meta.env.BREVO_CALCULATOR_LIST_ID ?? "0", 10);

    if (brevoKey) {
      await createOrUpdateContact(brevoKey, {
        email,
        name,
        org,
        tags,
        listIds: listId ? [listId] : [],
        attributes: {
          SOURCE: "calculator",
          CALCULATOR_VERDICT: calculatorData?.verdict ?? "",
          CALCULATOR_SAVINGS: calculatorData?.savings ?? "",
          CALCULATOR_UNITS: units,
        },
      });
    }

    // Google Sheets integration
    const sheetId = import.meta.env.GOOGLE_SHEET_ID ?? "";
    const gsEmail = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";
    const gsKey = import.meta.env.GOOGLE_PRIVATE_KEY ?? "";

    const calcSummary = calculatorData
      ? `${calculatorData.verdict ?? "N/A"} | ${units} units | ${priceRange} | ${calculatorData.timeline ?? "N/A"}yr | savings: ${calculatorData.savings ?? "N/A"}`
      : "No calculator data";

    if (sheetId && gsEmail && gsKey) {
      await appendRow(sheetId, "Calculator Leads", [
        new Date().toISOString(),
        name,
        org ?? "",
        email,
        "calculator",
        calcSummary,
      ], { email: gsEmail, privateKey: gsKey });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Calculator lead error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

export const prerender = false;
import type { APIRoute } from "astro";
import { createOrUpdateContact, sendHtmlEmail } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-env";

interface CalculatorData {
  // Summary
  priceRange?: string;
  units?: number;
  timeline?: number;
  verdict?: string;
  savings?: string;
  // Full inputs
  pricePerUnit?: number;
  commonCharges?: number;
  propertyTaxes?: number;
  propType?: string;
  monthlyRent?: number;
  otherCharges?: number;
  rentTaxes?: number;
  annualAppreciation?: number;
  annualRentGrowth?: number;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "calculator-lead");
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
      repeat?: boolean;
      action?: "gate-submit" | "resend-email";
      pdfBase64?: string;
      emailHtml?: string;
    };

    const { name, org, email, turnstile_token, calculatorData, repeat, action = "gate-submit", pdfBase64, emailHtml } = body;

    // Validate required fields
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
    if (repeat) {
      tags.push("repeat-lead");
    }

    // Brevo integration
    const brevoKey = env.BREVO_API_KEY ?? "";
    const listId = parseInt(env.BREVO_LIST_ID ?? "2", 10);
    const senderEmail = env.BREVO_SENDER_EMAIL ?? "noreply@aaboadvisory.com";
    const senderName = env.BREVO_SENDER_NAME ?? "AABO Advisory";

    let emailSent = false;

    if (brevoKey && action === "gate-submit") {
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
          CALCULATOR_PRICE_PER_UNIT: calculatorData?.pricePerUnit ?? 0,
          CALCULATOR_MONTHLY_RENT: calculatorData?.monthlyRent ?? 0,
          CALCULATOR_TIMELINE: calculatorData?.timeline ?? 0,
          CALCULATOR_PROPERTY_TYPE: calculatorData?.propType ?? "",
          LAST_CALCULATOR_DATE: new Date().toISOString().split("T")[0],
        },
      });
    }

    // Send results email (for both gate-submit and resend-email)
    if (brevoKey && emailHtml) {
      try {
        const attachments = pdfBase64
          ? [{ content: pdfBase64, name: "aabo-buy-vs-rent-analysis.pdf" }]
          : undefined;

        const emailResult = await sendHtmlEmail(brevoKey, {
          to: email,
          toName: name,
          senderEmail,
          senderName,
          subject: "Your Buy vs. Rent Analysis \u2014 AABO Advisory",
          htmlContent: emailHtml,
          attachments,
        });
        emailSent = emailResult.success;
      } catch {
        // Email failure should not block the response
        emailSent = false;
      }
    }

    return new Response(JSON.stringify({ success: true, emailSent }), { status: 200, headers });
  } catch (err) {
    console.error("Calculator lead error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

import type { APIRoute } from "astro";
import { createOrUpdateContact } from "@/lib/brevo";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as {
      name?: string;
      org?: string;
      email?: string;
      turnstile_token?: string;
    };

    const { name, org, email } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Brevo integration (gracefully skip if key not set)
    const brevoKey = import.meta.env.BREVO_API_KEY ?? "";
    const listId = parseInt(import.meta.env.BREVO_CALCULATOR_LIST_ID ?? "0", 10);

    if (brevoKey) {
      await createOrUpdateContact(brevoKey, {
        email,
        name,
        org,
        tags: ["calculator-lead"],
        listIds: listId ? [listId] : [],
        attributes: {
          SOURCE: "calculator-gate",
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Calculator lead error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

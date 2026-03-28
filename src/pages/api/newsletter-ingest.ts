export const prerender = false;
import type { APIRoute } from "astro";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { getNewsletterTags } from "@/lib/newsletter-tags";
import { fileExists, createFile } from "@/lib/github";
import { quillDeltaToMarkdown } from "@/lib/quill-to-markdown";

/** Get ISO week number from a date string (YYYY-MM-DD). */
function getISOWeek(dateStr: string): number {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = date.getUTCDay() || 7; // ISO: Mon=1 … Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Auto-suggest tags by scanning content for keyword matches. */
function suggestTags(content: string): string[] {
  const tags = getNewsletterTags();
  const lower = content.toLowerCase();
  const matched: string[] = [];
  for (const tag of tags) {
    const keywords = [tag.value, tag.label.toLowerCase()];
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(tag.value);
    }
  }
  return matched;
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/**
 * Extract a date from a task title like "Weekly Summary — Week of March 23–29, 2026".
 * Returns the end date as YYYY-MM-DD, or null if unparseable.
 */
function extractDateFromTitle(title: string): string | null {
  // Match patterns like "March 23–29, 2026" or "March 23-29, 2026"
  const rangeMatch = title.match(
    /(\w+)\s+\d{1,2}\s*[–\-]\s*(\d{1,2}),?\s*(\d{4})/,
  );
  if (rangeMatch) {
    const monthName = rangeMatch[1].toLowerCase();
    const endDay = parseInt(rangeMatch[2], 10);
    const year = parseInt(rangeMatch[3], 10);
    const monthIndex = MONTHS[monthName];
    if (monthIndex !== undefined) {
      const mm = String(monthIndex + 1).padStart(2, "0");
      const dd = String(endDay).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }
  }

  // Match single date like "March 29, 2026"
  const singleMatch = title.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (singleMatch) {
    const monthName = singleMatch[1].toLowerCase();
    const day = parseInt(singleMatch[2], 10);
    const year = parseInt(singleMatch[3], 10);
    const monthIndex = MONTHS[monthName];
    if (monthIndex !== undefined) {
      const mm = String(monthIndex + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }
  }

  return null;
}

/** Format today as YYYY-MM-DD. */
function todayISO(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Auth: accept X-Webhook-Secret header or ?secret= query param
    const headerSecret = request.headers.get("X-Webhook-Secret");
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret");
    const secret = headerSecret || querySecret;

    if (!secret || secret !== env.INGEST_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const body = await request.json() as Record<string, unknown>;

    // Handle ClickUp webhook test pings
    if (body.event === "test" || (!body.task_id && !body.type)) {
      return new Response(JSON.stringify({ ok: true, message: "Webhook connected" }), { status: 200, headers });
    }

    // Determine mode: ClickUp webhook (has task_id) vs direct content
    // Read task_id from body, URL query param, or nested ClickUp payload
    const payload = body.payload as Record<string, unknown> | undefined;
    const taskId = (body.task_id ?? url.searchParams.get("task_id") ?? payload?.id) as string | undefined;

    let type = "weekly";
    let title: string;
    let date: string;
    let content: string;

    if (taskId) {
      // --- Mode 1: ClickUp webhook ---
      const clickupToken = env.CLICKUP_API_TOKEN ?? "";
      if (!clickupToken) {
        return new Response(
          JSON.stringify({ error: "CLICKUP_API_TOKEN not configured" }),
          { status: 500, headers },
        );
      }

      const taskRes = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
        headers: { Authorization: clickupToken },
      });

      if (!taskRes.ok) {
        return new Response(
          JSON.stringify({ error: `ClickUp API error: ${taskRes.status}` }),
          { status: 502, headers },
        );
      }

      const task = (await taskRes.json()) as {
        name: string;
        description: string;
        status: { status: string };
      };

      // Only process tasks that are "ready to publish"
      if (task.status.status.toLowerCase() !== "ready to publish") {
        return new Response(
          JSON.stringify({ skipped: true, reason: `Status is "${task.status.status}", not "ready to publish"` }),
          { status: 200, headers },
        );
      }

      title = task.name;
      date = extractDateFromTitle(title) ?? todayISO();
      content = quillDeltaToMarkdown(task.description);
    } else {
      // --- Mode 2: Direct content (fallback / testing) ---
      type = (body.type as string) ?? "";
      title = (body.title as string) ?? "";
      date = (body.date as string) ?? "";
      content = (body.content as string) ?? "";

      if (!type || !title || !date || !content) {
        return new Response(
          JSON.stringify({ error: "type, title, date, and content are required" }),
          { status: 400, headers },
        );
      }

      if (type !== "weekly") {
        return new Response(
          JSON.stringify({ error: "type must be 'weekly'" }),
          { status: 400, headers },
        );
      }
    }

    // Generate slug
    const year = new Date(`${date}T12:00:00Z`).getUTCFullYear();
    const week = getISOWeek(date);
    const slug = `${year}-w${String(week).padStart(2, "0")}`;

    // Determine content directory and file path
    const dir = "src/content/weekly-summaries";
    const filePath = `${dir}/${slug}.mdoc`;

    const githubToken = env.GITHUB_TOKEN ?? "";
    if (!githubToken) {
      return new Response(
        JSON.stringify({ error: "GITHUB_TOKEN not configured" }),
        { status: 500, headers },
      );
    }

    // Idempotency check
    const exists = await fileExists(githubToken, filePath);
    if (exists) {
      return new Response(JSON.stringify({ skipped: true, slug }), { status: 200, headers });
    }

    // Auto-suggest tags
    const tags = suggestTags(content);

    // Generate excerpt (first 200 chars of content, stripped of markdown)
    const excerpt = content
      .replace(/^#+\s+/gm, "")
      .replace(/\*+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim()
      .slice(0, 200);

    // Format tags as YAML sequence
    const tagsYaml =
      tags.length > 0
        ? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}`
        : "tags: []";

    // Build Markdoc file with frontmatter
    const fileContent = `---
draft: true
title: '${title.replace(/'/g, "''")}'
date: ${date}
excerpt: >-
  ${excerpt.replace(/\n/g, "\n  ")}
${tagsYaml}
---
${content}
`;

    const commitMessage = `feat(newsletter): add ${type} digest ${slug} [ingest]`;
    const result = await createFile(githubToken, filePath, fileContent, commitMessage);

    if (!result.success) {
      console.error("GitHub createFile failed for", filePath);
      return new Response(
        JSON.stringify({ error: "Failed to commit file to GitHub" }),
        { status: 500, headers },
      );
    }

    return new Response(JSON.stringify({ success: true, slug }), { status: 200, headers });
  } catch (err) {
    console.error("Newsletter ingest error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
};

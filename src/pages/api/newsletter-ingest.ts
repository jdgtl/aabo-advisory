export const prerender = false;
import type { APIRoute } from "astro";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { getNewsletterTags } from "@/lib/newsletter-tags";
import { fileExists, createFile } from "@/lib/github";

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

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Webhook secret verification
    const secret = request.headers.get("X-Webhook-Secret");
    if (!secret || secret !== env.INGEST_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const body = await request.json() as {
      type?: string;
      title?: string;
      date?: string;
      content?: string;
    };

    const { type, title, date, content } = body;

    if (!type || !title || !date || !content) {
      return new Response(
        JSON.stringify({ error: "type, title, date, and content are required" }),
        { status: 400, headers },
      );
    }

    if (type !== "daily" && type !== "weekly") {
      return new Response(
        JSON.stringify({ error: "type must be 'daily' or 'weekly'" }),
        { status: 400, headers },
      );
    }

    // Generate slug
    let slug: string;
    if (type === "daily") {
      slug = date; // e.g. 2026-03-24
    } else {
      const year = new Date(`${date}T12:00:00Z`).getUTCFullYear();
      const week = getISOWeek(date);
      slug = `${year}-w${String(week).padStart(2, "0")}`; // e.g. 2026-w12
    }

    // Determine content directory and file path
    const dir =
      type === "daily"
        ? "src/content/daily-digests"
        : "src/content/weekly-summaries";
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

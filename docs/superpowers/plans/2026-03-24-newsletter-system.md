# Newsletter System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-tier newsletter system (Daily Digest, Weekly Summary, Quarterly Reports) with subscriber management, ClickUp content ingestion, and Brevo email delivery.

**Architecture:** Keystatic collections for newsletter content with a shared tag taxonomy singleton. Cloudflare Pages Functions for subscribe/preferences/send/ingest APIs. Pre-rendered email HTML at build time. Token-based preference center stored in Cloudflare KV. Brevo for subscriber lists and campaign delivery.

**Tech Stack:** Astro 5, React 19, Tailwind CSS 4, Keystatic (cloud mode), Cloudflare Pages/Workers/KV, Brevo API, ClickUp API v2, GitHub REST API

**Spec:** `docs/superpowers/specs/2026-03-24-newsletter-system-design.md`

---

## File Structure

### New Files

```
src/lib/newsletter-tags.ts              — Shared tag helper (reads JSON, exports multiselect options)
src/lib/newsletter.ts                   — Content reader functions for all newsletter collections
src/lib/date-utils.ts                   — Full date formatting (formatFullDate for day precision)
src/lib/github.ts                       — GitHub REST API helpers (check file exists, create file)

src/content/newsletter-tags.json        — Curated tag taxonomy (seed data)
src/content/newsletter-page.json        — Newsletter page CMS content (seed data)

src/pages/newsletter/index.astro        — Archive page (SSG)
src/pages/newsletter/daily/[slug].astro — Daily digest page (SSG)
src/pages/newsletter/daily/[slug]/email.html.astro — Daily email HTML (SSG, .html extension)
src/pages/newsletter/weekly/[slug].astro           — Weekly summary page (SSG)
src/pages/newsletter/weekly/[slug]/email.html.astro — Weekly email HTML (SSG, .html extension)
src/pages/newsletter/quarterly/[slug].astro        — Quarterly report page (SSG, custom template)
src/pages/newsletter/quarterly/[slug]/email.html.astro — Quarterly email HTML (SSG, .html extension)
src/pages/newsletter/preferences.astro  — Preference center (SSR)
src/pages/newsletter/admin.astro        — Send control panel (SSG, sent status fetched client-side)
src/pages/api/newsletter-sent-status.ts — API to check sent status from KV (for admin panel)

src/pages/api/newsletter-subscribe.ts   — Subscribe endpoint
src/pages/api/newsletter-preferences.ts — Preferences GET/POST endpoint
src/pages/api/newsletter-send.ts        — Send campaign endpoint
src/pages/api/newsletter-ingest.ts      — ClickUp ingest endpoint

src/components/interactive/NewsletterSubscribe.tsx — Subscribe form (React island)
src/components/interactive/NewsletterArchive.tsx   — Filterable archive list (React island)
src/components/interactive/PreferenceCenter.tsx    — Preference management (React island)
src/components/interactive/AdminPanel.tsx          — Send control panel (React island)

src/layouts/Newsletter.astro            — Layout for daily/weekly newsletters
src/layouts/QuarterlyReport.astro       — Layout for quarterly reports
src/layouts/NewsletterEmail.astro        — Email HTML layout (table-based, inline styles)
```

### Modified Files

```
keystatic.config.ts                     — Add 3 collections + 2 singletons
src/lib/runtime-env.ts                  — Add new env var types
src/lib/rate-limit.ts                   — Add configurable maxRequests parameter
src/lib/brevo.ts                        — Add list management and contact lookup helpers
src/components/sections/Nav.astro       — Add Newsletter link
wrangler.jsonc                          — Add new env vars
astro.config.mjs                        — Update sitemap serialize for newsletter URLs
```

---

## Task 1: Tag Taxonomy & Keystatic Config

**Files:**
- Create: `src/lib/newsletter-tags.ts`
- Create: `src/content/newsletter-tags.json`
- Create: `src/content/newsletter-page.json`
- Modify: `keystatic.config.ts`

- [ ] **Step 1: Create seed tag taxonomy JSON**

Create `src/content/newsletter-tags.json`:

```json
{
  "tags": [
    { "label": "Renovation & Capital Works", "value": "renovation" },
    { "label": "Security & Hardening", "value": "security" },
    { "label": "Procurement & Contracts", "value": "procurement" },
    { "label": "Lease vs. Own", "value": "lease-vs-own" },
    { "label": "Market Data", "value": "market-data" },
    { "label": "Regulatory & Compliance", "value": "regulatory" },
    { "label": "Sustainability", "value": "sustainability" },
    { "label": "Portfolio Strategy", "value": "portfolio-strategy" }
  ]
}
```

- [ ] **Step 2: Create newsletter page singleton seed data**

Create `src/content/newsletter-page.json`:

```json
{
  "headline": "Newsletter",
  "subtext": "Diplomatic Housing Intelligence",
  "dailyDescription": "Curated daily briefing on diplomatic property developments, tenders, and policy shifts worldwide.",
  "weeklyDescription": "Weekly analysis synthesizing patterns and emerging trends from the diplomatic housing landscape.",
  "quarterlyDescription": "In-depth market reports with data analysis, charts, and strategic outlook for diplomatic property portfolios."
}
```

- [ ] **Step 3: Create shared tag helper**

Create `src/lib/newsletter-tags.ts`:

```typescript
import tagsData from "../content/newsletter-tags.json";

export interface NewsletterTag {
  label: string;
  value: string;
}

export function getNewsletterTags(): NewsletterTag[] {
  return tagsData.tags;
}

/** For use in keystatic.config.ts multiselect fields */
export function getTagOptions(): { label: string; value: string }[] {
  return tagsData.tags.map((t) => ({ label: t.label, value: t.value }));
}
```

- [ ] **Step 4: Add newsletter collections and singletons to Keystatic config**

Modify `keystatic.config.ts` — add imports and new collections/singletons. The three newsletter collections share the same tag multiselect pattern. Add after the existing `articles` collection:

```typescript
import { getTagOptions } from "./src/lib/newsletter-tags";

const tagOptions = getTagOptions();

// Inside collections: { ... }
"daily-digests": collection({
  label: "Daily Digests",
  slugField: "title",
  path: "src/content/daily-digests/*",
  format: { contentField: "body" },
  entryLayout: "content",
  previewUrl: "/newsletter/daily/{slug}",
  columns: ["date", "draft"],
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    date: fields.date({ label: "Date", validation: { isRequired: true } }),
    excerpt: fields.text({ label: "Excerpt", multiline: true }),
    tags: fields.multiselect({
      label: "Tags",
      options: tagOptions,
    }),
    draft: fields.checkbox({ label: "Draft", defaultValue: true }),
    body: fields.markdoc({ label: "Body" }),
  },
}),
"weekly-summaries": collection({
  label: "Weekly Summaries",
  slugField: "title",
  path: "src/content/weekly-summaries/*",
  format: { contentField: "body" },
  entryLayout: "content",
  previewUrl: "/newsletter/weekly/{slug}",
  columns: ["date", "draft"],
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    date: fields.date({ label: "Date", validation: { isRequired: true } }),
    excerpt: fields.text({ label: "Excerpt", multiline: true }),
    tags: fields.multiselect({
      label: "Tags",
      options: tagOptions,
    }),
    draft: fields.checkbox({ label: "Draft", defaultValue: true }),
    body: fields.markdoc({ label: "Body" }),
  },
}),
"quarterly-reports": collection({
  label: "Quarterly Reports",
  slugField: "title",
  path: "src/content/quarterly-reports/*",
  format: { contentField: "body" },
  entryLayout: "content",
  previewUrl: "/newsletter/quarterly/{slug}",
  columns: ["quarter", "date", "draft"],
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    quarter: fields.text({ label: "Quarter", description: "e.g. Q1 2026" }),
    date: fields.date({ label: "Date", validation: { isRequired: true } }),
    excerpt: fields.text({ label: "Excerpt", multiline: true }),
    tags: fields.multiselect({
      label: "Tags",
      options: tagOptions,
    }),
    draft: fields.checkbox({ label: "Draft", defaultValue: true }),
    body: fields.markdoc({ label: "Body" }),
  },
}),

// Inside singletons: { ... }
newsletterPage: singleton({
  label: "Newsletter Page",
  path: "src/content/newsletter-page",
  format: { data: "json" },
  schema: {
    headline: fields.text({ label: "Headline" }),
    subtext: fields.text({ label: "Subtext" }),
    dailyDescription: fields.text({ label: "Daily Digest Description", multiline: true }),
    weeklyDescription: fields.text({ label: "Weekly Summary Description", multiline: true }),
    quarterlyDescription: fields.text({ label: "Quarterly Reports Description", multiline: true }),
  },
}),
newsletterTags: singleton({
  label: "Newsletter Tags",
  path: "src/content/newsletter-tags",
  format: { data: "json" },
  schema: {
    tags: fields.array(
      fields.object({
        label: fields.text({ label: "Label" }),
        value: fields.text({ label: "Value (slug)" }),
      }),
      {
        label: "Tags",
        itemLabel: (props) => props.fields.label.value,
      },
    ),
  },
}),
```

- [ ] **Step 5: Build and verify Keystatic config loads**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds. Keystatic config compiles without errors. New collections appear in Keystatic dashboard.

- [ ] **Step 6: Commit**

```bash
git add src/lib/newsletter-tags.ts src/content/newsletter-tags.json src/content/newsletter-page.json keystatic.config.ts
git commit -m "feat: add newsletter Keystatic collections, tag taxonomy, and page singleton"
```

---

## Task 2: Content Reader & Runtime Env

**Files:**
- Create: `src/lib/newsletter.ts`
- Create: `src/lib/date-utils.ts`
- Modify: `src/lib/runtime-env.ts`
- Modify: `wrangler.jsonc`

- [ ] **Step 1: Create date utilities**

Create `src/lib/date-utils.ts`:

```typescript
/** Format YYYY-MM-DD → "Mar 24, 2026" (day-precision for newsletters) */
export function formatFullDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return date;
}
```

- [ ] **Step 2: Create newsletter content reader**

Create `src/lib/newsletter.ts`:

```typescript
import { reader, calcReadTime } from "./content";
import { formatFullDate } from "./date-utils";
import Markdoc from "@markdoc/markdoc";

export type NewsletterType = "daily" | "weekly" | "quarterly";

export interface NewsletterItem {
  slug: string;
  type: NewsletterType;
  title: string;
  date: string;
  dateFormatted: string;
  excerpt: string;
  tags: readonly string[];
  readTime: string;
  quarter?: string;
}

async function readCollection(
  collectionName: "daily-digests" | "weekly-summaries" | "quarterly-reports",
  type: NewsletterType,
): Promise<NewsletterItem[]> {
  const slugs = await reader.collections[collectionName].list();
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections[collectionName].read(slug, { resolveLinkedFiles: true });
      if (!entry || entry.draft) return null;

      const content = await entry.body;
      const html = Markdoc.renderers.html(Markdoc.transform(content.node));

      return {
        slug,
        type,
        title: entry.title,
        date: entry.date,
        dateFormatted: formatFullDate(entry.date),
        excerpt: entry.excerpt ?? "",
        tags: entry.tags ?? [],
        readTime: calcReadTime(html.replace(/<[^>]*>/g, "")),
        quarter: "quarter" in entry ? (entry as { quarter?: string }).quarter : undefined,
      } satisfies NewsletterItem;
    }),
  );
  return items.filter(Boolean) as NewsletterItem[];
}

export async function getAllNewsletters(): Promise<NewsletterItem[]> {
  const [daily, weekly, quarterly] = await Promise.all([
    readCollection("daily-digests", "daily"),
    readCollection("weekly-summaries", "weekly"),
    readCollection("quarterly-reports", "quarterly"),
  ]);
  return [...daily, ...weekly, ...quarterly].sort(
    (a, b) => b.date.localeCompare(a.date),
  );
}

export async function getDailyDigests() {
  return readCollection("daily-digests", "daily");
}

export async function getWeeklySummaries() {
  return readCollection("weekly-summaries", "weekly");
}

export async function getQuarterlyReports() {
  return readCollection("quarterly-reports", "quarterly");
}

export function getNewsletterPage() {
  return reader.singletons.newsletterPage.read();
}
```

- [ ] **Step 2: Update runtime-env.ts with new env vars**

Add to the `RuntimeEnv` interface in `src/lib/runtime-env.ts`:

```typescript
// Newsletter Brevo lists
BREVO_LIST_DAILY?: string;
BREVO_LIST_WEEKLY?: string;
BREVO_LIST_QUARTERLY?: string;

// ClickUp integration
CLICKUP_API_TOKEN?: string;
CLICKUP_CHANNEL_ID?: string;

// GitHub integration
GITHUB_TOKEN?: string;

// Ingest webhook
INGEST_WEBHOOK_SECRET?: string;
```

- [ ] **Step 3: Update wrangler.jsonc with placeholder vars**

Add to `vars` in `wrangler.jsonc`:

```jsonc
"BREVO_LIST_DAILY": "",
"BREVO_LIST_WEEKLY": "",
"BREVO_LIST_QUARTERLY": ""
```

Note: `CLICKUP_API_TOKEN`, `CLICKUP_CHANNEL_ID`, `GITHUB_TOKEN`, and `INGEST_WEBHOOK_SECRET` are secrets — set via `wrangler pages secret put`, not in the config file.

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsletter.ts src/lib/runtime-env.ts wrangler.jsonc
git commit -m "feat: add newsletter content reader and env var config"
```

---

## Task 3: Newsletter Layout & Daily/Weekly Pages

**Files:**
- Create: `src/layouts/Newsletter.astro`
- Create: `src/pages/newsletter/daily/[slug].astro`
- Create: `src/pages/newsletter/weekly/[slug].astro`
- Create: `src/content/daily-digests/` (empty dir placeholder)
- Create: `src/content/weekly-summaries/` (empty dir placeholder)

- [ ] **Step 1: Create Newsletter layout**

Create `src/layouts/Newsletter.astro`. Follow the same structure as `src/layouts/Article.astro` — header with title/date/tags, body content area, footer with related newsletters. Simplify compared to Article (no docId, no publication button, no key takeaway):

```astro
---
import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import RevealWrapper from "@/components/ui/RevealWrapper";
import LineReveal from "@/components/ui/LineReveal.astro";

interface Props {
  title: string;
  type: "daily" | "weekly" | "quarterly";
  typeLabel: string;
  date: string;
  readTime: string;
  tags: readonly string[];
  excerpt: string;
}

const { title, type, typeLabel, date, readTime, tags, excerpt } = Astro.props;
---

<Base title={`${title} — AABO Advisory`} description={excerpt}>
  <Nav />
  <main id="main-content" class="bg-canvas min-h-screen">
    <div class="px-6 md:px-12 lg:px-20 pt-14 lg:pt-[60px] pb-10 lg:pb-12">
      <div class="max-w-[800px] mx-auto">
        <RevealWrapper client:visible>
          <div class="flex items-center gap-3 mb-4">
            <span class="px-2 py-0.5 border border-accent/30 text-[9px] tracking-[0.12em] uppercase text-accent font-semibold">
              {typeLabel}
            </span>
            <span class="text-[11px] text-warm/50">{date}</span>
            <span class="text-[11px] text-warm/50">{readTime}</span>
          </div>
          <h1 class="font-heading text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-primary leading-[1.15] mb-4">
            {title}
          </h1>
          <LineReveal width={48} class="mb-5" />
          {tags.length > 0 && (
            <div class="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <span class="px-2 py-0.5 bg-light text-[10px] tracking-[0.1em] uppercase text-text/50 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </RevealWrapper>
      </div>
    </div>

    <div class="px-6 md:px-12 lg:px-20 pb-16 lg:pb-20">
      <div class="max-w-[800px] mx-auto prose prose-neutral">
        <slot />
      </div>
    </div>
  </main>
  <Footer />
</Base>
```

- [ ] **Step 2: Create daily digest page**

Create `src/pages/newsletter/daily/[slug].astro`:

```astro
---
import Newsletter from "@/layouts/Newsletter.astro";
import { reader, calcReadTime } from "@/lib/content";
import { formatFullDate } from "@/lib/date-utils";
import Markdoc from "@markdoc/markdoc";

export async function getStaticPaths() {
  const slugs = await reader.collections["daily-digests"].list();
  return slugs.map((slug) => ({ params: { slug } }));
}

const { slug } = Astro.params;
const entry = await reader.collections["daily-digests"].read(slug!, {
  resolveLinkedFiles: true,
});

if (!entry) {
  return Astro.redirect("/newsletter");
}

const content = await entry.body;
const rendered = Markdoc.renderers.html(Markdoc.transform(content.node));
const readTime = calcReadTime(rendered.replace(/<[^>]*>/g, ""));
---

<Newsletter
  title={entry.title}
  type="daily"
  typeLabel="Daily Digest"
  date={formatFullDate(entry.date)}
  readTime={readTime}
  tags={entry.tags ?? []}
  excerpt={entry.excerpt ?? ""}
>
  <Fragment set:html={rendered} />
</Newsletter>
```

- [ ] **Step 3: Create weekly summary page**

Create `src/pages/newsletter/weekly/[slug].astro` — same pattern as daily but with `weekly-summaries` collection and `typeLabel="Weekly Summary"`.

- [ ] **Step 4: Create content directory placeholders**

```bash
mkdir -p src/content/daily-digests src/content/weekly-summaries src/content/quarterly-reports
touch src/content/daily-digests/.gitkeep src/content/weekly-summaries/.gitkeep src/content/quarterly-reports/.gitkeep
```

- [ ] **Step 5: Build and verify**

Run: `npm run build 2>&1 | tail -15`

Expected: Build succeeds. No newsletter pages rendered yet (collections empty).

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Newsletter.astro src/pages/newsletter/daily/ src/pages/newsletter/weekly/ src/content/daily-digests/ src/content/weekly-summaries/ src/content/quarterly-reports/
git commit -m "feat: add newsletter layout and daily/weekly page templates"
```

---

## Task 4: Quarterly Report Page (Custom Template)

**Files:**
- Create: `src/layouts/QuarterlyReport.astro`
- Create: `src/pages/newsletter/quarterly/[slug].astro`

- [ ] **Step 1: Create quarterly report layout**

Create `src/layouts/QuarterlyReport.astro` — extends the Newsletter layout with a wider content area, support for full-width data sections, and a more editorial header treatment. Include a quarter badge and a distinct visual treatment:

Same base structure as `Newsletter.astro` but with:
- Max-width of `1000px` instead of `800px` for content
- Quarter badge in header (e.g. "Q1 2026")
- Different header visual weight (larger typography)
- Keep prose styles for body content

- [ ] **Step 2: Create quarterly report page**

Create `src/pages/newsletter/quarterly/[slug].astro` — same pattern as daily/weekly but uses `QuarterlyReport` layout and reads from `quarterly-reports` collection. Include `quarter` prop.

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/QuarterlyReport.astro src/pages/newsletter/quarterly/
git commit -m "feat: add quarterly report custom layout and page template"
```

---

## Task 5: Email HTML Templates (Build-Time Pre-render)

**Files:**
- Create: `src/layouts/NewsletterEmail.astro`
- Create: `src/pages/newsletter/daily/[slug]/email.html.astro`
- Create: `src/pages/newsletter/weekly/[slug]/email.html.astro`
- Create: `src/pages/newsletter/quarterly/[slug]/email.html.astro`

- [ ] **Step 1: Create email HTML layout**

Create `src/layouts/NewsletterEmail.astro` — a standalone HTML document (no Base layout) using table-based email markup with inline styles. Include:

- AABO Advisory branded header (inline SVG logo or hosted image)
- Content area with inline styles (no external CSS)
- Footer with:
  - `<a href="https://aaboadvisory.com/newsletter/preferences?token={{ params.NEWSLETTER_TOKEN }}">Manage preferences</a>`
  - `{{ unsubscribe }}` Brevo merge tag
  - Physical address and contact info
- No JavaScript, no external stylesheets
- Max-width 600px table layout (email standard)

```astro
---
interface Props {
  title: string;
  typeLabel: string;
  date: string;
}

const { title, typeLabel, date } = Astro.props;
---

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:2px solid #1a2a3a;">
              <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8b7d6b;margin-bottom:8px;">{typeLabel}</div>
              <h1 style="margin:0;font-size:24px;color:#1a2a3a;line-height:1.3;">{title}</h1>
              <div style="font-size:13px;color:#8b7d6b;margin-top:8px;">{date}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;font-size:16px;line-height:1.7;color:#333333;">
              <slot />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#1a2a3a;color:#ffffff;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 12px;">AABO Advisory — Diplomatic Property Intelligence</p>
              <p style="margin:0 0 12px;">
                <a href="https://aaboadvisory.com/newsletter/preferences?token={{ params.NEWSLETTER_TOKEN }}" style="color:#8b7d6b;">Manage your preferences</a> |
                {{ unsubscribe }}
              </p>
              <p style="margin:0;color:#666;">New York, NY</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

- [ ] **Step 2: Create email page for daily digests**

Create `src/pages/newsletter/daily/[slug]/email.html.astro`:

```astro
---
import NewsletterEmail from "@/layouts/NewsletterEmail.astro";
import { reader, formatDate } from "@/lib/content";
import Markdoc from "@markdoc/markdoc";

export async function getStaticPaths() {
  const slugs = await reader.collections["daily-digests"].list();
  return slugs.map((slug) => ({ params: { slug } }));
}

const { slug } = Astro.params;
const entry = await reader.collections["daily-digests"].read(slug!, {
  resolveLinkedFiles: true,
});

if (!entry) {
  return new Response("Not found", { status: 404 });
}

const content = await entry.body;
const rendered = Markdoc.renderers.html(Markdoc.transform(content.node));
---

<NewsletterEmail title={entry.title} typeLabel="Daily Digest" date={formatDate(entry.date)}>
  <Fragment set:html={rendered} />
</NewsletterEmail>
```

- [ ] **Step 3: Create email pages for weekly and quarterly**

Same pattern for `src/pages/newsletter/weekly/[slug]/email.html.astro` and `src/pages/newsletter/quarterly/[slug]/email.html.astro`, adjusting collection names and type labels.

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds. Email pages will be generated alongside web pages when content exists.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/NewsletterEmail.astro src/pages/newsletter/daily/*/email.html.astro src/pages/newsletter/weekly/*/email.html.astro src/pages/newsletter/quarterly/*/email.html.astro
git commit -m "feat: add pre-rendered email HTML templates for all newsletter types"
```

---

## Task 6: Newsletter Archive Page & Subscribe Form

**Files:**
- Create: `src/pages/newsletter/index.astro`
- Create: `src/components/interactive/NewsletterSubscribe.tsx`
- Create: `src/components/interactive/NewsletterArchive.tsx`

- [ ] **Step 1: Create NewsletterSubscribe component**

Create `src/components/interactive/NewsletterSubscribe.tsx` — React island with:
- Name and email inputs
- Three newsletter type checkboxes (daily, weekly, quarterly) with descriptions from props
- Tag cloud for interest selection (from props)
- Turnstile widget
- POST to `/api/newsletter-subscribe`
- Success/error state

Follow the pattern from `PortalRegister.tsx` for Turnstile integration, form validation, and submission handling. Key difference: this is inline (not a modal) and has checkboxes + tag cloud.

- [ ] **Step 2: Create NewsletterArchive component**

Create `src/components/interactive/NewsletterArchive.tsx` — React island with:
- Type filter buttons (All, Daily Digest, Weekly Summary, Quarterly Reports)
- Tag filter buttons (from curated taxonomy)
- Newsletter cards showing: type badge, title, date, excerpt, tags, read time
- Links to `/newsletter/{type}/{slug}`
- Client-side filtering by type and tags
- Optional `?token=xxx` support: on mount, if token present in URL, fetch preferences from `/api/newsletter-preferences` and set default tag filters

Follow the pattern from `InsightsFilter.tsx` for filter button styling and card layout.

- [ ] **Step 3: Create newsletter archive page**

Create `src/pages/newsletter/index.astro`:

```astro
---
import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import RevealWrapper from "@/components/ui/RevealWrapper";
import LineReveal from "@/components/ui/LineReveal.astro";
import NewsletterSubscribe from "@/components/interactive/NewsletterSubscribe";
import NewsletterArchive from "@/components/interactive/NewsletterArchive";
import { getAllNewsletters, getNewsletterPage } from "@/lib/newsletter";
import { getNewsletterTags } from "@/lib/newsletter-tags";

const page = await getNewsletterPage();
const newsletters = await getAllNewsletters();
const tags = getNewsletterTags();
---

<Base
  title={`${page?.headline ?? "Newsletter"} — AABO Advisory`}
  description={page?.subtext ?? ""}
>
  <Nav />
  <main id="main-content" class="bg-canvas min-h-screen">
    {/* Header */}
    <div class="px-6 md:px-12 lg:px-20 pt-14 lg:pt-[60px] pb-10 lg:pb-12">
      <div class="max-w-[1100px] mx-auto">
        <RevealWrapper client:visible>
          <div class="text-[10px] tracking-[0.25em] uppercase text-accent mb-4 font-semibold">
            {page?.subtext ?? "Diplomatic Housing Intelligence"}
          </div>
          <h1 class="font-heading text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-primary leading-[1.12] mb-4">
            {page?.headline ?? "Newsletter"}
          </h1>
          <LineReveal width={48} class="mb-8" />
        </RevealWrapper>
      </div>
    </div>

    {/* Subscribe form */}
    <div class="px-6 md:px-12 lg:px-20 pb-12">
      <div class="max-w-[1100px] mx-auto">
        <NewsletterSubscribe
          client:load
          dailyDescription={page?.dailyDescription ?? ""}
          weeklyDescription={page?.weeklyDescription ?? ""}
          quarterlyDescription={page?.quarterlyDescription ?? ""}
          tags={tags}
        />
      </div>
    </div>

    {/* Archive */}
    <div class="px-6 md:px-12 lg:px-20 pb-16 lg:pb-20">
      <div class="max-w-[1100px] mx-auto">
        <NewsletterArchive
          client:load
          newsletters={newsletters}
          tags={tags}
        />
      </div>
    </div>
  </main>
  <Footer />
</Base>
```

- [ ] **Step 4: Build and verify page renders**

Run: `npm run build 2>&1 | tail -15`

Expected: Build succeeds. `/newsletter/index.html` is generated.

- [ ] **Step 5: Commit**

```bash
git add src/pages/newsletter/index.astro src/components/interactive/NewsletterSubscribe.tsx src/components/interactive/NewsletterArchive.tsx
git commit -m "feat: add newsletter archive page with subscribe form and filterable listing"
```

---

## Task 7: Navigation Update & Sitemap

**Files:**
- Modify: `src/components/sections/Nav.astro`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add Newsletter link to navigation**

Modify `src/components/sections/Nav.astro` — add a "Newsletter" link between "Insights" and "Client Portal" in both desktop and mobile nav. Link to `/newsletter`. Follow the existing pattern for nav link styling (`data-nav-link` attribute, same classes).

- [ ] **Step 2: Update sitemap serialize to include newsletter dates**

Modify `astro.config.mjs` — extend the existing `serialize` callback in the sitemap integration to also handle newsletter URLs:

```javascript
serialize(item) {
  // Match insight article URLs
  const articleMatch = item.url.match(/\/insights\/([^/]+)\/?$/);
  if (articleMatch && articleDates.has(articleMatch[1])) {
    item.lastmod = new Date(articleDates.get(articleMatch[1])).toISOString();
    return item;
  }
  // Match newsletter URLs (daily, weekly, quarterly)
  const newsletterMatch = item.url.match(/\/newsletter\/(daily|weekly|quarterly)\/([^/]+)\/?$/);
  if (newsletterMatch) {
    // Newsletter dates will be handled similarly — for now use build date
    item.lastmod = new Date().toISOString();
    return item;
  }
  // Static pages get build date
  item.lastmod = new Date().toISOString();
  return item;
},
```

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -15`

Expected: Build succeeds. Newsletter link appears in nav.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Nav.astro astro.config.mjs
git commit -m "feat: add Newsletter to site navigation and update sitemap"
```

---

## Task 8: Subscribe API Endpoint

**Files:**
- Create: `src/pages/api/newsletter-subscribe.ts`
- Modify: `src/lib/brevo.ts` (add list management helpers)

- [ ] **Step 1: Add Brevo list management helpers**

Add to `src/lib/brevo.ts`:

```typescript
export async function addContactToLists(
  apiKey: string,
  email: string,
  listIds: number[],
): Promise<{ success: boolean }> {
  if (!apiKey || listIds.length === 0) return { success: true };
  const res = await fetch(`${BREVO_API}/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ listIds }),
  });
  return { success: res.ok || res.status === 204 };
}

export async function removeContactFromLists(
  apiKey: string,
  email: string,
  listIds: number[],
): Promise<{ success: boolean }> {
  if (!apiKey || listIds.length === 0) return { success: true };
  const results = await Promise.all(
    listIds.map(async (listId) => {
      const res = await fetch(`${BREVO_API}/contacts/lists/${listId}/contacts/remove`, {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email] }),
      });
      return res.ok || res.status === 204;
    }),
  );
  return { success: results.every(Boolean) };
}

export async function getContact(
  apiKey: string,
  email: string,
): Promise<{ success: boolean; contact?: { listIds: number[]; attributes: Record<string, unknown> } }> {
  if (!apiKey) return { success: false };
  const res = await fetch(`${BREVO_API}/contacts/${encodeURIComponent(email)}`, {
    headers: { "api-key": apiKey },
  });
  if (!res.ok) return { success: false };
  const data = await res.json() as { listIds: number[]; attributes: Record<string, unknown> };
  return { success: true, contact: data };
}
```

- [ ] **Step 2: Create subscribe endpoint**

Create `src/pages/api/newsletter-subscribe.ts` following the pattern from `src/pages/api/contact.ts`:

```typescript
export const prerender = false;
import type { APIRoute } from "astro";
import { createOrUpdateContact, addContactToLists, trackEvent, sendHtmlEmail } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const env = getRuntimeEnv(locals as Record<string, unknown>);

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateResult = await checkRateLimit(env.RATE_LIMIT, ip, "newsletter-subscribe");
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...headers, "Retry-After": String(rateResult.retryAfter ?? 3600) },
      });
    }

    const body = await request.json() as {
      name?: string;
      email?: string;
      lists?: string[];
      interests?: string[];
      turnstileToken?: string;
    };

    const { name, email, lists, interests, turnstileToken } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), { status: 400, headers });
    }
    if (!lists || lists.length === 0) {
      return new Response(JSON.stringify({ error: "Select at least one newsletter" }), { status: 400, headers });
    }

    // Turnstile
    const turnstileSecret = env.TURNSTILE_SECRET_KEY ?? "";
    if (turnstileSecret) {
      const valid = await verifyTurnstile(turnstileToken ?? "", turnstileSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Verification failed" }), { status: 403, headers });
      }
    }

    const brevoKey = env.BREVO_API_KEY ?? "";
    if (!brevoKey) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Generate preference token
    const token = crypto.randomUUID();

    // Create/update contact — do NOT set SOURCE (preserve existing)
    await createOrUpdateContact(brevoKey, {
      email,
      name,
      attributes: {
        NEWSLETTER_SUBSCRIBER: "true",
        NEWSLETTER_TOKEN: token,
        NEWSLETTER_INTERESTS: JSON.stringify(interests ?? []),
      },
    });

    // Map list names to Brevo list IDs
    const listMap: Record<string, string | undefined> = {
      daily: env.BREVO_LIST_DAILY,
      weekly: env.BREVO_LIST_WEEKLY,
      quarterly: env.BREVO_LIST_QUARTERLY,
    };
    const listIds = lists
      .map((l) => parseInt(listMap[l] ?? "", 10))
      .filter((id) => !isNaN(id));

    if (listIds.length > 0) {
      await addContactToLists(brevoKey, email, listIds);
    }

    // Store token → email in KV
    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.put(`newsletter-token:${token}`, email);
    }

    // Track event
    await trackEvent(brevoKey, email, "newsletter_subscribed", {
      lists: lists.join(","),
      interests: (interests ?? []).join(","),
    });

    // Send welcome email with preference center link
    const siteUrl = "https://aaboadvisory.com";
    const preferencesUrl = `${siteUrl}/newsletter/preferences?token=${token}`;
    await sendHtmlEmail(brevoKey, {
      to: email,
      toName: name,
      senderEmail: env.BREVO_SENDER_EMAIL ?? "newsletter@aaboadvisory.com",
      senderName: env.BREVO_SENDER_NAME ?? "AABO Advisory",
      subject: "Welcome to the AABO Advisory Newsletter",
      htmlContent: `<p>Thank you for subscribing. You can manage your preferences anytime: <a href="${preferencesUrl}">Manage preferences</a></p>`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
};
```

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/newsletter-subscribe.ts src/lib/brevo.ts
git commit -m "feat: add newsletter subscribe API endpoint with Brevo list management"
```

---

## Task 9: Preferences API Endpoint

**Files:**
- Create: `src/pages/api/newsletter-preferences.ts`

- [ ] **Step 1: Create preferences endpoint (GET + POST)**

Create `src/pages/api/newsletter-preferences.ts`:

Handles both GET (fetch preferences) and POST (update preferences). Uses KV token lookup, Brevo contact API for list membership, and updates NEWSLETTER_INTERESTS attribute.

Follow the same pattern as other API routes (`prerender = false`, rate limiting, error handling). Note: the rate limit for preferences should be 10/hour (not the default 5/hour). Extend `checkRateLimit` to accept an optional `maxRequests` parameter (default 5), and pass `10` from the preferences endpoint.

GET: Reads token from query string → KV lookup → Brevo getContact → return masked email, list memberships, interests, available tags.

POST: Reads token from body → KV lookup → Brevo addContactToLists/removeContactFromLists → update NEWSLETTER_INTERESTS → return success.

Email masking: `j***@example.com` (first char + asterisks + @ + full domain).

- [ ] **Step 2: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/newsletter-preferences.ts
git commit -m "feat: add newsletter preferences API (GET/POST) with token-based access"
```

---

## Task 10: Preference Center Page

**Files:**
- Create: `src/pages/newsletter/preferences.astro`
- Create: `src/components/interactive/PreferenceCenter.tsx`

- [ ] **Step 1: Create PreferenceCenter React component**

Create `src/components/interactive/PreferenceCenter.tsx`:

- On mount, read `token` from URL search params
- Fetch `GET /api/newsletter-preferences?token=xxx`
- Display masked email, three toggles for newsletter types, tag cloud for interests
- "Save" button → POST to `/api/newsletter-preferences`
- "Unsubscribe from all" button
- Loading/error/success states

- [ ] **Step 2: Create preferences page (SSR)**

Create `src/pages/newsletter/preferences.astro`:

```astro
---
export const prerender = false;

import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import PreferenceCenter from "@/components/interactive/PreferenceCenter";
---

<Base title="Newsletter Preferences — AABO Advisory" description="Manage your newsletter subscriptions">
  <Nav />
  <main id="main-content" class="bg-canvas min-h-screen">
    <div class="px-6 md:px-12 lg:px-20 pt-14 lg:pt-[60px] pb-16 lg:pb-20">
      <div class="max-w-[600px] mx-auto">
        <PreferenceCenter client:load />
      </div>
    </div>
  </main>
  <Footer />
</Base>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/newsletter/preferences.astro src/components/interactive/PreferenceCenter.tsx
git commit -m "feat: add newsletter preference center (SSR page + React island)"
```

---

## Task 11: Send API & Admin Panel

**Files:**
- Create: `src/pages/api/newsletter-send.ts`
- Create: `src/pages/api/newsletter-sent-status.ts`
- Create: `src/pages/newsletter/admin.astro`
- Create: `src/components/interactive/AdminPanel.tsx`

- [ ] **Step 1: Create send endpoint**

Create `src/pages/api/newsletter-send.ts`:

- `prerender = false`
- POST with `{ collection, slug, title }` body (title used as Brevo campaign subject line)
- Check KV for `newsletter-sent:{collection}:{slug}` — reject if already sent
- Map collection to URL path (`daily-digests` → `daily`, etc.)
- Fetch pre-rendered email HTML from same deployment: `new URL(\`/newsletter/${type}/${slug}/email.html\`, request.url)` (the `.html.astro` filename produces this exact path)
- Use the `title` from the request body as the Brevo campaign subject line
- If fetch fails, return error
- Map collection to Brevo list ID
- Create Brevo campaign via `POST /v3/emailCampaigns` with raw HTML, targeting the list
- Send campaign immediately via `POST /v3/emailCampaigns/{id}/sendNow`
- Write sent timestamp to KV
- Return `{ success: true }`

- [ ] **Step 2: Create AdminPanel React component**

Create `src/components/interactive/AdminPanel.tsx`:

- Receives list of newsletters (with sent status) as props
- Groups by type (Daily, Weekly, Quarterly)
- Each entry: title, date, sent status badge
- Unsent entries have a "Send" button → POST to `/api/newsletter-send`
- Confirmation dialog before sending
- Loading/success/error states per item

- [ ] **Step 3: Create admin page (SSR)**

Create `src/pages/api/newsletter-sent-status.ts` — a small API endpoint that returns sent status for all newsletters from KV:

```typescript
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
```

Create `src/pages/newsletter/admin.astro` — SSG page (Keystatic reader works at build time). The AdminPanel React island fetches sent status client-side via the API:

```astro
---
import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import AdminPanel from "@/components/interactive/AdminPanel";
import { getAllNewsletters } from "@/lib/newsletter";

const newsletters = await getAllNewsletters();
---

<Base title="Newsletter Admin — AABO Advisory" description="">
  <Nav />
  <main id="main-content" class="bg-canvas min-h-screen">
    <div class="px-6 md:px-12 lg:px-20 pt-14 lg:pt-[60px] pb-16 lg:pb-20">
      <div class="max-w-[1100px] mx-auto">
        <h1 class="font-heading text-[32px] font-bold text-primary mb-8">Newsletter Admin</h1>
        <AdminPanel client:load newsletters={newsletters} />
      </div>
    </div>
  </main>
  <Footer />
</Base>
```

The AdminPanel component fetches sent status on mount via `POST /api/newsletter-sent-status` with the KV keys for each newsletter. This avoids using the Keystatic reader at SSR time on Cloudflare Workers (which has no filesystem).

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/newsletter-send.ts src/pages/newsletter/admin.astro src/components/interactive/AdminPanel.tsx
git commit -m "feat: add newsletter send API and admin panel"
```

---

## Task 12: ClickUp Ingest Endpoint

**Files:**
- Create: `src/lib/github.ts`
- Create: `src/pages/api/newsletter-ingest.ts`

- [ ] **Step 1: Create GitHub API helper**

Create `src/lib/github.ts`:

```typescript
const GITHUB_API = "https://api.github.com";
const REPO = "jdgtl/aabo-advisory"; // Update with actual repo

export async function fileExists(
  token: string,
  path: string,
  branch = "main",
): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  return res.ok;
}

export async function createFile(
  token: string,
  path: string,
  content: string,
  message: string,
  branch = "main",
): Promise<{ success: boolean }> {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, content: encoded, branch }),
  });
  return { success: res.ok || res.status === 201 };
}
```

- [ ] **Step 2: Create ingest endpoint**

Create `src/pages/api/newsletter-ingest.ts`:

- `prerender = false`
- POST with webhook secret verification via `X-Webhook-Secret` header
- Fetch messages from ClickUp API v2 channel
- Parse the structured content (title, date, numbered stories)
- Convert to Markdoc format
- Auto-suggest tags by keyword matching against the taxonomy (fetch `newsletter-tags.json` from GitHub API or hardcode the keyword map)
- Idempotency: check if file already exists via GitHub API
- Commit new file to repo via GitHub API
- Return `{ success: true, slug }` or `{ skipped: true }` if duplicate

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/github.ts src/pages/api/newsletter-ingest.ts
git commit -m "feat: add ClickUp ingest endpoint with GitHub commit and auto-tagging"
```

---

## Task 13: Integration Testing & Polish

**Files:**
- Multiple files for fixes and refinements

- [ ] **Step 1: Create a test daily digest manually**

Create `src/content/daily-digests/2026-03-24.mdoc` with sample content (use the real daily digest from the user's example) to test the full render pipeline.

- [ ] **Step 2: Build and verify full pipeline**

Run: `npm run build 2>&1 | tail -30`

Expected:
- `/newsletter/index.html` renders with the test digest in the archive
- `/newsletter/daily/2026-03-24/index.html` renders the digest
- `/newsletter/daily/2026-03-24/email.html` renders the email version

- [ ] **Step 3: Dev server smoke test**

Run: `npm run dev`

Manually verify:
- `/newsletter` shows subscribe form and archive with test digest
- `/newsletter/daily/2026-03-24` renders the digest
- Filter buttons work (type + tag)
- Subscribe form validates (requires at least one list)
- Nav shows Newsletter link

- [ ] **Step 4: Clean up test content**

Remove the test daily digest or mark it as draft.

- [ ] **Step 5: Final build verification**

Run: `npm run build 2>&1 | tail -10`

Expected: Clean build, no errors.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "feat: newsletter system integration testing and polish"
git pull --rebase origin main
git push origin main
```

Note: Per project convention, always `git pull --rebase origin main` before pushing. Remote content files (Keystatic-managed) take precedence in merge conflicts.

---

## Known Gaps (Phase 2)

These items are in the spec but deferred from this implementation:

1. **Custom Markdoc tags for quarterly reports** — `{% chart %}`, `{% callout %}`, `{% data-table %}` tags need a Markdoc schema file. Defer until the first quarterly report is being authored and the exact visualization needs are clear.
2. **Sitemap newsletter dates** — Currently uses build date for newsletter URLs. Should be updated to read newsletter dates from frontmatter (same pattern as `getArticleDates()` in `astro.config.mjs`).
3. **Draft pages are accessible by direct URL** — `getStaticPaths` renders all slugs including drafts. This matches the existing articles pattern (useful for preview). If stricter access control is needed, add a draft check with redirect.
4. **Welcome email template** — Task 8 sends a minimal inline HTML welcome email. Should be replaced with a proper Brevo transactional template (designed in Brevo dashboard) with branded styling matching the newsletter email templates.

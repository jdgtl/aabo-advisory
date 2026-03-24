# Newsletter System Design

## Overview

A newsletter system for AABO Advisory that publishes three newsletter types (Daily Digest, Weekly Summary, Quarterly Market Reports) to the website and delivers them via Brevo email. Content for daily and weekly newsletters is sourced from a ClickUp Super Agent that generates diplomatic housing industry briefs. Quarterly reports are authored manually. All content passes through a human review gate before publishing or sending.

## Goals

- Single authoring workflow: content is written once and published to both the site and email
- Publishing to the site and sending via email are independent actions
- Subscribers choose which newsletter types to receive and which topics interest them
- A curated tag taxonomy powers both content filtering and subscriber interest profiles
- ClickUp-sourced content flows into Keystatic as editable drafts with zero manual data entry
- Future-proof: preference center can be embedded in the client portal when auth is built

## Content Pipeline

### Daily Digest + Weekly Summary (automated source)

1. **ClickUp Super Agent** posts a daily brief (and weekly analysis) to a ClickUp channel
2. **Cloudflare Worker** (`/api/newsletter-ingest`) polls ClickUp API, parses the content, and commits it to the GitHub repo as a Keystatic draft (Markdoc file with frontmatter) via the GitHub API. Requires a `GITHUB_TOKEN` secret with `contents:write` scope on the repo.
3. **Keystatic** shows the draft in the CMS. Editorial team reviews, edits content and tags, then publishes (sets `draft: false`)
4. **Site rebuild** picks up the published newsletter and renders it in the archive. At build time, an email-ready HTML version is also generated for each published newsletter and output as a static asset (e.g. `/newsletter/daily/[slug]/email.html`).
5. **Admin panel** (`/newsletter/admin`) lists published-but-unsent newsletters. Clicking "Send" triggers a Brevo campaign via raw HTML (fetched from the pre-rendered email asset).

### Quarterly Market Report (manual authoring)

1. Authored directly in Keystatic using a Markdoc body field with support for charts, data tables, and images. Requires a Markdoc schema defining custom tags/nodes for chart components, callout blocks, and data tables.
2. Same publish → send workflow as daily/weekly
3. Rendered with a custom template that supports richer data visualizations

## Data Model

### Keystatic Collections

#### `daily-digests`

- **Path:** `src/content/daily-digests/*`
- **Format:** Markdoc with YAML frontmatter
- **Slug format:** Date-based (e.g. `2026-03-24`)
- **Fields:**
  - `title` — text (e.g. "Daily Diplomatic Housing Digest — Mar 24, 2026")
  - `date` — date
  - `excerpt` — text (short summary for archive cards)
  - `tags` — multiselect field; options are read from `newsletter-tags.json` at Keystatic config build time via a shared helper that imports the JSON and maps it to select options
  - `draft` — boolean (default: `true`, set to `false` to publish)
  - `body` — Markdoc document

#### `weekly-summaries`

- **Path:** `src/content/weekly-summaries/*`
- **Format:** Markdoc with YAML frontmatter
- **Slug format:** Week-based (e.g. `2026-w12`)
- **Fields:**
  - `title` — text (e.g. "Weekly Summary — Week of Mar 17, 2026")
  - `date` — date
  - `excerpt` — text
  - `tags` — multiselect field (same shared helper as daily-digests)
  - `draft` — boolean (default: `true`)
  - `body` — Markdoc document

#### `quarterly-reports`

- **Path:** `src/content/quarterly-reports/*`
- **Format:** Markdoc with YAML frontmatter
- **Slug format:** Quarter-based (e.g. `q1-2026`)
- **Fields:**
  - `title` — text
  - `quarter` — text (e.g. "Q1 2026")
  - `date` — date
  - `excerpt` — text
  - `tags` — multiselect field (same shared helper as daily-digests)
  - `draft` — boolean (default: `true`)
  - `body` — Markdoc document (rich — supports charts, data tables, images via custom Markdoc tags)

### Keystatic Singletons

#### `newsletterPage`

- **Path:** `src/content/newsletter-page.json`
- **Fields:**
  - `headline` — text (archive page heading)
  - `subtext` — text (archive page description)
  - `dailyDescription` — text (describes daily digest for subscribe form)
  - `weeklyDescription` — text (describes weekly summary for subscribe form)
  - `quarterlyDescription` — text (describes quarterly reports for subscribe form)

#### `newsletterTags`

- **Path:** `src/content/newsletter-tags.json`
- **Fields:**
  - `tags` — array of objects, each with:
    - `label` — text (display name, e.g. "Renovation & Capital Works")
    - `value` — text (slug, e.g. "renovation")

This is the single source of truth for tags. A shared helper function (`src/lib/newsletter-tags.ts`) imports this JSON file and exports it as Keystatic `multiselect` options. This helper is used by:
- The Keystatic config for the `tags` field on all three newsletter collections
- The archive page filter UI (reads the JSON at build time)
- The subscriber preference center interest selection (fetched via API or embedded in page)
- The ClickUp ingest worker for auto-suggesting tags (reads from the committed JSON via GitHub API)

To add, rename, or remove a tag: edit the singleton in Keystatic. The change propagates everywhere on the next build.

## Subscriber System

### Brevo List Architecture

Three separate Brevo lists, one per newsletter type. List IDs are configured as environment variables:
- `BREVO_LIST_DAILY` — Daily Digest subscriber list
- `BREVO_LIST_WEEKLY` — Weekly Summary subscriber list
- `BREVO_LIST_QUARTERLY` — Quarterly Reports subscriber list

These are separate from the existing `BREVO_LIST_ID` (list 2) which is used for consultation/calculator leads. Newsletter subscribers are added only to their selected newsletter lists, not to the general lead list.

A subscriber can be on any combination of the three lists (1, 2, or all 3).

### Token-to-Email Mapping

Brevo's Contact API does not support looking up contacts by arbitrary attributes. To resolve preference center tokens to email addresses, the token-to-email mapping is stored in **Cloudflare KV**:

- **Key:** `newsletter-token:{uuid}`
- **Value:** subscriber's email address
- **Written at:** subscribe time (when token is generated)
- **Read at:** preference center load and update

All newsletter KV keys (tokens, sent state) use the existing `RATE_LIMIT` KV namespace with distinct key prefixes (`newsletter-token:`, `newsletter-sent:`). This avoids provisioning a second namespace while keeping keys unambiguous via prefixing.

### Contact Attributes

All newsletter subscribers get these Brevo contact attributes:
- `NEWSLETTER_SUBSCRIBER` — boolean `true` (distinguishes newsletter subscribers from other lead sources; does not overwrite the existing `SOURCE` attribute set by other lead capture forms)
- `NEWSLETTER_TOKEN` — unique token for preference center access (UUID, generated at subscribe time)
- `NEWSLETTER_INTERESTS` — JSON string of selected tag values (e.g. `["renovation","security","procurement"]`)

If the contact already exists (e.g. from a calculator submission), only the newsletter-specific attributes are added/updated. The existing `SOURCE` attribute is preserved.

### Subscribe Flow

1. Visitor lands on `/newsletter`
2. Fills out: name, email, selects newsletter types (checkboxes), optionally selects topic interests (tag cloud)
3. Form submits to `POST /api/newsletter-subscribe` (Turnstile-protected)
4. API creates/updates Brevo contact with newsletter attributes, adds to selected lists, generates preference token, stores token→email in KV
5. Confirmation shown on page. Welcome email sent via Brevo transactional template with preference center link.

### Preference Center

- **URL:** `/newsletter/preferences?token=xxx`
- **Access:** Token-based, no login required. Token is included in every newsletter email footer.
- **Capabilities:**
  - Toggle individual newsletter subscriptions on/off
  - Select/deselect topic interests from the curated tag taxonomy
  - Unsubscribe from all
- **Future:** When client portal auth is built, authenticated clients can access the same preference center without a token (resolved via their email address)

## Site Pages

### URL Structure

| Route | Type | Description |
|---|---|---|
| `/newsletter` | Static (SSG) | Subscribe form + filterable archive of all published newsletters |
| `/newsletter/daily/[slug]` | Static (SSG) | Individual daily digest |
| `/newsletter/daily/[slug]/email.html` | Static (SSG) | Pre-rendered email HTML (not linked, fetched by send endpoint) |
| `/newsletter/weekly/[slug]` | Static (SSG) | Individual weekly summary |
| `/newsletter/weekly/[slug]/email.html` | Static (SSG) | Pre-rendered email HTML |
| `/newsletter/quarterly/[slug]` | Static (SSG) | Individual quarterly report (custom template) |
| `/newsletter/quarterly/[slug]/email.html` | Static (SSG) | Pre-rendered email HTML |
| `/newsletter/preferences` | SSR (`export const prerender = false`) | Subscriber preference management (token-based) |
| `/newsletter/admin` | SSR (`export const prerender = false`) | Send control panel (protected via Cloudflare Access) |

### Archive Page (`/newsletter`)

- Subscribe form at the top with newsletter type checkboxes and topic interest selection
- Below: filterable archive listing all published newsletters across all three types
- Filters: by type (daily/weekly/quarterly) and by tag
- Token-based personalization is handled client-side: a React island reads the `?token=xxx` query parameter, calls `GET /api/newsletter-preferences` to fetch the subscriber's interests, and sets the default tag filters accordingly. The page itself is statically generated; filtering is entirely client-side.
- Cards show: type badge, title, date, excerpt, tags

### Individual Newsletter Pages

- **Daily + Weekly:** Standard article-like layout matching the site's design aesthetic. Title, date, tags, body content.
- **Quarterly:** Custom template with support for data visualizations, charts, callout blocks, and a more editorial layout. Requires a Markdoc schema file defining custom tags (e.g. `{% chart %}`, `{% callout %}`, `{% data-table %}`).

### Email HTML Pages

Each newsletter type has a corresponding email template that renders the same Markdoc content into email-compatible HTML (table-based layout, inline styles). These are generated at build time as static assets alongside the web pages. The send endpoint fetches these pre-rendered assets rather than rendering Markdoc at runtime (Cloudflare Workers have no filesystem access and cannot use the Keystatic reader).

### Admin Panel (`/newsletter/admin`)

- Lists all published newsletters that haven't been sent yet, grouped by type
- Each entry shows: title, date, subscriber count for that list
- "Send" button next to each — triggers `POST /api/newsletter-send`
- After sending, entry moves to "Sent" section with sent date
- Sent state tracked in Cloudflare KV (key: `newsletter-sent:{collection}:{slug}`, value: ISO datetime)
- **Access control:** Protected via Cloudflare Access (zero-trust, configured in Cloudflare dashboard — email-based or identity provider). This is the lowest-effort auth mechanism for the existing stack and avoids building a custom auth system.

## API Endpoints

All SSR pages and API endpoints must export `export const prerender = false` to run as Cloudflare Pages Functions (consistent with existing API routes like `/api/contact.ts`).

### `POST /api/newsletter-subscribe`

- **Purpose:** New subscriber registration
- **Auth:** Turnstile CAPTCHA
- **Rate limit:** 5/hour per IP
- **Body:** `{ name, email, lists: ["daily","weekly","quarterly"], interests: ["renovation","security",...], turnstileToken }`
- **Actions:**
  1. Verify Turnstile token
  2. Create/update Brevo contact with NEWSLETTER_SUBSCRIBER=true, NEWSLETTER_TOKEN (generate UUID), NEWSLETTER_INTERESTS. Do NOT overwrite existing SOURCE attribute.
  3. Add contact to selected Brevo lists (`BREVO_LIST_DAILY`, `BREVO_LIST_WEEKLY`, `BREVO_LIST_QUARTERLY`)
  4. Store token→email mapping in Cloudflare KV
  5. Fire `newsletter_subscribed` Brevo event
  6. Send welcome transactional email with preference center link
- **Response:** `{ success: true }`

### `GET /api/newsletter-preferences?token=xxx`

- **Purpose:** Fetch current subscription state
- **Auth:** Token-based (token→email resolved via Cloudflare KV lookup)
- **Rate limit:** 10/hour per IP
- **Actions:**
  1. Look up email from KV using token
  2. Fetch Brevo contact by email
  3. Check list memberships and read NEWSLETTER_INTERESTS attribute
  4. Return current state
- **Response:** `{ email (masked), lists: { daily: true, weekly: false, quarterly: true }, interests: ["renovation",...], availableTags: [...] }`

### `POST /api/newsletter-preferences`

- **Purpose:** Update subscription preferences
- **Auth:** Token-based (same KV lookup)
- **Rate limit:** 10/hour per IP
- **Body:** `{ token, lists: { daily: bool, weekly: bool, quarterly: bool }, interests: ["tag1","tag2",...] }`
- **Actions:**
  1. Look up email from KV using token
  2. Add/remove from Brevo lists based on changes
  3. Update NEWSLETTER_INTERESTS attribute on Brevo contact
  4. If all lists set to false, remove from all newsletter lists (unsubscribe all)
- **Response:** `{ success: true }`

### `POST /api/newsletter-send`

- **Purpose:** Send a published newsletter to its subscriber list
- **Auth:** Protected via Cloudflare Access (same as admin panel)
- **Body:** `{ collection: "daily-digests"|"weekly-summaries"|"quarterly-reports", slug: "2026-03-24" }`
- **Actions:**
  1. Check KV for already-sent state; reject if already sent
  2. Fetch the pre-rendered email HTML from the same Cloudflare Pages deployment using a relative fetch to avoid CDN staleness or mid-deploy issues (e.g. `new URL('/newsletter/daily/2026-03-24/email.html', request.url)`). If the fetch fails, return an error — do not send without confirmed email content.
  3. Determine the target Brevo list ID based on collection type
  4. Create a Brevo email campaign with the raw HTML, targeting the appropriate list. Include Brevo's `{{ unsubscribe }}` merge tag in the footer for CAN-SPAM compliance. The preference center link (with tokenized URL) is also in the footer as a secondary management option.
  5. Send campaign
  6. Write sent timestamp to KV
- **Response:** `{ success: true, sentTo: 142 }`

### `POST /api/newsletter-ingest`

- **Purpose:** Pull content from ClickUp and create Keystatic drafts
- **Auth:** Webhook secret (`INGEST_WEBHOOK_SECRET` env var) verified via header or query param
- **Actions:**
  1. Call ClickUp API to fetch new messages from the Super Agent channel (requires `CLICKUP_API_TOKEN` secret)
  2. Parse the content (title, body, date)
  3. Auto-suggest tags from the curated taxonomy based on content keywords (reads `newsletter-tags.json` from the repo via GitHub API)
  4. Format as Markdoc with frontmatter (`draft: true`)
  5. **Idempotency check:** Before committing, query the GitHub API to check if a file for this date/slug already exists in the target directory. If it does, skip the commit to prevent duplicates (handles cron double-fires or webhook replays).
  6. Commit to GitHub repo via GitHub REST API (requires `GITHUB_TOKEN` secret with `contents:write` permission). Creates file in the appropriate content directory (e.g. `src/content/daily-digests/2026-03-24.mdoc`).
  7. Site rebuilds automatically (Cloudflare Pages watches the repo), draft appears in Keystatic
- **Error handling:** If ClickUp API is unavailable or GitHub commit fails, log the error and return a 500 response. For cron-triggered runs, failed ingests should be retried on the next scheduled run. Consider adding an error notification (e.g. Brevo event or Slack webhook) for persistent failures.
- **Trigger:** Cloudflare Cron Trigger (e.g. daily at 6 AM UTC) or ClickUp webhook

## Environment Variables

New secrets and bindings required (added to `wrangler.jsonc`):

```
# Brevo newsletter lists
BREVO_LIST_DAILY=<list-id>
BREVO_LIST_WEEKLY=<list-id>
BREVO_LIST_QUARTERLY=<list-id>

# ClickUp integration
CLICKUP_API_TOKEN=<token>
CLICKUP_CHANNEL_ID=<channel-or-list-id>

# GitHub integration (for ingest worker commits)
GITHUB_TOKEN=<personal-access-token-with-contents-write>

# Ingest webhook auth
INGEST_WEBHOOK_SECRET=<shared-secret>
```

The existing `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `TURNSTILE_SECRET_KEY`, and KV namespace bindings are reused as-is.

## Navigation

Newsletter is added to the main site navigation between "Insights" and "Client Portal". The navigation is defined in `src/components/sections/Nav.astro`.

```
Logo | Approach | Advisory | Insights | Newsletter | Client Portal | [Schedule a Consultation]
```

## Email Templates

Three email templates needed, one per newsletter type. All include:
- AABO Advisory branded header
- Newsletter content rendered as email-safe HTML (table-based layout, inline styles)
- Footer with:
  - Preference center link (tokenized URL for granular management)
  - Brevo `{{ unsubscribe }}` merge tag (required for CAN-SPAM compliance — Brevo will reject campaigns without it)
  - AABO Advisory physical address and contact info
- Quarterly template gets a richer design treatment matching the site's custom quarterly template

Email HTML is pre-rendered at build time (see "Email HTML Pages" under Site Pages). The send endpoint fetches the static asset and passes it to Brevo's campaign API as raw HTML.

## ClickUp Integration

### API Access

- Uses ClickUp API v2
- Auth: ClickUp API token stored as Cloudflare secret (`CLICKUP_API_TOKEN`)
- Reads from a specific channel/list where the Super Agent posts briefs
- Channel/list ID configured as an env var (`CLICKUP_CHANNEL_ID`)

### Content Parsing

The Super Agent produces structured content with consistent formatting:
- Title line (e.g. "Aabo Advisory – Daily Diplomatic Housing Digest")
- Date line
- Overview paragraph
- Numbered stories, each with: title, link, summary, analysis section

The ingest worker parses this structure and converts it to Markdoc format with appropriate headings, links, and paragraph structure.

### Auto-tagging

The ingest worker scans the content for keywords matching the curated tag taxonomy and pre-selects relevant tags in the frontmatter. These are suggestions — the editorial team can adjust tags during review in Keystatic.

## Security

- Subscribe endpoint: Turnstile CAPTCHA + rate limiting (consistent with existing API patterns)
- Preference center: Token-based access (UUID tokens are unguessable, included in email footers) + rate limiting
- Admin panel + send endpoint: Cloudflare Access (zero-trust, email or IdP-based)
- Ingest endpoint: Webhook secret verification
- All new API routes follow the existing rate-limiting pattern via Cloudflare KV

## Future Considerations

- **Client portal integration:** When auth is built, authenticated clients access the preference center directly (email resolved from session, no token needed)
- **Email personalization:** Use subscriber interest data (already captured) to highlight relevant stories in email delivery
- **Analytics:** Track email open rates and click-throughs via Brevo, surface in admin panel
- **RSS feeds:** Generate RSS feeds per newsletter type for subscribers who prefer feed readers
- **SEO:** Add meta title/description to the newsletter archive and individual pages (can be added to the `newsletterPage` singleton if needed)
- **Token rotation:** Preference center tokens are currently permanent. Consider adding token expiry or rotation (e.g. regenerate on each preference update) to limit exposure if a token is leaked via forwarded emails. Low severity since worst case is toggling someone's newsletter preferences.
- **Email masking format:** The preferences API returns masked email as `j***@example.com` (first character + asterisks + @ + full domain)

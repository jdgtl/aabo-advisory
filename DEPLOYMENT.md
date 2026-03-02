# Deployment Guide — AABO Advisory

## Architecture

- **Framework**: Astro 5 with Cloudflare Pages adapter
- **Hosting**: Cloudflare Pages (with Workers for API routes)
- **CI/CD**: GitHub Actions → Cloudflare Pages via `wrangler-action`
- **CMS**: Keystatic (local file-based, content committed to repo)

## CI/CD Pipeline

### How It Works

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push and PR to `main`:

1. **Install** — `npm ci` with Node 22
2. **Type-check** — `npx astro check` validates all `.astro` and `.ts` files
3. **Build** — `npm run build` generates the `dist/` output
4. **Deploy** — On `main` branch only, `wrangler pages deploy` pushes to Cloudflare Pages

PRs to `main` trigger build + type-check (validation only, no deploy). Cloudflare Pages automatically generates preview deploy URLs for PRs when connected to the GitHub repo.

### Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (found in dashboard URL or Overview page) |

## Cloudflare Pages Setup

### 1. Create the Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages → Create application → Pages**
3. Connect your GitHub repository (`jdgtl/aabo-advisory`)
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `22`
5. Save — Cloudflare will run the first build automatically

> **Note**: After the initial setup, deployments are handled by GitHub Actions via `wrangler-action`, not Cloudflare's built-in Git integration. You can disable automatic builds in **Settings → Builds & deployments** to avoid duplicate deploys.

### 2. Configure Custom Domain

1. In Cloudflare Pages project settings, go to **Custom domains**
2. Add `aaboadvisory.com` (and `www.aaboadvisory.com` if desired)
3. If the domain is already on Cloudflare DNS:
   - Cloudflare automatically creates the required CNAME record
4. If the domain is on an external DNS provider:
   - Create a CNAME record: `aaboadvisory.com → aabo-advisory.pages.dev`
   - Create a CNAME record: `www.aaboadvisory.com → aabo-advisory.pages.dev`
5. Wait for SSL certificate provisioning (usually < 5 minutes)

### 3. Configure KV Namespace (Rate Limiting)

The site uses Cloudflare KV for API rate limiting (5 requests/hour/IP on form endpoints).

```bash
# Create the KV namespace
npx wrangler kv namespace create RATE_LIMIT

# Note the ID returned, then update wrangler.jsonc:
# "id": "<paste-the-returned-id-here>"

# For local development, create a preview namespace
npx wrangler kv namespace create RATE_LIMIT --preview
```

Update `wrangler.jsonc` with the returned namespace ID:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "RATE_LIMIT",
      "id": "your-production-namespace-id"
    }
  ]
}
```

### 4. Configure Environment Secrets

Secrets are accessed via the Cloudflare runtime environment (`locals.runtime.env`). Set them using **either** method:

**Option A: Cloudflare Pages Dashboard (recommended)**
1. Go to **Workers & Pages → aabo-advisory → Settings → Environment variables**
2. Add each variable under **Production** (and optionally **Preview**):

| Variable | Description |
|---|---|
| `BREVO_API_KEY` | Brevo API key |
| `BREVO_CONSULTATION_LIST_ID` | Brevo list ID for consultation requests |
| `BREVO_CALCULATOR_LIST_ID` | Brevo list ID for calculator leads |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key (PEM format) |
| `GOOGLE_SHEET_ID` | Google Sheet ID for archival |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `PLAUSIBLE_DOMAIN` | Site domain for Plausible analytics |

3. Mark sensitive values as **Encrypted**

**Option B: Wrangler CLI**
```bash
npx wrangler pages secret put BREVO_API_KEY --project-name=aabo-advisory
npx wrangler pages secret put BREVO_CONSULTATION_LIST_ID --project-name=aabo-advisory
npx wrangler pages secret put BREVO_CALCULATOR_LIST_ID --project-name=aabo-advisory
npx wrangler pages secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --project-name=aabo-advisory
npx wrangler pages secret put GOOGLE_PRIVATE_KEY --project-name=aabo-advisory
npx wrangler pages secret put GOOGLE_SHEET_ID --project-name=aabo-advisory
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name=aabo-advisory
npx wrangler pages secret put PLAUSIBLE_DOMAIN --project-name=aabo-advisory
```

Each command prompts for the secret value interactively.

## Brevo CRM Setup

### 1. Create Contact Lists

Go to **Brevo → Contacts → Lists** and create:

| List Name | Purpose |
|---|---|
| Consultation Requests | Contacts from the contact/consultation form |
| Calculator Leads | Contacts from the calculator lead gate |
| All Contacts | Master list (add both above as sub-lists) |

Note each list's ID — these go into the Cloudflare env secrets as `BREVO_CONSULTATION_LIST_ID` and `BREVO_CALCULATOR_LIST_ID`.

### 2. Create Contact Attributes

Go to **Brevo → Contacts → Settings → Contact attributes & CRM** and create these attributes:

| Attribute Name | Type | Category | Description |
|---|---|---|---|
| `FIRSTNAME` | Text | Normal | *(exists by default)* |
| `LASTNAME` | Text | Normal | *(exists by default)* |
| `COMPANY` | Text | Normal | Organization / mission name |
| `SOURCE` | Text | Normal | Lead source: `consultation` or `calculator` |
| `LEAD_DATE` | Text | Normal | Date of first submission (YYYY-MM-DD) |
| `CALCULATOR_VERDICT` | Text | Normal | `buy` or `rent` |
| `CALCULATOR_SAVINGS` | Text | Normal | Estimated savings (e.g. "$12,345,678") |
| `CALCULATOR_UNITS` | Number | Normal | Number of housing units modeled |
| `CALCULATOR_PRICE_PER_UNIT` | Number | Normal | Price per unit in dollars |
| `CALCULATOR_MONTHLY_RENT` | Number | Normal | Monthly rent in dollars |
| `CALCULATOR_TIMELINE` | Number | Normal | Analysis timeline in years |
| `CALCULATOR_PROPERTY_TYPE` | Text | Normal | Property type (e.g. "condo", "co-op") |
| `LAST_CALCULATOR_DATE` | Text | Normal | Most recent calculator submission (YYYY-MM-DD) |

### 3. Tags Used

The API routes automatically apply these tags to contacts:

| Tag | Applied When |
|---|---|
| `calculator-lead` | Every calculator lead gate submission |
| `consultation-request` | Every consultation form submission |
| `high-value` | Calculator: units > 5 or total price > $3M |
| `repeat-lead` | User submits the calculator gate more than once |

### 4. Automation Workflows

Set up in **Brevo → Automations → Create a workflow**:

#### A. Calculator Lead Welcome Email
- **Trigger:** Contact added to "Calculator Leads" list
- **Wait:** 2 minutes
- **Action:** Send email template using merge variables:
  - `{{ contact.FIRSTNAME }}` — first name
  - `{{ contact.COMPANY }}` — organization
  - `{{ contact.CALCULATOR_VERDICT }}` — buy or rent
  - `{{ contact.CALCULATOR_SAVINGS }}` — savings amount
  - `{{ contact.CALCULATOR_UNITS }}` — number of units
  - `{{ contact.CALCULATOR_TIMELINE }}` — timeline years
  - `{{ contact.CALCULATOR_PRICE_PER_UNIT }}` — price per unit
  - `{{ contact.CALCULATOR_MONTHLY_RENT }}` — monthly rent
- **Example copy:** *"Based on your analysis of {{ contact.CALCULATOR_UNITS }} units at ${{ contact.CALCULATOR_PRICE_PER_UNIT }} per unit, {{ contact.CALCULATOR_VERDICT == 'buy' ? 'ownership' : 'continued leasing' }} appears favorable — with estimated {{ contact.CALCULATOR_VERDICT == 'buy' ? 'savings' : 'additional cost' }} of {{ contact.CALCULATOR_SAVINGS }} over {{ contact.CALCULATOR_TIMELINE }} years."*

#### B. High-Value Lead Alert (to AABO team)
- **Trigger:** Contact has tag `high-value`
- **Action:** Send internal notification email to AABO team
- **Include:** Name, org, email, units, price range, verdict, savings

#### C. Repeat Lead Alert (to AABO team)
- **Trigger:** Contact has tag `repeat-lead`
- **Action:** Send internal notification email
- **Copy:** *"[Name] from [Org] just ran the calculator again — they're actively evaluating."*

#### D. Consultation Request Confirmation
- **Trigger:** Contact added to "Consultation Requests" list
- **Action 1:** Send confirmation email to the contact
- **Action 2:** Send notification email to AABO team with message content

#### E. Calculator → Consultation Nurture Sequence
- **Trigger:** Contact added to "Calculator Leads" list AND NOT in "Consultation Requests" list
- **Condition:** Split by `CALCULATOR_VERDICT`:

**Buy verdict path:**
- **Day 3:** Email — *"What the numbers don't show"* — link to "Pre-Closing Walk-Throughs" article + consultation CTA
- **Day 7:** Email — *"Most missions we advise started exactly where you are"* — link to "Sovereign Advantage of Ownership" article + consultation CTA
- **Day 14:** Final touch — *"Your analysis is still available"* — direct consultation CTA
- **Exit condition:** Contact joins "Consultation Requests" list

**Rent verdict path:**
- **Day 3:** Email — *"The long view on diplomatic housing"* — link to "The 30-Year View" article
- **Day 7:** Email — *"When does ownership make sense?"* — link to "Sovereign Advantage" article + consultation CTA
- **Day 14:** Final touch — direct consultation CTA
- **Exit condition:** Contact joins "Consultation Requests" list

### 5. Google Sheet Column Headers

Add these headers to Row 1 of the "Calculator Leads" sheet tab:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Name | Organization | Email | Status | Verdict | Savings | Units | Price Range | Timeline | Price/Unit | Monthly Rent | Property Type | Common Charges | Property Taxes | Other Charges | Rent Taxes | Broker % | Appreciation % | Rent Growth % | Acquisition % | Disposal % | Maintenance % |

Add these headers to Row 1 of the "Consultation Requests" sheet tab:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Timestamp | Name | Organization | Email | Source | Message |

## Local Development

```bash
# Install dependencies
npm install

# Start Astro dev server (no Cloudflare runtime)
npm run dev

# Build then run with full Cloudflare runtime (KV, secrets, etc.)
npm run build
npm run cf:dev
```

For local development with secrets, create a `.dev.vars` file (git-ignored):

```
TURNSTILE_SECRET_KEY=your_key
BREVO_API_KEY=your_key
BREVO_CONSULTATION_LIST_ID=1
BREVO_CALCULATOR_LIST_ID=2
GOOGLE_SERVICE_ACCOUNT_EMAIL=your@email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your_sheet_id
PLAUSIBLE_DOMAIN=aaboadvisory.com
```

## Smoke Test Checklist

After deployment, verify these items on the production URL:

1. **Homepage** — All 6 sections render, responsive at 320px/768px/1024px/1440px
2. **Navigation** — Scroll tracking highlights correct nav item
3. **Insights repository** — Articles display, category filter works, responsive grid
4. **Article pages** — Drop cap, sidebar, "Continue Reading" links render
5. **Calculator** — All inputs functional, teaser results show freely, lead gate triggers
6. **Contact form** — Submits to Brevo + Google Sheets, Turnstile blocks bots
7. **Brevo CRM** — Contacts appear in correct lists with custom attributes populated
8. **Keystatic admin** — `/keystatic` loads, can create/edit/delete articles
9. **Analytics** — Plausible receives events via `/api/event` proxy
10. **SEO + Lighthouse** — Score 90+ across all categories, OG tags render
11. **JSON-LD** — Passes Google Rich Results Test (Organization, Article, FAQ, etc.)
12. **GEO** — Semantic HTML, FAQ `<details>`/`<summary>`, `<article>` tags
13. **Deployment** — Push to `main` → GitHub Action builds → live at custom domain
14. **Preview deploys** — PR generates preview URL

## Troubleshooting

### Build fails with type errors
Run `npx astro check` locally and fix any reported issues before pushing.

### KV rate limiting not working
Ensure `wrangler.jsonc` has a valid KV namespace ID (not the placeholder). For local testing, use `npm run cf:dev` which enables the Cloudflare runtime.

### Secrets not available at runtime
Verify secrets are set with `npx wrangler pages secret list --project-name=aabo-advisory`. Secrets set via `wrangler pages secret put` are only available in production/preview deployments, not in local dev (use `.dev.vars` for local).

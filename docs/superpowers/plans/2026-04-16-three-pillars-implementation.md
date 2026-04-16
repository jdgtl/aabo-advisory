# Three Pillars Advisory Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three standalone `/advisory/*` pillar pages with editable Keystatic content, primary-nav dropdown, secondary nav, cross-linking, SEO, and analytics — deferring the flagship interactives to a later Phase 2 plan.

**Architecture:** Three Astro pages each reading from its own Keystatic singleton, composing shared pillar-specific components (`PillarHero`, `ServiceBox`, `PullQuote`, `PillarCTA`, `PillarSecondaryNav`) plus two pillar-specific SVG visuals (`TransactionTimeline`, `DashboardIllustration`). Primary `Nav.astro` gets a server-rendered dropdown; `NavClient.tsx` gains hover/focus + mobile-expand behavior.

**Tech Stack:** Astro 5, React 19 islands, Tailwind v4 (CSS-based tokens in `src/styles/global.css`), Keystatic Cloud, Plausible analytics (`src/lib/analytics.ts`), Cloudflare Pages deploy.

**Spec:** `docs/superpowers/specs/2026-04-16-three-pillars-design.md`

**Testing note:** This codebase has no unit-test framework. Verification for each task = `npx astro check` (type-check) + `npm run dev` manual spot-check in the browser. A full `npm run build` runs at the end of each major phase and at the end of the plan.

---

## Pre-Flight

Before any task: start the dev server once in a background terminal and leave it running. Each task that touches `.astro`, `.tsx`, or JSON content hot-reloads. Visit the listed URL to verify after each implementation step.

```bash
npm run dev
# Opens at http://localhost:4321
```

Run `npx astro check` between tasks when types change. Run `npm run build` at the phase boundaries called out below.

---

## Phase 1: Foundation (data, tokens, helpers)

### Task 1: Add `--color-quote` design token

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add the new token to the `@theme` block**

Open `src/styles/global.css`. Inside the `@theme { ... }` block (between lines 7–27), add one line after `--color-green` / `--color-red`:

```css
  --color-quote: #F0E8D8;
```

The complete `@theme` block should now include:

```css
@theme {
  --color-primary: #0F1B2D;
  --color-secondary: #1A2D47;
  --color-text: #1A1A1A;
  --color-accent: #B8965A;
  --color-accent-light: #D4B87A;
  --color-warm: #C8B89A;
  --color-mid: #E8DFD0;
  --color-light: #F5F0E8;
  --color-canvas: #FAF8F5;
  --color-green: #4A7C59;
  --color-red: #8B3A3A;
  --color-quote: #F0E8D8;

  --font-heading: "Playfair Display", Georgia, serif;
  --font-body: "DM Sans", sans-serif;
  /* ...rest unchanged... */
}
```

- [ ] **Step 2: Verify Tailwind picks up the token**

The dev server is running. In DevTools, on any page, evaluate:

```js
getComputedStyle(document.body).getPropertyValue('--color-quote')
```

Expected: `" #F0E8D8"` (possibly with leading space).

Alternatively, verify that `bg-quote` is a usable utility class by temporarily adding `bg-quote` to any element — it should render with `#F0E8D8`. Revert the test change.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(styles): add --color-quote token for advisory pull quotes"
```

---

### Task 2: Add `servicePageJsonLd` helper

**Files:**
- Modify: `src/lib/jsonld.ts`

- [ ] **Step 1: Add the new helper after the `professionalServiceJsonLd` function**

Open `src/lib/jsonld.ts`. After the closing `}` of `professionalServiceJsonLd` (line 110) and before the `/* ── 4. Article ── */` comment block, insert:

```ts
/* ── 3b. Service (advisory pillar pages) ── */

export interface ServicePageJsonLdInput {
  name: string;
  description: string;
  url: string;
}

export function servicePageJsonLd(input: ServicePageJsonLdInput) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: input.url,
    provider: {
      "@type": "ProfessionalService",
      name: ORG_NAME,
      url: SITE_URL,
    },
    areaServed,
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no errors. (There may be unrelated pre-existing warnings — ignore those; only new errors matter.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/jsonld.ts
git commit -m "feat(jsonld): add servicePageJsonLd helper for advisory pages"
```

---

### Task 3: Extend analytics with Advisory events

**Files:**
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Add new event types and tracker functions**

Open `src/lib/analytics.ts`. Extend the `AnalyticsEvent` union (lines 6–17):

```ts
type AnalyticsEvent =
  | "Calculator:Started"
  | "Calculator:GateShown"
  | "Calculator:LeadCaptured"
  | "Calculator:GateSkipped"
  | "Calculator:FullResultsViewed"
  | "Contact:ModalOpened"
  | "Contact:Submitted"
  | "Article:Opened"
  | "CTA:Clicked"
  | "Calculator:PDFDownloaded"
  | "Calculator:ResultsEmailed"
  | "Advisory:CTAClicked"
  | "Advisory:CrossLinkClicked"
  | "Advisory:NavDropdownOpened";
```

At the bottom of the file (after `trackResultsEmailed`), add:

```ts
export function trackAdvisoryCTAClicked(pillar: string, location: string): void {
  trackEvent("Advisory:CTAClicked", { pillar, location });
}

export function trackAdvisoryCrossLinkClicked(
  pillar: string,
  targetHref: string,
  label: string,
): void {
  trackEvent("Advisory:CrossLinkClicked", { pillar, targetHref, label });
}

export function trackAdvisoryNavDropdownOpened(source: "desktop" | "mobile"): void {
  trackEvent("Advisory:NavDropdownOpened", { source });
}
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "feat(analytics): add Advisory event trackers"
```

---

### Task 4: Register three Keystatic singletons

**Files:**
- Modify: `keystatic.config.ts`

- [ ] **Step 1: Define a reusable advisory schema and register three singletons**

Open `keystatic.config.ts`. Before the `export default config({ ... })` call, add this helper (after the `const tagOptions = getTagOptions();` line, at the top of the file body):

```ts
const advisorySchema = {
  seo: fields.object(
    {
      title: fields.text({ label: "SEO Title" }),
      description: fields.text({ label: "SEO Description", multiline: true }),
    },
    { label: "SEO" },
  ),
  hero: fields.object(
    {
      numeral: fields.text({ label: "Numeral (I / II / III)" }),
      title: fields.text({ label: "Title" }),
      subtitle: fields.text({ label: "Subtitle" }),
      intro: fields.text({ label: "Intro Paragraph 1", multiline: true }),
      introSecondary: fields.text({ label: "Intro Paragraph 2", multiline: true }),
    },
    { label: "Hero" },
  ),
  services: fields.array(
    fields.object({
      headline: fields.text({ label: "Headline" }),
      body: fields.text({ label: "Body", multiline: true }),
    }),
    {
      label: "Service Boxes",
      itemLabel: (props) => props.fields.headline.value,
    },
  ),
  pullQuote: fields.object(
    {
      text: fields.text({ label: "Pull Quote Text", multiline: true }),
    },
    { label: "Pull Quote" },
  ),
  cta: fields.object(
    {
      headline: fields.text({ label: "CTA Headline" }),
      buttonText: fields.text({ label: "Button Text" }),
    },
    { label: "CTA" },
  ),
  crossLinks: fields.array(
    fields.object({
      label: fields.text({ label: "Label" }),
      href: fields.text({ label: "Href" }),
    }),
    {
      label: "Cross Links",
      itemLabel: (props) => props.fields.label.value,
    },
  ),
};
```

Then inside the `singletons: { ... }` object (after `newsletterTags` or anywhere in the block), add three singleton registrations:

```ts
    advisoryStrategicHousing: singleton({
      label: "Advisory — Strategic Housing",
      path: "src/content/advisory-strategic-housing",
      format: { data: "json" },
      schema: advisorySchema,
    }),

    advisoryTransactionRepresentation: singleton({
      label: "Advisory — Transaction & Representation",
      path: "src/content/advisory-transaction-representation",
      format: { data: "json" },
      schema: advisorySchema,
    }),

    advisoryOperationalStewardship: singleton({
      label: "Advisory — Operational Stewardship",
      path: "src/content/advisory-operational-stewardship",
      format: { data: "json" },
      schema: advisorySchema,
    }),
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no errors. (Singletons referenced in `content.ts` will error out until Task 8 — that's OK as long as `keystatic.config.ts` itself type-checks.)

- [ ] **Step 3: Commit**

```bash
git add keystatic.config.ts
git commit -m "feat(cms): register three advisory pillar singletons"
```

---

### Task 5: Seed Pillar I content (Strategic Housing Advisory)

**Files:**
- Create: `src/content/advisory-strategic-housing.json`

- [ ] **Step 1: Create the file with seed content from the content spec**

Create `src/content/advisory-strategic-housing.json` with the following content:

```json
{
  "seo": {
    "title": "Strategic Housing Advisory | Aabo Advisory",
    "description": "Institutional-grade real estate advisory for diplomatic missions — portfolio strategy, rent vs. buy analysis, financial modeling, and long-term staff housing planning."
  },
  "hero": {
    "numeral": "I",
    "title": "Strategic Housing Advisory",
    "subtitle": "Portfolio Performance and Optimization",
    "intro": "Every diplomatic mission operates a real estate portfolio. Residences, offices, and representational spaces represent significant sovereign capital deployed across some of the world's most complex markets. Yet many missions manage these assets without the analytical frameworks that private organizations and institutional investors would consider fundamental.",
    "introSecondary": "Strategic Housing Advisory brings institutional-grade analysis to diplomatic real estate. We help missions and headquarters see their property holdings not as a series of isolated transactions, but as a portfolio with measurable performance, identifiable inefficiencies, and strategic optionality. The goal is not to impose a corporate model on sovereign operations. It is to give decision-makers the clarity and tools needed to act with confidence."
  },
  "services": [
    {
      "headline": "Rent vs. Buy Analysis",
      "body": "The decision to rent or purchase diplomatic property is among the most consequential a mission will make — and among the least reversible. Financial modelling compares the total cost of ownership against long-term leasing, accounting for variables that general market tools ignore: diplomatic tax exemptions, maintenance obligations unique to sovereign-owned buildings, currency exposure, and the political calculus of asset ownership in a host country. The output is not a spreadsheet. It is a clear recommendation rooted in your mission's specific mandate, timeline, and fiscal framework."
    },
    {
      "headline": "Portfolio Strategy",
      "body": "Often property is accumulated without a governing strategy, rather inherited from a predecessor or decided on a temporary need. These assets become the portfolio by default. We work with missions and headquarters to build intentional portfolio strategies: defining the optimal mix of owned and leased assets, identifying underperforming holdings, evaluating consolidation opportunities, and aligning real estate decisions with broader institutional objectives. Every property should serve a purpose. We help you determine what that purpose is and what action to take in order to optimize the portfolio performance."
    },
    {
      "headline": "Financial Modeling & Policy Support",
      "body": "Diplomatic property decisions require financial analysis calibrated to sovereign realities. Standard commercial models do not account for the fiscal structures, approval processes, or time horizons that govern how government acquires and holds real estate. We build custom financial models for acquisitions, disposals, and major capital expenditures — and we translate them into the language that policy officers and treasury departments require. When a headquarters needs to justify an acquisition to a parliamentary budget committee, the supporting analysis must be unassailable."
    },
    {
      "headline": "Long-Term Planning for Staff Housing",
      "body": "Staff housing is typically the largest line item in a mission's real estate budget and the most operationally sensitive. Rotating personnel every three to four years creates a continuous cycle of demand that many manage reactively. We help missions plan proactively: forecasting staffing changes, mapping housing supply in target neighborhoods, modeling budget scenarios across economic cycles, and building frameworks that outlast any single rotation. The result is a housing program that serves the institution — not just the current occupant."
    }
  ],
  "pullQuote": {
    "text": "A diplomatic portfolio is not a collection of addresses. It is an expression of institutional strategy, built over decades and measured across generations of service. The question is never simply where to house staff — it is how to position mission and assets for the next thirty years of service."
  },
  "cta": {
    "headline": "Discuss your portfolio strategy",
    "buttonText": "Schedule a Consultation"
  },
  "crossLinks": [
    {
      "label": "Read: A 30-Year Lens for HQ Approval",
      "href": "/insights/a-30-year-lens-for-hq-approval"
    },
    {
      "label": "Next: Transaction & Representation →",
      "href": "/advisory/transaction-representation"
    }
  ]
}
```

- [ ] **Step 2: Verify Keystatic reader resolves the singleton**

With the dev server running, open `http://localhost:4321/keystatic` and confirm "Advisory — Strategic Housing" appears in the singletons list and opens with populated fields. (If Keystatic cloud auth is required and not set up locally, skip this and rely on the build-time check in Phase 1 closing.)

- [ ] **Step 3: Commit**

```bash
git add src/content/advisory-strategic-housing.json
git commit -m "content: seed Pillar I (Strategic Housing Advisory)"
```

---

### Task 6: Seed Pillar II content (Transaction & Representation)

**Files:**
- Create: `src/content/advisory-transaction-representation.json`

- [ ] **Step 1: Create the file with seed content**

Create `src/content/advisory-transaction-representation.json`:

```json
{
  "seo": {
    "title": "Transaction & Representation | Aabo Advisory",
    "description": "Full-cycle diplomatic real estate transaction management — acquisitions, disposals, leasing, off-market sourcing, negotiation, and closing oversight for sovereign clients."
  },
  "hero": {
    "numeral": "II",
    "title": "Transaction & Representation",
    "subtitle": "Full Cycle Transaction Management",
    "intro": "When a diplomatic mission enters a real estate transaction, it does so under conditions unlike any other buyer, seller, or tenant. Sovereign immunity, tax-exempt status, multi-year approval processes, security requirements, host-country regulations. Every transaction requires understanding of both the deal mechanics and the institutional context surrounding it.",
    "introSecondary": "Aabo Advisory provides full-cycle transaction management for diplomatic clients. From the earliest identification of opportunity through negotiation, execution, and closing, we represent missions with the precision, discretion, and strategic judgment that sovereign transactions demand."
  },
  "services": [
    {
      "headline": "Acquisitions, Disposals & Leasing",
      "body": "Whether a mission is acquiring its first property in a new capital, disposing of a legacy asset that no longer serves its mandate, or negotiating a lease for staff housing, the fundamentals of representation remain the same: deep market knowledge, disciplined process, and unwavering alignment with client interests. Through vetted local partners Aabo Advisory supports and executes all transaction types across the full spectrum of diplomatic real estate — chanceries, residences, staff apartments, and representational spaces — in markets where we have direct experience and established relationships."
    },
    {
      "headline": "New Development & Off-Market Sourcing",
      "body": "The optimal diplomatic properties may not always be listed on the open market. A purpose-built chancery site, a townhouse suitable for an ambassador's residence, a development opportunity in an emerging diplomatic quarter, require relationships, local intelligence, and the credibility to engage private sellers and developers before a property reaches the public. We maintain active sourcing networks in our most markets and have the development expertise to evaluate new construction and conversion opportunities from feasibility through delivery."
    },
    {
      "headline": "Negotiation & Execution",
      "body": "Diplomatic transactions are rarely simple. They involve multiple stakeholders, competing priorities, and timelines that extend well beyond commercial norms. A negotiation may span two budget cycles. An approval often requires sign-off from a capital thousands of miles away. Counterparties may not understand sovereign process — and may even attempt to exploit it. We bring structure, pace, and strategic discipline to every negotiation. We know when to press and when to hold. And we ensure that the terms agreed at the table are the terms that appear in the contract."
    },
    {
      "headline": "Closing Oversight & Risk Mitigation",
      "body": "The period between contract execution and closing is where transactions are most vulnerable. Title issues, financing conditions, inspection findings, regulatory approvals, last-minute counterparty changes — any one of these can derail a deal that took months to negotiate. We manage the closing process with the same rigor we bring to the negotiation: tracking every condition, coordinating with legal counsel and title companies, ensuring compliance with host-country requirements, and maintaining a clear line of communication between all parties. Nothing closes without our review."
    }
  ],
  "pullQuote": {
    "text": "In diplomatic real estate, every transaction carries institutional weight. A purchase is not simply an acquisition — it is a sovereign commitment to a location, a neighborhood, and a relationship with the host country that may endure for generations. The representation must match the stakes."
  },
  "cta": {
    "headline": "Discuss a transaction",
    "buttonText": "Schedule a Consultation"
  },
  "crossLinks": [
    {
      "label": "Our strategic advisory often precedes a transaction →",
      "href": "/advisory/strategic-housing"
    },
    {
      "label": "After closing, our work continues →",
      "href": "/advisory/operational-stewardship"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/advisory-transaction-representation.json
git commit -m "content: seed Pillar II (Transaction & Representation)"
```

---

### Task 7: Seed Pillar III content (Operational Stewardship)

**Files:**
- Create: `src/content/advisory-operational-stewardship.json`

- [ ] **Step 1: Create the file with seed content**

Create `src/content/advisory-operational-stewardship.json`:

```json
{
  "seo": {
    "title": "Operational Stewardship | Aabo Advisory",
    "description": "Proactive, ongoing advisory for diplomatic missions' real estate portfolios — post-closing oversight, vendor coordination, asset performance monitoring, and market intelligence."
  },
  "hero": {
    "numeral": "III",
    "title": "Operational Stewardship",
    "subtitle": "Proactive, Ongoing Support",
    "intro": "Closing day is not the finish line. For a diplomatic mission, it is the beginning of a decades-long relationship with a property — and with the market it sits within. The residence that was the right acquisition in 2024 must still be the right asset in 2034 and 2044. That requires attention, judgment, and a partner who remains engaged long after the transaction closes.",
    "introSecondary": "Aabo Advisory's Operational Stewardship provides the ongoing support that diplomatic properties require. The strategic layer above day-to-day management: monitoring performance, anticipating issues, coordinating specialized vendors, and ensuring that the asset continues to serve a mission's evolving needs. This is the institutional memory that survives every rotation."
  },
  "services": [
    {
      "headline": "Post-Closing Oversight",
      "body": "The first twelve months after a property acquisition are critical. Warranty periods expire. Construction defects surface. Systems require commissioning and adjustment. Vendor relationships must be established. Aabo Advisory provides structured post-closing oversight that ensures nothing falls through the cracks during this transition period — managing punch lists, coordinating with contractors, reviewing warranty claims, and establishing the maintenance cadence that will govern the property for years to come. The goal is a clean handoff to steady-state operations, not a slow discovery of deferred problems."
    },
    {
      "headline": "Vendor & Issue Coordination",
      "body": "Diplomatic properties present maintenance and service challenges that residential and commercial buildings do not. Security systems require specialized contractors. Historic or landmark buildings demand qualified restoration firms. Issues that arise in sovereign-owned property often involve sensitivities around access, scheduling, and confidentiality that standard property managers are not equipped to handle. We maintain a vetted network of service providers experienced in diplomatic work and coordinate issue resolution with discretion and efficiency."
    },
    {
      "headline": "Ongoing Asset Performance Monitoring",
      "body": "A property's value and utility are not static. Markets shift. Neighborhoods evolve. Building systems age. A residence that was ideally positioned a decade ago may now sit in a declining area — or an appreciating one. We monitor assets against market benchmarks continuously: tracking valuation trends, comparing operating costs to portfolio norms, flagging capital expenditure needs before they become emergencies, and providing the data necessary for informed hold-or-dispose decisions. Stewardship, at its core, is the discipline of paying attention."
    },
    {
      "headline": "Market Intelligence & Insights",
      "body": "Our clients do not operate in isolation, and neither do we. Aabo Advisory publishes regular market intelligence tailored to the diplomatic community — covering pricing trends, regulatory changes, neighborhood shifts, and macroeconomic factors that affect real estate strategy. This is not generic market commentary. It is analysis built specifically for the institutions that hold property as sovereign assets in global capitals. Our insights inform decisions both at mission and at headquarters, and they ensure our clients are never surprised by a market they are active in."
    }
  ],
  "pullQuote": {
    "text": "The most valuable thing an advisor can offer a diplomatic mission is not a transaction — it is continuity. What endures is the advisory relationship: the institutional knowledge, the ongoing vigilance, and the commitment to seeing every decision through its full lifecycle."
  },
  "cta": {
    "headline": "Discuss ongoing advisory",
    "buttonText": "Schedule a Consultation"
  },
  "crossLinks": [
    {
      "label": "Explore our latest market intelligence →",
      "href": "/insights"
    },
    {
      "label": "Subscribe to the Aabo Newsletter →",
      "href": "/newsletter"
    },
    {
      "label": "Every engagement begins with strategy →",
      "href": "/advisory/strategic-housing"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/advisory-operational-stewardship.json
git commit -m "content: seed Pillar III (Operational Stewardship)"
```

---

### Task 8: Add advisory loaders to `content.ts`

**Files:**
- Modify: `src/lib/content.ts`

- [ ] **Step 1: Append three loader functions**

Open `src/lib/content.ts`. At the end of the file (after `getArticle`), add:

```ts
export async function getAdvisoryStrategicHousing() {
  return await reader.singletons.advisoryStrategicHousing.read();
}

export async function getAdvisoryTransactionRepresentation() {
  return await reader.singletons.advisoryTransactionRepresentation.read();
}

export async function getAdvisoryOperationalStewardship() {
  return await reader.singletons.advisoryOperationalStewardship.read();
}
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no errors. The Keystatic reader's typings should resolve the three singleton keys registered in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/lib/content.ts
git commit -m "feat(content): add advisory pillar loaders"
```

---

### Phase 1 Build Gate

- [ ] **Run `npm run build` — must succeed.**

```bash
npm run build
```

Expected: `dist/` regenerates cleanly. No page-rendering changes yet (pages land in Phase 3), but the config, loaders, helpers, and new token all compile. If the build fails here, fix the underlying issue before moving to Phase 2.

---

## Phase 2: Shared Pillar Components

Each component is a fresh `.astro` file under `src/components/sections/advisory/`. Create the directory once:

```bash
mkdir -p src/components/sections/advisory
```

### Task 9: `ServiceBox.astro`

**Files:**
- Create: `src/components/sections/advisory/ServiceBox.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  headline: string;
  body: string;
  index?: number;
}

const { headline, body, index = 0 } = Astro.props;
---

<article
  class="bg-canvas border-l-[3px] border-accent px-6 py-8 sm:px-8 sm:py-10 mb-6 last:mb-0"
  data-advisory-service-box
  style={`--stagger-delay: ${index * 0.08}s`}
>
  <h3 class="font-heading text-xl lg:text-[24px] font-bold text-primary mb-3.5 leading-[1.25]">
    {headline}
  </h3>
  <p class="text-[15px] lg:text-base leading-[1.7] text-text/75">
    {body}
  </p>
</article>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/ServiceBox.astro
git commit -m "feat(advisory): add ServiceBox component"
```

---

### Task 10: `PullQuote.astro`

**Files:**
- Create: `src/components/sections/advisory/PullQuote.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  text: string;
}

const { text } = Astro.props;
---

<section
  class="px-6 sm:px-10 md:px-16 lg:px-20 py-20 lg:py-28"
  style="background-color: var(--color-quote);"
>
  <div class="max-w-[720px] mx-auto border-l-[3px] border-accent pl-6 sm:pl-8">
    <blockquote
      class="font-heading italic text-[22px] sm:text-[26px] lg:text-[28px] leading-[1.45] text-primary"
    >
      {text}
    </blockquote>
  </div>
</section>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/PullQuote.astro
git commit -m "feat(advisory): add PullQuote component"
```

---

### Task 11: `PillarSecondaryNav.astro`

**Files:**
- Create: `src/components/sections/advisory/PillarSecondaryNav.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  active: "I" | "II" | "III";
}

const { active } = Astro.props;

const pillars = [
  { numeral: "I", name: "Strategic Housing Advisory", href: "/advisory/strategic-housing" },
  { numeral: "II", name: "Transaction & Representation", href: "/advisory/transaction-representation" },
  { numeral: "III", name: "Operational Stewardship", href: "/advisory/operational-stewardship" },
] as const;
---

<nav
  aria-label="Pillar pages"
  class="bg-canvas border-b border-accent/20 px-6 md:px-12 lg:px-20 py-4"
>
  <div class="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
    <a
      href="/#services"
      class="text-[12px] tracking-[0.08em] text-primary/70 hover:text-primary transition-colors duration-300"
    >
      ← Back to Advisory Services
    </a>

    <ul class="flex items-center gap-5 sm:gap-7">
      {pillars.map((p) => {
        const isActive = p.numeral === active;
        return (
          <li>
            {isActive ? (
              <span
                class="font-heading text-[15px] text-primary border-b-[1.5px] border-accent pb-0.5"
                aria-current="page"
                title={p.name}
              >
                {p.numeral}
              </span>
            ) : (
              <a
                href={p.href}
                class="font-heading text-[15px] text-primary/50 hover:text-primary transition-colors duration-300"
                title={p.name}
              >
                {p.numeral}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  </div>
</nav>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/PillarSecondaryNav.astro
git commit -m "feat(advisory): add PillarSecondaryNav component"
```

---

### Task 12: `PillarHero.astro`

**Files:**
- Create: `src/components/sections/advisory/PillarHero.astro`

- [ ] **Step 1: Create the component**

```astro
---
import Label from "@/components/ui/Label.astro";
import LineReveal from "@/components/ui/LineReveal.astro";

interface Props {
  numeral: string;
  title: string;
  subtitle: string;
  intro: string;
  introSecondary: string;
}

const { numeral, title, subtitle, intro, introSecondary } = Astro.props;
---

<section class="relative overflow-hidden bg-canvas px-6 md:px-12 lg:px-20 pt-16 lg:pt-24 pb-14 lg:pb-20">
  {/* Decorative watermark numeral */}
  <span
    aria-hidden="true"
    role="presentation"
    class="pointer-events-none select-none absolute right-4 lg:right-10 top-2 lg:top-8 font-heading font-bold leading-none text-primary/[0.08]"
    style="font-size: clamp(180px, 28vw, 320px);"
  >
    {numeral}
  </span>

  <div class="relative z-[1] max-w-[1100px] mx-auto">
    <Label text={`Advisory · Pillar ${numeral}`} />

    <h1 class="font-heading text-[34px] sm:text-[42px] lg:text-[52px] font-bold text-primary leading-[1.1] mb-4 max-w-[820px]">
      {title}
    </h1>

    <LineReveal width={48} class="mb-5" />

    <p class="text-[13px] sm:text-sm tracking-[0.04em] italic text-accent mb-8 uppercase font-medium">
      {subtitle}
    </p>

    <div class="max-w-[680px] space-y-5">
      <p class="text-[17px] sm:text-[18px] leading-[1.7] text-text/85">
        {intro}
      </p>
      <p class="text-[15px] sm:text-base leading-[1.7] text-text/70">
        {introSecondary}
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/PillarHero.astro
git commit -m "feat(advisory): add PillarHero component with watermark numeral"
```

---

### Task 13: `PillarCTA.astro`

**Files:**
- Create: `src/components/sections/advisory/PillarCTA.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface CrossLink {
  label: string;
  href: string;
}

interface Props {
  headline: string;
  buttonText: string;
  crossLinks: CrossLink[];
  pillarSlug: string;
}

const { headline, buttonText, crossLinks, pillarSlug } = Astro.props;
---

<section class="relative overflow-hidden bg-primary px-6 md:px-12 lg:px-20 py-16 lg:py-24 text-center">
  {/* Radial gradient overlay (matches homepage CTABanner treatment) */}
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1A2D4755_0%,transparent_70%)]" />

  <div class="relative z-[1] max-w-[700px] mx-auto">
    <h2 class="font-heading text-[26px] sm:text-[28px] lg:text-[32px] font-bold text-canvas mb-8 leading-[1.2]">
      {headline}
    </h2>

    <a
      href="/#contact"
      data-advisory-cta
      data-pillar={pillarSlug}
      class="inline-block border border-accent text-canvas px-8 sm:px-11 py-3.5 text-[11px] tracking-[0.16em] uppercase font-body font-medium
             transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-accent hover:text-primary hover:-translate-y-px cursor-pointer"
    >
      {buttonText}
    </a>

    {crossLinks.length > 0 && (
      <ul class="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4 sm:gap-6 text-[13px]">
        {crossLinks.map((link) => (
          <li>
            <a
              href={link.href}
              data-advisory-crosslink
              data-pillar={pillarSlug}
              data-label={link.label}
              class="text-accent hover:text-accent-light transition-colors duration-300 underline-offset-4 hover:underline"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    )}
  </div>
</section>

<script>
  import {
    trackAdvisoryCTAClicked,
    trackAdvisoryCrossLinkClicked,
  } from "@/lib/analytics";

  function wireAdvisoryCTA() {
    document.querySelectorAll<HTMLAnchorElement>("[data-advisory-cta]").forEach((el) => {
      if (el.dataset.wired === "1") return;
      el.dataset.wired = "1";
      el.addEventListener("click", () => {
        const pillar = el.dataset.pillar ?? "unknown";
        trackAdvisoryCTAClicked(pillar, "cta-banner");
      });
    });

    document.querySelectorAll<HTMLAnchorElement>("[data-advisory-crosslink]").forEach((el) => {
      if (el.dataset.wired === "1") return;
      el.dataset.wired = "1";
      el.addEventListener("click", () => {
        const pillar = el.dataset.pillar ?? "unknown";
        const href = el.getAttribute("href") ?? "";
        const label = el.dataset.label ?? "";
        trackAdvisoryCrossLinkClicked(pillar, href, label);
      });
    });
  }

  wireAdvisoryCTA();
  document.addEventListener("astro:page-load", wireAdvisoryCTA);
</script>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/PillarCTA.astro
git commit -m "feat(advisory): add PillarCTA with cross-links and analytics"
```

---

### Task 14: `TransactionTimeline.astro` (Pillar II only)

**Files:**
- Create: `src/components/sections/advisory/TransactionTimeline.astro`

- [ ] **Step 1: Create the component**

```astro
---
const stages = [
  "Sourcing",
  "Negotiation",
  "Contract",
  "Closing",
  "Handoff",
];
---

<section
  aria-label="Transaction lifecycle"
  class="bg-canvas px-6 md:px-12 lg:px-20 pb-10 lg:pb-14"
>
  <div class="max-w-[1100px] mx-auto">
    <svg
      viewBox="0 0 1100 72"
      class="w-full h-auto"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Transaction lifecycle: sourcing through handoff</title>
      <desc>
        Five-stage horizontal timeline showing the full-cycle representation
        process: sourcing, negotiation, contract, closing, and handoff.
      </desc>
      {/* Connector line */}
      <line x1="80" y1="24" x2="1020" y2="24" stroke="#E8DFD0" stroke-width="1" />
      {stages.map((label, i) => {
        const x = 80 + (i * (940 / (stages.length - 1)));
        return (
          <>
            <circle cx={x} cy={24} r={8} fill="#B8965A" />
            <text
              x={x}
              y={56}
              text-anchor="middle"
              font-family="DM Sans, sans-serif"
              font-size="11"
              font-weight="500"
              letter-spacing="0.12em"
              fill="#0F1B2D"
              style="text-transform: uppercase;"
            >
              {label}
            </text>
          </>
        );
      })}
    </svg>
  </div>
</section>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/TransactionTimeline.astro
git commit -m "feat(advisory): add TransactionTimeline SVG (Pillar II)"
```

---

### Task 15: `DashboardIllustration.astro` (Pillar III only)

**Files:**
- Create: `src/components/sections/advisory/DashboardIllustration.astro`

- [ ] **Step 1: Create the component**

```astro
---
---

<section
  aria-label="Sample quarterly monitoring dashboard"
  class="bg-canvas px-6 md:px-12 lg:px-20 py-10 lg:py-14"
>
  <div class="max-w-[720px] mx-auto border border-mid bg-canvas p-6 sm:p-8 rounded-sm">
    <svg
      viewBox="0 0 640 320"
      class="w-full h-auto"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Illustrative quarterly portfolio monitoring report</title>
      <desc>
        Abstract representation of the quarterly monitoring report clients
        receive — performance tiles, trend lines, and a summary band.
      </desc>

      {/* Header bar */}
      <rect x="0" y="0" width="640" height="28" fill="#0F1B2D" />
      <text
        x="16"
        y="18"
        font-family="Playfair Display, serif"
        font-size="12"
        font-weight="700"
        fill="#FAF8F5"
        letter-spacing="0.1em"
      >
        QUARTERLY PORTFOLIO REPORT
      </text>
      <text
        x="624"
        y="18"
        text-anchor="end"
        font-family="DM Sans, sans-serif"
        font-size="10"
        fill="#B8965A"
        letter-spacing="0.1em"
      >
        Q1 · DRAFT
      </text>

      {/* Tiles row 1 */}
      <g transform="translate(0, 48)">
        <rect x="0" y="0" width="200" height="100" fill="#F5F0E8" stroke="#E8DFD0" />
        <text x="16" y="22" font-family="DM Sans, sans-serif" font-size="9" fill="#0F1B2D" letter-spacing="0.15em">PORTFOLIO VALUE</text>
        <text x="16" y="56" font-family="Playfair Display, serif" font-size="24" font-weight="700" fill="#0F1B2D">$—</text>
        <polyline points="16,88 48,82 80,76 112,70 144,66 176,62" stroke="#B8965A" stroke-width="1.5" fill="none" />

        <rect x="220" y="0" width="200" height="100" fill="#F5F0E8" stroke="#E8DFD0" />
        <text x="236" y="22" font-family="DM Sans, sans-serif" font-size="9" fill="#0F1B2D" letter-spacing="0.15em">OP COSTS</text>
        <text x="236" y="56" font-family="Playfair Display, serif" font-size="24" font-weight="700" fill="#0F1B2D">—</text>
        <rect x="236" y="72" width="16" height="18" fill="#B8965A" opacity="0.6" />
        <rect x="258" y="68" width="16" height="22" fill="#B8965A" opacity="0.7" />
        <rect x="280" y="62" width="16" height="28" fill="#B8965A" opacity="0.8" />
        <rect x="302" y="58" width="16" height="32" fill="#B8965A" />
        <rect x="324" y="64" width="16" height="26" fill="#B8965A" opacity="0.85" />

        <rect x="440" y="0" width="200" height="100" fill="#F5F0E8" stroke="#E8DFD0" />
        <text x="456" y="22" font-family="DM Sans, sans-serif" font-size="9" fill="#0F1B2D" letter-spacing="0.15em">CAPEX FORECAST</text>
        <text x="456" y="56" font-family="Playfair Display, serif" font-size="24" font-weight="700" fill="#0F1B2D">—</text>
        <circle cx="480" cy="82" r="8" fill="#B8965A" />
        <circle cx="510" cy="82" r="6" fill="#B8965A" opacity="0.5" />
        <circle cx="535" cy="82" r="4" fill="#B8965A" opacity="0.3" />
      </g>

      {/* Summary band */}
      <g transform="translate(0, 176)">
        <rect x="0" y="0" width="640" height="64" fill="#FAF8F5" stroke="#E8DFD0" />
        <line x1="16" y1="20" x2="624" y2="20" stroke="#E8DFD0" stroke-width="1" />
        <line x1="16" y1="36" x2="500" y2="36" stroke="#E8DFD0" stroke-width="1" />
        <line x1="16" y1="52" x2="560" y2="52" stroke="#E8DFD0" stroke-width="1" />
      </g>

      {/* Action row */}
      <g transform="translate(0, 256)">
        <rect x="0" y="0" width="308" height="56" fill="#F5F0E8" stroke="#E8DFD0" />
        <text x="16" y="22" font-family="DM Sans, sans-serif" font-size="9" fill="#0F1B2D" letter-spacing="0.15em">FLAGGED</text>
        <line x1="16" y1="38" x2="290" y2="38" stroke="#8B3A3A" stroke-width="1" />

        <rect x="328" y="0" width="312" height="56" fill="#F5F0E8" stroke="#E8DFD0" />
        <text x="344" y="22" font-family="DM Sans, sans-serif" font-size="9" fill="#0F1B2D" letter-spacing="0.15em">ACTION ITEMS</text>
        <line x1="344" y1="38" x2="620" y2="38" stroke="#4A7C59" stroke-width="1" />
      </g>
    </svg>

    <p class="mt-4 text-[12px] text-text/50 text-center italic">
      Illustrative — actual reports are tailored to each portfolio.
    </p>
  </div>
</section>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/DashboardIllustration.astro
git commit -m "feat(advisory): add DashboardIllustration SVG (Pillar III)"
```

---

## Phase 3: Pages

### Task 16: Pillar I page — Strategic Housing Advisory

**Files:**
- Create: `src/pages/advisory/strategic-housing.astro`

- [ ] **Step 1: Create the page**

```astro
---
import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import RevealWrapper from "@/components/ui/RevealWrapper";
import PillarSecondaryNav from "@/components/sections/advisory/PillarSecondaryNav.astro";
import PillarHero from "@/components/sections/advisory/PillarHero.astro";
import ServiceBox from "@/components/sections/advisory/ServiceBox.astro";
import PullQuote from "@/components/sections/advisory/PullQuote.astro";
import PillarCTA from "@/components/sections/advisory/PillarCTA.astro";
import { getAdvisoryStrategicHousing } from "@/lib/content";
import { servicePageJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { site } from "@/lib/constants";

const data = await getAdvisoryStrategicHousing();

if (!data) {
  throw new Error("Missing advisoryStrategicHousing singleton");
}

const pageUrl = `${site.url}/advisory/strategic-housing`;
const jsonld = [
  servicePageJsonLd({
    name: data.hero.title,
    description: data.seo.description,
    url: pageUrl,
  }),
  breadcrumbJsonLd([
    { name: "Home", url: site.url },
    { name: "Advisory Services", url: `${site.url}/#services` },
    { name: data.hero.title },
  ]),
];
---

<Base
  title={data.seo.title}
  description={data.seo.description}
  jsonld={jsonld}
>
  <Nav />
  <PillarSecondaryNav active="I" />

  <main id="main-content" class="bg-canvas">
    <PillarHero
      numeral={data.hero.numeral}
      title={data.hero.title}
      subtitle={data.hero.subtitle}
      intro={data.hero.intro}
      introSecondary={data.hero.introSecondary}
    />

    <section class="bg-light px-6 md:px-12 lg:px-20 py-16 lg:py-24">
      <div class="max-w-[880px] mx-auto">
        {data.services.map((service, i) => (
          <RevealWrapper client:visible delay={0.08 * i}>
            <ServiceBox headline={service.headline} body={service.body} index={i} />
          </RevealWrapper>
        ))}
      </div>
    </section>

    <PullQuote text={data.pullQuote.text} />

    <PillarCTA
      headline={data.cta.headline}
      buttonText={data.cta.buttonText}
      crossLinks={[...data.crossLinks]}
      pillarSlug="strategic-housing"
    />
  </main>

  <Footer />
</Base>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/advisory/strategic-housing`.

Expected:
- Page loads without console errors.
- Watermark "I" visible top-right of hero.
- Four service boxes render in order, each with gold left border.
- Pull quote renders with warm soft-gold background (`#F0E8D8`).
- CTA section renders with navy background and gold-bordered button.
- Cross-links row shows both items.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/strategic-housing.astro
git commit -m "feat(advisory): add Strategic Housing pillar page"
```

---

### Task 17: Pillar II page — Transaction & Representation

**Files:**
- Create: `src/pages/advisory/transaction-representation.astro`

- [ ] **Step 1: Create the page**

```astro
---
import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import RevealWrapper from "@/components/ui/RevealWrapper";
import PillarSecondaryNav from "@/components/sections/advisory/PillarSecondaryNav.astro";
import PillarHero from "@/components/sections/advisory/PillarHero.astro";
import ServiceBox from "@/components/sections/advisory/ServiceBox.astro";
import PullQuote from "@/components/sections/advisory/PullQuote.astro";
import PillarCTA from "@/components/sections/advisory/PillarCTA.astro";
import TransactionTimeline from "@/components/sections/advisory/TransactionTimeline.astro";
import { getAdvisoryTransactionRepresentation } from "@/lib/content";
import { servicePageJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { site } from "@/lib/constants";

const data = await getAdvisoryTransactionRepresentation();

if (!data) {
  throw new Error("Missing advisoryTransactionRepresentation singleton");
}

const pageUrl = `${site.url}/advisory/transaction-representation`;
const jsonld = [
  servicePageJsonLd({
    name: data.hero.title,
    description: data.seo.description,
    url: pageUrl,
  }),
  breadcrumbJsonLd([
    { name: "Home", url: site.url },
    { name: "Advisory Services", url: `${site.url}/#services` },
    { name: data.hero.title },
  ]),
];
---

<Base
  title={data.seo.title}
  description={data.seo.description}
  jsonld={jsonld}
>
  <Nav />
  <PillarSecondaryNav active="II" />

  <main id="main-content" class="bg-canvas">
    <PillarHero
      numeral={data.hero.numeral}
      title={data.hero.title}
      subtitle={data.hero.subtitle}
      intro={data.hero.intro}
      introSecondary={data.hero.introSecondary}
    />

    <TransactionTimeline />

    <section class="bg-light px-6 md:px-12 lg:px-20 py-16 lg:py-24">
      <div class="max-w-[880px] mx-auto">
        {data.services.map((service, i) => (
          <RevealWrapper client:visible delay={0.08 * i}>
            <ServiceBox headline={service.headline} body={service.body} index={i} />
          </RevealWrapper>
        ))}
      </div>
    </section>

    <PullQuote text={data.pullQuote.text} />

    <PillarCTA
      headline={data.cta.headline}
      buttonText={data.cta.buttonText}
      crossLinks={[...data.crossLinks]}
      pillarSlug="transaction-representation"
    />
  </main>

  <Footer />
</Base>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/advisory/transaction-representation`.

Expected:
- Page loads.
- Transaction timeline renders below hero with 5 gold nodes and stage labels.
- Same service-box / pull-quote / CTA structure as Pillar I.
- Watermark "II" visible in hero.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/transaction-representation.astro
git commit -m "feat(advisory): add Transaction & Representation pillar page"
```

---

### Task 18: Pillar III page — Operational Stewardship

**Files:**
- Create: `src/pages/advisory/operational-stewardship.astro`

- [ ] **Step 1: Create the page**

```astro
---
import Base from "@/layouts/Base.astro";
import Nav from "@/components/sections/Nav.astro";
import Footer from "@/components/sections/Footer.astro";
import RevealWrapper from "@/components/ui/RevealWrapper";
import PillarSecondaryNav from "@/components/sections/advisory/PillarSecondaryNav.astro";
import PillarHero from "@/components/sections/advisory/PillarHero.astro";
import ServiceBox from "@/components/sections/advisory/ServiceBox.astro";
import PullQuote from "@/components/sections/advisory/PullQuote.astro";
import PillarCTA from "@/components/sections/advisory/PillarCTA.astro";
import DashboardIllustration from "@/components/sections/advisory/DashboardIllustration.astro";
import { getAdvisoryOperationalStewardship } from "@/lib/content";
import { servicePageJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { site } from "@/lib/constants";

const data = await getAdvisoryOperationalStewardship();

if (!data) {
  throw new Error("Missing advisoryOperationalStewardship singleton");
}

const pageUrl = `${site.url}/advisory/operational-stewardship`;
const jsonld = [
  servicePageJsonLd({
    name: data.hero.title,
    description: data.seo.description,
    url: pageUrl,
  }),
  breadcrumbJsonLd([
    { name: "Home", url: site.url },
    { name: "Advisory Services", url: `${site.url}/#services` },
    { name: data.hero.title },
  ]),
];
---

<Base
  title={data.seo.title}
  description={data.seo.description}
  jsonld={jsonld}
>
  <Nav />
  <PillarSecondaryNav active="III" />

  <main id="main-content" class="bg-canvas">
    <PillarHero
      numeral={data.hero.numeral}
      title={data.hero.title}
      subtitle={data.hero.subtitle}
      intro={data.hero.intro}
      introSecondary={data.hero.introSecondary}
    />

    <section class="bg-light px-6 md:px-12 lg:px-20 py-16 lg:py-24">
      <div class="max-w-[880px] mx-auto">
        {data.services.map((service, i) => (
          <RevealWrapper client:visible delay={0.08 * i}>
            <ServiceBox headline={service.headline} body={service.body} index={i} />
          </RevealWrapper>
        ))}
      </div>
    </section>

    <DashboardIllustration />

    <PullQuote text={data.pullQuote.text} />

    <PillarCTA
      headline={data.cta.headline}
      buttonText={data.cta.buttonText}
      crossLinks={[...data.crossLinks]}
      pillarSlug="operational-stewardship"
    />
  </main>

  <Footer />
</Base>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/advisory/operational-stewardship`.

Expected:
- Page loads.
- Dashboard illustration renders after service boxes, before pull quote.
- Three cross-links visible under CTA button.

- [ ] **Step 3: Type-check + Build**

```bash
npx astro check
npm run build
```

Expected: build succeeds. All three pillar pages appear under `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/operational-stewardship.astro
git commit -m "feat(advisory): add Operational Stewardship pillar page"
```

---

## Phase 4: Navigation & Homepage Integration

### Task 19: Update homepage Services with "Learn more →" links

**Files:**
- Modify: `src/components/sections/Services.astro`

- [ ] **Step 1: Add a pillar-to-URL map and render the link**

Open `src/components/sections/Services.astro`. At the top of the frontmatter (after the existing imports), add a constant:

```ts
const pillarUrls = [
  "/advisory/strategic-housing",
  "/advisory/transaction-representation",
  "/advisory/operational-stewardship",
];
```

Inside the `pillars.map((p, pi) => (...)` block, immediately after the closing `</div>` of the Items list container (the one with `class="flex flex-col gap-2.5 md:col-span-2 lg:col-span-1"`), add — still inside the outer grid div — a "Learn more" link. Replace the existing block:

```astro
          {/* Items list */}
          <div class="flex flex-col gap-2.5 md:col-span-2 lg:col-span-1">
            {p.items.map((item) => (
              <div class="flex items-baseline gap-3 text-sm text-canvas/75 leading-relaxed">
                <div class="w-1 h-1 rounded-full bg-accent shrink-0 mt-[7px]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
```

With:

```astro
          {/* Items list + learn more */}
          <div class="flex flex-col gap-2.5 md:col-span-2 lg:col-span-1">
            {p.items.map((item) => (
              <div class="flex items-baseline gap-3 text-sm text-canvas/75 leading-relaxed">
                <div class="w-1 h-1 rounded-full bg-accent shrink-0 mt-[7px]" />
                <span>{item}</span>
              </div>
            ))}
            {pillarUrls[pi] && (
              <a
                href={pillarUrls[pi]}
                class="mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.08em] text-accent hover:text-accent-light underline-offset-4 hover:underline uppercase font-medium self-start"
              >
                Learn more
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/#services`.

Expected:
- Each of the three pillar rows shows a gold "Learn more →" link below the items list.
- Clicking the link navigates to the correct pillar page.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Services.astro
git commit -m "feat(homepage): add Learn more links per pillar row"
```

---

### Task 20: Add dropdown markup to `Nav.astro`

**Files:**
- Modify: `src/components/sections/Nav.astro`

- [ ] **Step 1: Replace the static "Advisory" link with a dropdown group (desktop) + expandable group (mobile)**

Open `src/components/sections/Nav.astro`. Replace the entire file with:

```astro
---
import NavClient from "@/components/interactive/NavClient";

interface Props {
  light?: boolean;
}

const { light = false } = Astro.props;

const sectionLinks = [
  { href: "/#approach", id: "approach", label: "Approach" },
  { href: "/insights", id: "insights", label: "Insights" },
  { href: "/#about", id: "about", label: "About" },
  { href: "/client", id: "client", label: "Client Portal" },
];

const advisoryPillars = [
  { numeral: "I", title: "Strategic Housing Advisory", href: "/advisory/strategic-housing" },
  { numeral: "II", title: "Transaction & Representation", href: "/advisory/transaction-representation" },
  { numeral: "III", title: "Operational Stewardship", href: "/advisory/operational-stewardship" },
];
---

<div class="sticky top-0 z-40">
  <nav
    data-nav
    aria-label="Main navigation"
    class:list={[
      "flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-400 ease-[cubic-bezier(.4,0,.2,1)] border-b border-transparent",
      light
        ? "bg-canvas [&.nav-scrolled]:py-3 [&.nav-scrolled]:bg-canvas/95 [&.nav-scrolled]:backdrop-blur-xl [&.nav-scrolled]:border-mid"
        : "bg-primary [&.nav-scrolled]:py-3 [&.nav-scrolled]:bg-primary [&.nav-scrolled]:border-accent/15",
    ]}
  >
    {/* Logo */}
    <a href="/" class="block transition-all duration-300">
      <img src="/logo.svg" alt="Aabo Advisory" class="h-[36px] w-auto" />
    </a>

    {/* Desktop links */}
    <div class="hidden md:flex gap-7 items-center">
      {/* Approach */}
      <a
        href="/#approach"
        data-nav-link="approach"
        class:list={[
          "text-xs tracking-[0.06em] font-body pb-0.5 border-b-[1.5px] border-transparent transition-all duration-300",
          light
            ? "text-accent hover:border-accent [&.nav-link-active]:border-accent"
            : "text-accent hover:border-accent [&.nav-link-active]:border-accent",
        ]}
      >
        Approach
      </a>

      {/* Advisory dropdown group */}
      <div data-advisory-dropdown class="relative">
        <a
          href="/#services"
          data-nav-link="services"
          data-advisory-trigger
          aria-haspopup="menu"
          aria-expanded="false"
          class:list={[
            "text-xs tracking-[0.06em] font-body pb-0.5 border-b-[1.5px] border-transparent transition-all duration-300 inline-flex items-center gap-1.5",
            light
              ? "text-accent hover:border-accent [&.nav-link-active]:border-accent"
              : "text-accent hover:border-accent [&.nav-link-active]:border-accent",
          ]}
        >
          Advisory
          <svg
            aria-hidden="true"
            width="8"
            height="5"
            viewBox="0 0 8 5"
            class="transition-transform duration-300"
            data-advisory-chevron
          >
            <path d="M0 0 L4 4 L8 0" stroke="currentColor" stroke-width="1.2" fill="none" />
          </svg>
        </a>

        <div
          data-advisory-menu
          role="menu"
          aria-label="Advisory pillars"
          class="hidden absolute right-0 top-full mt-3 min-w-[300px] bg-primary border border-accent/15 shadow-xl py-2"
        >
          {advisoryPillars.map((p) => (
            <a
              role="menuitem"
              href={p.href}
              class="block px-5 py-3 text-xs tracking-[0.04em] text-accent hover:bg-canvas/[0.04] transition-colors duration-200"
            >
              <span class="font-heading text-accent-light mr-2">{p.numeral}.</span>
              {p.title}
            </a>
          ))}
        </div>
      </div>

      {/* Other top-level links */}
      {sectionLinks.map((link) => (
        <a
          href={link.href}
          data-nav-link={link.id}
          class:list={[
            "text-xs tracking-[0.06em] font-body pb-0.5 border-b-[1.5px] border-transparent transition-all duration-300",
            light
              ? "text-accent hover:border-accent [&.nav-link-active]:border-accent"
              : "text-accent hover:border-accent [&.nav-link-active]:border-accent",
          ]}
        >
          {link.label}
        </a>
      ))}

      <a
        href="/#contact"
        class:list={[
          "px-5 py-2.5 text-[11px] tracking-[0.12em] uppercase font-body font-medium transition-all duration-300 border",
          light
            ? "border-accent text-primary hover:bg-accent hover:text-primary"
            : "border-accent text-canvas hover:bg-accent hover:text-primary",
        ]}
      >
        Schedule a Consultation
      </a>
    </div>

    {/* Mobile menu toggle (client island) */}
    <NavClient client:load />
  </nav>

  {/* Mobile drawer */}
  <div data-nav-drawer class:list={[
    "fixed inset-x-0 top-[57px] bottom-0 flex-col items-center pt-12 gap-6 hidden md:!hidden z-50 overflow-y-auto",
    light ? "bg-canvas" : "bg-primary",
  ]}>
    <a
      href="/#approach"
      data-nav-link="approach"
      class:list={[
        "text-sm tracking-[0.06em] font-body transition-colors",
        light
          ? "text-accent hover:text-primary [&.nav-link-active]:text-primary"
          : "text-accent hover:text-canvas [&.nav-link-active]:text-canvas",
      ]}
    >
      Approach
    </a>

    {/* Advisory mobile expandable */}
    <div data-advisory-mobile class="flex flex-col items-center gap-3">
      <div class="flex items-center gap-3">
        <a
          href="/#services"
          data-nav-link="services"
          class:list={[
            "text-sm tracking-[0.06em] font-body transition-colors",
            light
              ? "text-accent hover:text-primary [&.nav-link-active]:text-primary"
              : "text-accent hover:text-canvas [&.nav-link-active]:text-canvas",
          ]}
        >
          Advisory
        </a>
        <button
          type="button"
          data-advisory-mobile-toggle
          aria-label="Expand Advisory submenu"
          aria-expanded="false"
          class="p-1"
        >
          <svg
            aria-hidden="true"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            class="transition-transform duration-300"
            data-advisory-mobile-chevron
          >
            <path d="M0 0 L5 5 L10 0" stroke="currentColor" stroke-width="1.2" fill="none" />
          </svg>
        </button>
      </div>
      <ul data-advisory-mobile-list class="hidden flex-col items-center gap-2.5">
        {advisoryPillars.map((p) => (
          <li>
            <a
              href={p.href}
              class:list={[
                "text-xs tracking-[0.04em] font-body transition-colors",
                light ? "text-accent/80 hover:text-primary" : "text-accent/80 hover:text-canvas",
              ]}
            >
              <span class="font-heading mr-1.5">{p.numeral}.</span>
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </div>

    {sectionLinks.map((link) => (
      <a
        href={link.href}
        data-nav-link={link.id}
        class:list={[
          "text-sm tracking-[0.06em] font-body transition-colors",
          light
            ? "text-accent hover:text-primary [&.nav-link-active]:text-primary"
            : "text-accent hover:text-canvas [&.nav-link-active]:text-canvas",
        ]}
      >
        {link.label}
      </a>
    ))}

    <a
      href="/#contact"
      class:list={[
        "px-6 py-3 text-[11px] tracking-[0.12em] uppercase font-body font-medium mt-4 transition-all duration-300 border",
        light
          ? "border-accent text-primary hover:bg-accent hover:text-primary"
          : "border-accent text-canvas hover:bg-accent hover:text-primary",
      ]}
    >
      Schedule a Consultation
    </a>
  </div>
</div>
```

- [ ] **Step 2: Verify in browser (markup only, no JS behavior yet)**

Reload `http://localhost:4321/`.

Expected:
- Desktop nav still shows Approach · Advisory · Insights · About · Client Portal · button. (No dropdown opens yet — that arrives in Task 21.)
- Clicking "Advisory" still scrolls to `/#services`.
- Mobile drawer shows an "Advisory" item with a chevron button next to it; tapping the chevron does nothing yet (wired in Task 21).

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Nav.astro
git commit -m "feat(nav): add Advisory dropdown markup (desktop + mobile)"
```

---

### Task 21: Wire dropdown behavior in `NavClient.tsx`

**Files:**
- Modify: `src/components/interactive/NavClient.tsx`

- [ ] **Step 1: Replace the file with the extended version**

Open `src/components/interactive/NavClient.tsx`. Replace the entire file with:

```tsx
import { useEffect, useState } from "react";
import { trackAdvisoryNavDropdownOpened } from "@/lib/analytics";

const NAV_SECTIONS = ["home", "approach", "services", "insights", "about"];

export default function NavClient() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") return "home";
    const path = window.location.pathname;
    if (path.startsWith("/insights")) return "insights";
    if (path.startsWith("/calculator")) return "calculator";
    if (path.startsWith("/advisory")) return "services";
    return "home";
  });

  /* ── scroll state ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── sync scroll class to <nav> ── */
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;
    if (scrolled) {
      nav.classList.add("nav-scrolled");
    } else {
      nav.classList.remove("nav-scrolled");
    }
  }, [scrolled]);

  /* ── active section observer (homepage only) ── */
  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const els = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── sync mobile drawer visibility ── */
  useEffect(() => {
    const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
    if (!drawer) return;
    if (mobileOpen) {
      drawer.classList.remove("hidden");
      drawer.classList.add("flex");
    } else {
      drawer.classList.add("hidden");
      drawer.classList.remove("flex");
    }
  }, [mobileOpen]);

  /* ── close mobile drawer when clicking anchor links ── */
  useEffect(() => {
    const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
    if (!drawer) return;
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Close drawer on any nav link (anchor OR full-path link out of homepage)
      if (href.includes("#") || href.startsWith("/advisory") || href.startsWith("/insights") || href.startsWith("/newsletter") || href.startsWith("/client") || href.startsWith("/calculator")) {
        setMobileOpen(false);
      }
    };
    drawer.addEventListener("click", handleClick);
    return () => drawer.removeEventListener("click", handleClick);
  }, []);

  /* ── push active section to nav links ── */
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;
    nav.querySelectorAll<HTMLAnchorElement>("[data-nav-link]").forEach((a) => {
      if (a.dataset.navLink === activeSection) {
        a.classList.add("nav-link-active");
      } else {
        a.classList.remove("nav-link-active");
      }
    });
  }, [activeSection]);

  /* ── desktop Advisory dropdown (hover + keyboard) ── */
  useEffect(() => {
    const group = document.querySelector<HTMLElement>("[data-advisory-dropdown]");
    if (!group) return;
    const trigger = group.querySelector<HTMLAnchorElement>("[data-advisory-trigger]");
    const menu = group.querySelector<HTMLElement>("[data-advisory-menu]");
    const chevron = group.querySelector<SVGElement>("[data-advisory-chevron]");
    if (!trigger || !menu) return;

    let openTimer: number | undefined;
    let closeTimer: number | undefined;
    let announced = false;

    const open = () => {
      window.clearTimeout(closeTimer);
      menu.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
      chevron?.style.setProperty("transform", "rotate(180deg)");
      if (!announced) {
        trackAdvisoryNavDropdownOpened("desktop");
        announced = true;
      }
    };
    const close = () => {
      menu.classList.add("hidden");
      trigger.setAttribute("aria-expanded", "false");
      chevron?.style.removeProperty("transform");
    };

    const onEnter = () => {
      window.clearTimeout(closeTimer);
      openTimer = window.setTimeout(open, 100);
    };
    const onLeave = () => {
      window.clearTimeout(openTimer);
      closeTimer = window.setTimeout(close, 200);
    };

    group.addEventListener("mouseenter", onEnter);
    group.addEventListener("mouseleave", onLeave);

    const onFocusIn = () => open();
    const onFocusOut = (e: FocusEvent) => {
      if (!group.contains(e.relatedTarget as Node)) close();
    };
    group.addEventListener("focusin", onFocusIn);
    group.addEventListener("focusout", onFocusOut);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        trigger.focus();
      }
    };
    group.addEventListener("keydown", onKey);

    return () => {
      group.removeEventListener("mouseenter", onEnter);
      group.removeEventListener("mouseleave", onLeave);
      group.removeEventListener("focusin", onFocusIn);
      group.removeEventListener("focusout", onFocusOut);
      group.removeEventListener("keydown", onKey);
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  /* ── mobile Advisory expandable sub-list ── */
  useEffect(() => {
    const group = document.querySelector<HTMLElement>("[data-advisory-mobile]");
    if (!group) return;
    const toggle = group.querySelector<HTMLButtonElement>(
      "[data-advisory-mobile-toggle]",
    );
    const list = group.querySelector<HTMLElement>("[data-advisory-mobile-list]");
    const chevron = group.querySelector<SVGElement>(
      "[data-advisory-mobile-chevron]",
    );
    if (!toggle || !list) return;

    let open = false;
    let announced = false;
    const onClick = () => {
      open = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        list.classList.remove("hidden");
        list.classList.add("flex");
        chevron?.style.setProperty("transform", "rotate(180deg)");
        if (!announced) {
          trackAdvisoryNavDropdownOpened("mobile");
          announced = true;
        }
      } else {
        list.classList.add("hidden");
        list.classList.remove("flex");
        chevron?.style.removeProperty("transform");
      }
    };
    toggle.addEventListener("click", onClick);
    return () => toggle.removeEventListener("click", onClick);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <span
          className={`block h-px w-5 bg-accent transition-all duration-300 ${mobileOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-5 bg-accent transition-all duration-300 ${mobileOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>
    </>
  );
}
```

- [ ] **Step 2: Verify desktop dropdown in browser**

Reload `http://localhost:4321/`.

Expected:
- Hovering "Advisory" on desktop opens the dropdown after ~100ms with three pillar items.
- Moving cursor away closes it after ~200ms.
- Clicking "Advisory" itself scrolls to `#services` (does not toggle the dropdown).
- Clicking a pillar item navigates to that page.
- Pressing Esc while focused inside the group closes the dropdown and returns focus to the trigger.

- [ ] **Step 3: Verify mobile expandable in browser**

Resize to a narrow viewport (~375px) or use DevTools device toolbar.

Expected:
- Open the mobile drawer.
- Tapping "Advisory" (the label) scrolls to `#services` and closes the drawer.
- Tapping the chevron button expands the three pillar links under Advisory without closing the drawer.
- Tapping a pillar link navigates and closes the drawer.

- [ ] **Step 4: Type-check**

```bash
npx astro check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/interactive/NavClient.tsx
git commit -m "feat(nav): wire Advisory dropdown (desktop hover + mobile expand)"
```

---

## Phase 5: Final Verification

### Task 22: End-to-end QA + production build

**Files:** (no code changes — verification only)

- [ ] **Step 1: Type-check**

```bash
npx astro check
```

Expected: zero errors introduced by this plan. Pre-existing warnings unrelated to advisory files are acceptable.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: succeeds. `dist/` contains:
- `dist/advisory/strategic-housing/index.html`
- `dist/advisory/transaction-representation/index.html`
- `dist/advisory/operational-stewardship/index.html`

- [ ] **Step 3: Preview the production build**

```bash
npm run preview
```

- [ ] **Step 4: Manual QA checklist**

Visit each URL and confirm:

- [ ] `/advisory/strategic-housing` renders; watermark "I"; 4 service boxes; pull quote (warm gold bg); CTA button opens contact modal; both cross-links resolve.
- [ ] `/advisory/transaction-representation` renders; watermark "II"; timeline SVG under hero with 5 gold nodes + labels; 4 service boxes; pull quote; CTA; both cross-links resolve.
- [ ] `/advisory/operational-stewardship` renders; watermark "III"; 4 service boxes; dashboard illustration renders before pull quote; CTA; three cross-links resolve (including `/newsletter` and `/insights`).
- [ ] Homepage `/#services` shows a "Learn more →" link under each of the three pillar rows; each link lands on the correct pillar page.
- [ ] Primary nav "Advisory" on desktop: hovering opens the dropdown; clicking scrolls to `/#services`; pillar items in the dropdown navigate correctly.
- [ ] Primary nav "Advisory" on mobile: chevron toggles the sub-list; tapping the label scrolls to `/#services`; sub-list items navigate correctly.
- [ ] Secondary nav on each pillar page shows "← Back to Advisory Services" (returns to `/#services`) and the I / II / III indicator with active state.
- [ ] Sibling pillar links in the secondary nav (non-active numerals) navigate between pages.
- [ ] `view-source:` on each pillar page confirms a `<script type="application/ld+json">` block containing the `Service` schema and a `BreadcrumbList` block.
- [ ] Meta `<title>` and `<meta name="description">` on each pillar page match the singleton's `seo.title` / `seo.description`.
- [ ] No console errors on any page.

- [ ] **Step 5: Responsive spot-check**

Resize or use DevTools device toolbar. Check at 375px, 768px, 1100px, 1440px on each pillar page:

- [ ] Hero watermark remains visible but doesn't overflow or overlap body text at small sizes.
- [ ] Service boxes stack cleanly.
- [ ] Transaction timeline (Pillar II) remains legible — SVG scales; labels don't collide.
- [ ] Dashboard illustration (Pillar III) remains legible.
- [ ] Pull quote has adequate padding.
- [ ] CTA cross-links wrap to a column on narrow viewports.

- [ ] **Step 6: A11y spot-check**

- [ ] Tab through a pillar page from top: skip link → primary nav (Advisory dropdown opens via Tab+focus) → secondary nav back link → I/II/III → main heading → service boxes → pull quote → CTA button → cross-links → footer. No trapped focus.
- [ ] Open a screen reader (VoiceOver on macOS: Cmd-F5). Navigate the headings list (VO+U → Headings): Pillar page should have H1 (pillar title), H3 (service box headlines) — watermark numeral should NOT be announced. Dashboard SVG (Pillar III) should read its `<title>` "Illustrative quarterly portfolio monitoring report".
- [ ] Lighthouse (Chrome DevTools → Lighthouse → Accessibility only): score ≥ 95 on each pillar page.

- [ ] **Step 7: CMS smoke test**

Open `http://localhost:4321/keystatic` (or Keystatic Cloud), navigate into each of the three new singletons. Edit one field (e.g., change the Pillar I CTA headline to "Discuss your strategy"), save, and confirm the change renders after rebuild. Revert the edit.

- [ ] **Step 8: Final commit (only if any doc/style polish was needed during QA)**

If QA surfaced tweaks, commit them individually. Otherwise, no commit.

- [ ] **Step 9: PR handoff**

The plan is complete. Summarize the branch state and open a PR when ready (outside the scope of this plan).

---

## Deferred (Phase 2 — separate future spec)

These items are intentionally **not** in this plan. Do not implement:

- Pillar I: animated portfolio-value counter on load.
- Pillar I: interactive rent-vs-buy directional slider.
- Pillar II: hover-states on transaction timeline nodes.
- Pillar II: off-market access infographic (needs client-provided stat).
- Pillar III: heartbeat-line continuous monitoring visual metaphor.
- Pillar III: interactive dashboard (vs. the static illustration shipped here).

---

**End of plan.**

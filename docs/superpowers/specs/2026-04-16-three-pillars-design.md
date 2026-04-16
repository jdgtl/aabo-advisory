# Three Pillars Advisory Pages — Design Spec

**Date:** 2026-04-16
**Status:** Approved for implementation
**Scope:** Phase 1 of a two-phase effort — content pages first; flagship interactives in a separate later spec.
**Source content:** `docs/aabo-three-pillars-content-spec.md`

---

## 1. Purpose

Expand each of the three Advisory pillars — currently a single row in the homepage Services section — into a standalone page with full narrative, four service boxes, a pull quote, and a pillar-specific CTA. Ship all three together so they read as a coherent, cross-linked set. Defer the flagship interactive elements (rent-vs-buy slider, timeline hover-states, dashboard widget, animated counters, heartbeat metaphor, off-market infographic) to a Phase 2 spec.

## 2. Outcomes

- Three new pages live at `/advisory/strategic-housing`, `/advisory/transaction-representation`, `/advisory/operational-stewardship`.
- Each page is fully editable via Keystatic (three separate singletons, one per pillar).
- Homepage Services section gets a "Learn more →" link per pillar into the relevant page (no other homepage changes).
- Primary nav "Advisory" becomes a hover/tap dropdown listing the three pillars. Clicking the parent label still scrolls to `/#services`.
- Each pillar page has a secondary nav strip (I / II / III with active state + back-link to `/#services`).
- Cross-links between pillars and into relevant `/insights` articles and `/newsletter`.
- Scroll-triggered fade-ins on service boxes (reusing `RevealWrapper`).
- SEO, JSON-LD (`Service` + `BreadcrumbList`), and analytics instrumentation per page.

## 3. Non-Goals (Phase 2 or Never)

Deferred to a separate later spec:

- Pillar I: animated portfolio-value counter on load.
- Pillar I: interactive rent-vs-buy directional slider (distinct from the full `/calculator`).
- Pillar II: hover-states on the transaction timeline nodes (revealing per-stage detail).
- Pillar II: off-market access infographic — needs a concrete stat from client first.
- Pillar III: heartbeat-line continuous-monitoring visual metaphor.
- Pillar III: interactive dashboard (Phase 1 ships a static illustration).

Out of scope entirely:

- Performance profiling changes to `Base.astro`.
- Migrating existing homepage Services section beyond the "Learn more" links.
- A/B testing infrastructure (can layer via PostHog later).

## 4. Content Model — Keystatic

Three new singletons added to `keystatic.config.ts`. All three share the same schema shape.

**Paths:**

```
src/content/advisory-strategic-housing.json
src/content/advisory-transaction-representation.json
src/content/advisory-operational-stewardship.json
```

**Schema (identical for each singleton):**

```ts
{
  seo: {
    title: text,        // e.g. "Strategic Housing Advisory | Aabo Advisory"
    description: text,  // meta description (multiline)
  },
  hero: {
    numeral: text,          // "I" | "II" | "III"
    title: text,            // e.g. "Strategic Housing Advisory"
    subtitle: text,         // e.g. "Portfolio Performance and Optimization"
    intro: text(multiline), // first intro paragraph
    introSecondary: text(multiline), // second intro paragraph
  },
  services: array of 4 {
    headline: text,
    body: text(multiline),  // 2–3 sentences
  },
  pullQuote: {
    text: text(multiline),
  },
  cta: {
    headline: text,     // e.g. "Discuss your portfolio strategy"
    buttonText: text,   // e.g. "Schedule a Consultation"
  },
  crossLinks: array of {
    label: text,        // e.g. "Read: The 30-Year Lens"
    href: text,         // e.g. "/insights/a-30-year-lens-for-hq-approval"
  }
}
```

**Seed content** for all three singletons is copied verbatim from `docs/aabo-three-pillars-content-spec.md` (intro paragraphs, four service box headlines + bodies per pillar, pull quote, CTA headlines).

**Cross-link seed values:**

- **Pillar I (Strategic Housing Advisory):**
  - `Read: A 30-Year Lens for HQ Approval` → `/insights/a-30-year-lens-for-hq-approval`
  - `Next: Transaction & Representation →` → `/advisory/transaction-representation`
- **Pillar II (Transaction & Representation):**
  - `Our strategic advisory often precedes a transaction →` → `/advisory/strategic-housing`
  - `After closing, our work continues →` → `/advisory/operational-stewardship`
- **Pillar III (Operational Stewardship):**
  - `Explore our latest market intelligence →` → `/insights`
  - `Subscribe to the Aabo Newsletter →` → `/newsletter`
  - `Every engagement begins with strategy →` → `/advisory/strategic-housing`

**Content loader** (`src/lib/content.ts`):

```ts
export async function getAdvisoryStrategicHousing() { ... }
export async function getAdvisoryTransactionRepresentation() { ... }
export async function getAdvisoryOperationalStewardship() { ... }
```

Each wraps `reader.singletons.<name>.read()` and mirrors the pattern of `getHomepage()`.

## 5. File Layout

**New page files** (each reads its own singleton and composes shared components):

```
src/pages/advisory/strategic-housing.astro
src/pages/advisory/transaction-representation.astro
src/pages/advisory/operational-stewardship.astro
```

**New shared components:**

```
src/components/sections/advisory/
  PillarSecondaryNav.astro  // "I / II / III" + "← Back to Advisory Services"
  PillarHero.astro          // watermark numeral, title, subtitle, intro paragraphs
  ServiceBox.astro          // gold left-border, canvas bg, headline + body
  PullQuote.astro           // italic serif, warm gold bg, full-width band
  PillarCTA.astro           // pillar-specific headline, button → #contact, crossLinks grid
  TransactionTimeline.astro // Pillar II only — static SVG timeline
  DashboardIllustration.astro // Pillar III only — static SVG dashboard
```

**Updated files:**

- `keystatic.config.ts` — register three new singletons.
- `src/lib/content.ts` — add three loader functions.
- `src/lib/jsonld.ts` — add `servicePageJsonLd({ name, description, url })`.
- `src/components/sections/Nav.astro` — add "Advisory" dropdown behavior.
- `src/components/interactive/NavClient.tsx` — mobile drawer: expandable "Advisory" group.
- `src/components/sections/Services.astro` — add "Learn more →" link per pillar row.
- `src/styles/global.css` — add one new design token: `--color-quote: #F0E8D8`.

No changes to `src/content/homepage.json` schema; Services component maps pillar index → page URL.

## 6. Page Composition

Each pillar page renders this vertical flow inside `Base`:

```
<Base jsonld={[servicePageJsonLd(...), breadcrumbJsonLd(...)]}>
  <Nav />
  <PillarSecondaryNav active="I" />
  <main id="main-content">
    <PillarHero {...data.hero} />
    {pillar === "transaction-representation" && <TransactionTimeline />}
    <section class="service-boxes">
      {data.services.map(s => <ServiceBox {...s} />)}
    </section>
    {pillar === "operational-stewardship" && <DashboardIllustration />}
    <PullQuote text={data.pullQuote.text} />
    <PillarCTA {...data.cta} crossLinks={data.crossLinks} />
  </main>
  <Footer />
</Base>
```

### 6.1 `PillarSecondaryNav.astro`

- Full-width strip below primary nav. `bg-canvas`, gold bottom border (`border-accent/20`).
- Not sticky (primary nav stays sticky; stacking two looks heavy).
- Left: `← Back to Advisory Services` link → `/#services`.
- Right: inline "I / II / III" labels. Active numeral underlined in gold (`border-b border-accent`). Non-active labels are text links to sibling pillar pages with their pillar name as hover tooltip (`title` attribute).
- Landmark: `<nav aria-label="Pillar pages">`.

### 6.2 `PillarHero.astro`

- Background: `bg-canvas`.
- Large decorative numeral watermark: absolutely positioned `<span>`, Playfair Display ~220–280px, `text-primary/8`, `select-none pointer-events-none` and `aria-hidden="true"`.
- Small label above title: `<Label text="Advisory · Pillar I" />` (reuses existing `Label.astro`).
- H1 title: Playfair Display, ~48px (responsive), text-primary.
- `<LineReveal width={48} />` gold underline.
- Subtitle: italic, accent gold, ~14–16px.
- `intro` paragraph: ~18px, text/85%, max-width 680px.
- `introSecondary` paragraph: ~16px, text/70%, max-width 680px.
- Wrapped in `RevealWrapper` with small stagger.

### 6.3 `ServiceBox.astro`

- Style mirrors existing `Approach` cards: `bg-canvas`, gold 3px left border (`border-l-[3px] border-accent`), padding `px-8 py-10`.
- H3 headline: Playfair Display, ~24px, font-bold, text-primary.
- Body: ~16px, line-height 1.7, text/75%.
- Stacked (not grid) — 2–3-sentence paragraphs need horizontal room to breathe; matches spec intent.
- Parent section background: `bg-light` (existing token, ~ `#F5F0E8`).
- Each box wrapped in `RevealWrapper` with `0.08s * index` delay.

### 6.4 `PullQuote.astro`

- Full-width band, ~140px vertical padding.
- Background: new token `--color-quote` (`#F0E8D8`).
- Gold 3px left border (`border-l-[3px] border-accent`) on the inner content block, max-width ~720px, centered.
- Italic Playfair Display ~28px, text-primary.

### 6.5 `PillarCTA.astro`

- Background: `bg-primary` (navy), matches existing `CTABanner.astro`.
- Centered content:
  - Headline: Playfair Display ~28–30px, text-canvas, pillar-specific (`data.cta.headline`).
  - Button: identical styling to existing homepage CTA button, `href="/#contact"` → triggers global `ContactModalIsland`.
  - Cross-links row: small, accent gold, "→" suffix, 2–4 items separated by a centered dot or laid out as a responsive row.

### 6.6 `TransactionTimeline.astro` (Pillar II only)

- Static SVG rendered immediately below `PillarHero` and above the service-boxes section (matches the composition block in §6).
- 5 stages: Sourcing → Negotiation → Contract → Closing → Handoff.
- Gold circular nodes (~12px), thin gray connecting line, label below each node in small caps ~11px accent color.
- Responsive: stages wrap to two rows below 640px.
- No hover-states in Phase 1 (deferred).

### 6.7 `DashboardIllustration.astro` (Pillar III only)

- Static SVG placed after service boxes, before pull quote.
- Abstract quarterly-report mockup: header bar, 4–6 tiles with sparklines / bars, a summary line. Anonymized — no real numbers beyond small directional indicators.
- Centered, max-width ~720px, `bg-canvas` with subtle `border border-mid`.

## 7. Nav Dropdown Behavior (Primary `Nav.astro`)

### Desktop

- "Advisory" label remains a link to `/#services` (click navigates; does not toggle the dropdown).
- Hover on the label or the dropdown panel opens the panel. Hover-out closes with a ~200ms delay (prevents flicker).
- Focus + Enter on the label also opens the dropdown for keyboard users; Arrow Down moves focus into the first pillar item. Esc closes and returns focus to the "Advisory" label.
- Dropdown panel:
  - Styled as dark navy panel (`bg-primary`) with subtle gold border (`border border-accent/15`), small shadow.
  - Fades + translates Y 8px on open; 200ms `cubic-bezier(.4,0,.2,1)`.
  - Three items: `I. Strategic Housing Advisory`, `II. Transaction & Representation`, `III. Operational Stewardship`. Each is a link to its pillar page.
  - Hover on item: gold underline animation like existing nav links.
- ARIA: parent link has `aria-haspopup="menu"` and `aria-expanded` reflecting state. Dropdown is `role="menu"`, each item `role="menuitem"`.

### Mobile (`NavClient.tsx` drawer)

- "Advisory" list item renders in two parts:
  - Tappable text "Advisory" → navigates to `/#services` (closes drawer).
  - Adjacent chevron button → toggles sub-list open/closed (independent of the text tap).
- Sub-list: three indented links, each to its pillar page.
- Prevents the common "tap-to-navigate vs tap-to-expand" conflict.

## 8. Homepage Services Tweak (`Services.astro`)

For each of the three pillar rows, add a "Learn more →" link at the bottom of the items list (or right-aligned on wider viewports). Gold accent color, underline-on-hover.

Mapping (index-based, since pillars in `homepage.json` are ordered I, II, III):

- index 0 → `/advisory/strategic-housing`
- index 1 → `/advisory/transaction-representation`
- index 2 → `/advisory/operational-stewardship`

No change to `homepage.json` schema.

## 9. Design Tokens & Palette

Existing tokens map to the spec's proposed palette (Decision Q5: use existing tokens for visual consistency):

| Spec value | Mapped existing token | Hex |
|---|---|---|
| Navy `#1A2332` | `--color-primary` | `#0F1B2D` |
| Gold `#C9A96E` | `--color-accent` | `#B8965A` |
| Service box bg `#F5F3F0` | `--color-light` | `#F5F0E8` |
| Warm off-white / canvas | `--color-canvas` | `#FAF8F5` |

**One new token** added to `src/styles/global.css`:

```css
--color-quote: #F0E8D8;
```

Used exclusively by `PullQuote.astro`.

## 10. SEO & JSON-LD

**Per page:**

- `<title>`: from singleton `seo.title`.
- `<meta name="description">`: from singleton `seo.description`.
- Canonical: `https://aaboadvisory.com/advisory/<slug>`.
- OpenGraph + Twitter Cards inherit from `Base.astro` (no changes needed).

**JSON-LD graph:**

- `servicePageJsonLd({ name, description, url })` — new helper in `src/lib/jsonld.ts`. Emits a `Service` schema with `provider` = existing Aabo Advisory `ProfessionalService` entity and `areaServed` = New York.
- `breadcrumbJsonLd([{ name: "Home", url: "https://aaboadvisory.com" }, { name: "Advisory Services", url: "https://aaboadvisory.com/#services" }, { name: <Pillar Name> }])` — reuses existing helper.
- Both are passed to `Base` via the `jsonld` prop.

## 11. Accessibility

- Primary nav dropdown: ARIA attributes as described in §7; keyboard-navigable.
- Secondary nav: `<nav aria-label="Pillar pages">`.
- Decorative numeral watermarks: `aria-hidden="true"`, `role="presentation"`.
- Transaction timeline SVG: has `<title>` and `<desc>` children for screen readers.
- All cross-link rows use descriptive link text (no bare "Learn more" — each link states its destination).
- `<main id="main-content">` on every pillar page to match the existing skip-link in `Base.astro`.
- Color contrast: verified against existing tokens — no new contrast issues introduced.

## 12. Analytics

Instrument PostHog events (PostHog is already wired into the site):

- `advisory_page_viewed` — fired automatically via page-view tracking; no manual instrumentation needed.
- `advisory_cta_clicked` — on the main Pillar CTA button. Properties: `{ pillar: "strategic-housing" | ..., location: "cta-banner" }`.
- `advisory_crosslink_clicked` — on each cross-link. Properties: `{ pillar, target_href, label }`.
- `advisory_nav_dropdown_opened` — on primary nav "Advisory" dropdown open. Properties: `{ source: "desktop" | "mobile" }`.

This cheap instrumentation gives data to inform Phase 2 priorities (which pillar draws engagement, which cross-links convert).

## 13. Testing Plan

**Static:**
- `astro check` — type-check passes.
- `astro build` — production build succeeds; all three pages compile; Keystatic reader resolves all three singletons.

**Manual browser pass (dev server):**
- Each pillar page renders with seed content.
- Primary nav "Advisory" dropdown opens/closes on desktop (hover + keyboard); mobile drawer expands inline.
- Clicking "Advisory" label (not a dropdown item) still scrolls to `/#services`.
- Secondary nav active-state matches current pillar; sibling links navigate correctly.
- "Back to Advisory Services" link returns to `/#services`.
- CTA button opens global `#contact` modal.
- Cross-links resolve to correct targets (Insights article, `/newsletter`, sibling pillar pages).
- Homepage Services "Learn more" links land on the right pillar page.
- Pull quote renders with correct background.
- Hero numeral watermark is visible but does not steal focus or interfere with text.

**Responsive pass:** viewports 375px, 768px, 1100px, 1440px.

**Keystatic CMS smoke test:** open each of the three singletons in Keystatic cloud, edit a field (e.g., pillar title), verify it renders on the live page after publish.

**Accessibility spot-checks:**
- Keyboard-only navigation through primary nav, secondary nav, and CTA.
- VoiceOver/NVDA pass: headings structure (H1 → H2 → H3), watermark is not announced, timeline SVG reads title/desc.
- Lighthouse a11y score ≥95 on each pillar page.

## 14. Implementation Sequence (high-level)

(Detailed plan will be produced by the writing-plans skill next.)

1. Extend Keystatic config + seed the three JSON singletons with content from `docs/aabo-three-pillars-content-spec.md`.
2. Extend `src/lib/content.ts` and `src/lib/jsonld.ts`.
3. Build shared components in `src/components/sections/advisory/` in this order: `ServiceBox` → `PullQuote` → `PillarHero` → `PillarSecondaryNav` → `PillarCTA` → `TransactionTimeline` → `DashboardIllustration`.
4. Build the three page files, each composing shared components.
5. Update `Nav.astro` + `NavClient.tsx` for the dropdown.
6. Update `Services.astro` with "Learn more →" links.
7. Add `--color-quote` design token.
8. Type-check, build, manual browser pass, responsive pass, CMS smoke test.
9. Commit + open PR.

## 15. Open Questions / Assumptions

- **Pillar III "Subscribe" target** is assumed to be `/newsletter` (link only — not an inline embedded form). Confirmed during brainstorming.
- **30-Year Lens cross-link target** is `/insights/a-30-year-lens-for-hq-approval` (the published article). Confirmed.
- **Transaction timeline stages** (Sourcing / Negotiation / Contract / Closing / Handoff) are assumed from the spec narrative. Labels can be tuned during implementation if a better set emerges.
- **Dashboard illustration** content is intentionally abstract for Phase 1 (no real data). Phase 2 may introduce directional values if the client provides them.

---

**End of spec.**

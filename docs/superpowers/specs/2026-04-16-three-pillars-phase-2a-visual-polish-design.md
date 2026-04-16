# Three Pillars — Phase 2a: Visual Polish Interactives

**Date:** 2026-04-16
**Status:** Approved for implementation
**Scope:** Phase 2a of the original Three Pillars effort. Covers four of the six deferred items from the Phase 1 spec.
**Source Phase 1 spec:** `docs/superpowers/specs/2026-04-16-three-pillars-design.md`
**Source Phase 1 plan:** `docs/superpowers/plans/2026-04-16-three-pillars-implementation.md`

**Prerequisite:** Phase 1 must be implemented and merged before Phase 2a starts. All references below to existing files (`PillarHero.astro`, `TransactionTimeline.astro`, the advisory singletons, the shared `advisorySchema` constant in `keystatic.config.ts`) assume Phase 1 is in place.

---

## 1. Purpose

Add the "visual polish" interactive elements called out in the original content spec and deferred from Phase 1 — without introducing any new React islands. Each element either (a) reveals on scroll, (b) reveals on hover/tap, or (c) renders statically from CMS content. All four are implemented as vanilla JS inside Astro components, following the existing pattern of `LineReveal.astro` and `PillarCTA.astro`.

The four items in this phase:

1. **Pillar I — Portfolio-value benchmarks counter** (CMS-editable, 0–4 entries)
2. **Pillar II — Transaction timeline hover/tap popover** (CMS-editable per-stage descriptions)
3. **Pillar II — Off-market access infographic** (CMS-editable; two variants — data-driven and qualitative)
4. **Pillar III — Heartbeat-line continuous-monitoring backdrop** (decorative; plays once on scroll-in)

Phase 2b (separate later spec) will cover the two heavier interactives: rent-vs-buy slider (Pillar I) and interactive dashboard (Pillar III).

## 2. Outcomes

- Pillar I page renders an array-driven counter section between hero and service boxes. Empty array hides the section.
- Pillar II timeline node shows a popover on hover (desktop) and tap (mobile/desktop) with the stage description. Keyboard-navigable. Analytics event per stage.
- Pillar II off-market section renders with variant switching based on whether a percentage is provided; `enabled: false` hides the section entirely.
- Pillar III hero renders a heartbeat-waveform backdrop that draws in once when the hero enters the viewport.
- All four components respect `prefers-reduced-motion`.
- Four new Plausible analytics events fire with correct deduplication.
- No new React islands; all interactivity is vanilla JS inside Astro components.

## 3. Non-Goals (Phase 2b or never)

Deferred to Phase 2b spec:
- Rent-vs-buy directional slider (Pillar I).
- Interactive dashboard (Pillar III) — Phase 1's static `DashboardIllustration.astro` stays in place.

Out of scope entirely:
- Changing the Phase 1 `DashboardIllustration.astro` content.
- Changing Phase 1 copy, cross-links, or page layout.
- Adding a React island for any Phase 2a component.

## 4. Content Model — Keystatic Additions

Each pillar singleton gets pillar-specific extensions. The shared `advisorySchema` from Phase 1 is split: its common fields remain shared; pillar-specific extensions are spread into each singleton's schema.

### 4.1 Pillar I — new `counter` field

```ts
counter: fields.array(
  fields.object({
    value: fields.text({ label: "Value (numeric)" }),
    prefix: fields.text({ label: "Prefix (e.g. $)" }),
    suffix: fields.text({ label: "Suffix (e.g. M)" }),
    caption: fields.text({ label: "Caption", multiline: true }),
  }),
  {
    label: "Benchmark Counter",
    itemLabel: (props) =>
      `${props.fields.prefix.value}${props.fields.value.value}${props.fields.suffix.value}`,
  },
)
```

Seed value in `src/content/advisory-strategic-housing.json`:

```json
"counter": []
```

### 4.2 Pillar II — new `timelineStages` and `offMarket` fields

```ts
timelineStages: fields.array(
  fields.object({
    name: fields.text({ label: "Stage Name" }),
    description: fields.text({ label: "Description (shown on hover/tap)", multiline: true }),
  }),
  {
    label: "Timeline Stages",
    itemLabel: (props) => props.fields.name.value,
  },
),
offMarket: fields.object(
  {
    enabled: fields.checkbox({ label: "Show Section", defaultValue: true }),
    percentage: fields.text({
      label: "Percentage (optional — e.g. '68')",
      description: "If blank, renders the qualitative map variant instead of a stat.",
    }),
    caption: fields.text({ label: "Caption", multiline: true }),
  },
  { label: "Off-Market Access" },
)
```

Seed values in `src/content/advisory-transaction-representation.json`:

```json
"timelineStages": [
  { "name": "Sourcing", "description": "" },
  { "name": "Negotiation", "description": "" },
  { "name": "Contract", "description": "" },
  { "name": "Closing", "description": "" },
  { "name": "Handoff", "description": "" }
],
"offMarket": {
  "enabled": false,
  "percentage": "",
  "caption": "Where the best diplomatic properties surface before they reach the open market."
}
```

Seeding `enabled: false` means the section doesn't render until the client opts in via Keystatic.

### 4.3 Pillar III — no content additions

The heartbeat is fixed decoration (same stance as the hero watermark numeral). No CMS field added.

## 5. Component Design

### 5.1 `PortfolioCounter.astro` (new)

**Path:** `src/components/sections/advisory/PortfolioCounter.astro`

**Props:**

```ts
interface CounterItem {
  value: string;
  prefix?: string;
  suffix?: string;
  caption: string;
}

interface Props {
  items: CounterItem[];
  pillarSlug: string;
}
```

**Rendering:**

- `items.length === 0` → component returns nothing.
- `items.length === 1` → centered hero layout: Playfair Display ~96–120px (responsive), prefix and suffix flanking the animated number, caption (Playfair italic, ~18px) below. `max-width: 640px`, centered.
- `items.length >= 2` → grid layout. 2 items: 2-col on md+. 3 items: 3-col on md+. 4 items: 4-col on lg+ (2×2 on md). Each tile: number ~56–72px Playfair, caption ~13–14px DM Sans below.
- Section wrapper: `bg-canvas`, padding `px-6 md:px-12 lg:px-20 py-16 lg:py-24`.
- Numbers in `text-primary`, captions in `text-text/70`.

**Animation:**

- `IntersectionObserver` at `threshold: 0.5`. When triggered:
  - Parse each `value` with `parseFloat`. If `NaN`, render value text statically (no tween).
  - Otherwise tween from 0 to target over 1.4s using `requestAnimationFrame`. Ease-out cubic. Decimal places in output match the input string (e.g., `"45"` → integer tween, `"2.5"` → one-decimal tween).
- Fires once per page visit. The observer disconnects after first intersection.
- Fires `trackAdvisoryCounterViewed(pillarSlug)` on first reveal.

**Reduced motion:** if `matchMedia("(prefers-reduced-motion: reduce)").matches`, render final value directly with no tween; still fires the analytics event.

**Accessibility:** each tile is a `<div>` with `role="group"` and `aria-label` equal to `"{prefix}{value}{suffix} — {caption}"` so screen readers announce the complete meaning. The animating digit itself has `aria-hidden="true"` to avoid announcing every intermediate value.

### 5.2 `TransactionTimeline.astro` (updated)

**Path:** `src/components/sections/advisory/TransactionTimeline.astro`

**Props:**

```ts
interface TimelineStage {
  name: string;
  description: string;
}

interface Props {
  stages: TimelineStage[];
  pillarSlug: string;
}
```

**Fallback behavior:** if `stages` is empty or `undefined`, render the Phase 1 hard-coded 5-stage list (`Sourcing / Negotiation / Contract / Closing / Handoff`) with no descriptions and no interactive behavior. Keeps rendering safe if CMS hasn't been populated.

**Rendering:**

- SVG layout from Phase 1 preserved. Each node is now wrapped in a `<button type="button">` (if the stage has a non-empty `description`) or a `<span>` (otherwise). Buttons get:
  - `aria-haspopup="true"`
  - `aria-expanded="false"` (toggled on state change)
  - `aria-controls={popoverId}`
  - Focus ring: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`
- Popover `<div>` sibling for each interactive stage:
  - Absolutely positioned, above the node on desktop, below on narrow viewports (detected via `window.matchMedia("(max-width: 640px)")`).
  - Hidden by default (`display: none`).
  - Content: stage name (Playfair, ~15px, bold) + description (DM Sans, ~13px, line-height 1.5).
  - Background `bg-primary`, text `text-canvas`, ~260–320px wide, rounded-sm, shadow.
  - Small arrow/caret pointing to its node.

**Interaction script (vanilla JS `<script>` block):**

```js
const state = { openStage: null };
const viewedStages = new Set();

function open(button) { /* set aria-expanded, show popover */ }
function close(button) { /* reverse */ }
function toggle(button) { /* ... */ }

buttons.forEach(button => {
  // Desktop hover
  button.addEventListener("mouseenter", () => openWithDelay(button, 100));
  button.addEventListener("mouseleave", () => closeWithDelay(button, 200));

  // Tap / click (both desktop and mobile)
  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggle(button);
  });

  // Keyboard
  button.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(button); }
    if (e.key === "Escape") { close(button); button.focus(); }
    if (e.key === "ArrowRight") { /* focus next node */ }
    if (e.key === "ArrowLeft")  { /* focus prev node */ }
  });
});

// Click outside closes
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-timeline-node]")) closeAll();
});

// Analytics: dedupe per stage per page visit
function onOpen(button) {
  const stage = button.dataset.stage;
  if (!viewedStages.has(stage)) {
    viewedStages.add(stage);
    trackAdvisoryTimelineStageViewed(pillarSlug, stage);
  }
}
```

**Mobile adaptation:** when viewport ≤ 640px, popover anchors below node (safer for reachability). Only one popover open at a time; opening another closes the current one.

**Reduced motion:** no open/close transitions beyond an instant show/hide.

### 5.3 `OffMarketInfographic.astro` (new)

**Path:** `src/components/sections/advisory/OffMarketInfographic.astro`

**Props:**

```ts
interface Props {
  enabled: boolean;
  percentage: string;   // "" when blank
  caption: string;
  pillarSlug: string;
}
```

**Rendering:**

- `enabled === false` → returns nothing.
- `percentage` is a non-empty string → **Variant A** (data-driven):
  - Centered layout. Playfair Display ~128px with a leading `%` or trailing `%` per typographic preference — for this project, **trailing**: `"68%"`.
  - Number tweened from 0 to `parseFloat(percentage)` on scroll-in, same 1.4s ease-out pattern as the counter. Color `text-accent`.
  - `caption` below in Playfair italic, ~18–20px, max-width 520px, `text-text/75`.
- `percentage` is blank → **Variant B** (qualitative):
  - Centered SVG map, ~640px wide × 360px tall. Stylized representation of a diplomatic quarter: clustered rectangular blocks (buildings), thin gray street grid, 4–6 gold pin markers scattered. No real geography, no labels.
  - `caption` below.
- Section wrapper: `bg-canvas`, padding `px-6 md:px-12 lg:px-20 py-16 lg:py-24`.
- Fires `trackAdvisoryOffMarketViewed(pillarSlug, hasStat)` on first scroll-in, where `hasStat = percentage.trim().length > 0`.
- Reduced motion: no tween in Variant A.
- Accessibility: Variant A — caption announced; the number has `aria-hidden="true"` (screen readers get the full value via the `role="group"` `aria-label`). Variant B — SVG has `<title>` and `<desc>` children.

### 5.4 `HeartbeatBackdrop.astro` (new)

**Path:** `src/components/sections/advisory/HeartbeatBackdrop.astro`

**Props:** `interface Props { pillarSlug: string; }`

**Rendering:**

- Single inline SVG. `viewBox="0 0 1200 200"`, `width="100%"`, `height="100%"`, rendered inside an absolutely-positioned wrapper (`absolute inset-0 -z-10 pointer-events-none`).
- Path `d` value: a flat line with four periodic heartbeat spikes, drawn as:
  ```
  M 0 100 L 200 100 L 220 60 L 240 140 L 260 100 L 500 100 L 520 60 L 540 140 L 560 100 L 800 100 L 820 60 L 840 140 L 860 100 L 1200 100
  ```
- Stroke: `var(--color-accent-light)` at 22% opacity, `stroke-width: 1.25`, `fill: none`.
- `aria-hidden="true"`.

**Animation:**

- CSS:
  ```css
  .heartbeat-path {
    stroke-dasharray: 2800;
    stroke-dashoffset: 2800;
  }
  .heartbeat-visible .heartbeat-path {
    transition: stroke-dashoffset 2s cubic-bezier(.4, 0, .2, 1);
    stroke-dashoffset: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .heartbeat-path { stroke-dashoffset: 0; transition: none; }
  }
  ```
- Script: `IntersectionObserver` at `threshold: 0.3` adds `.heartbeat-visible` class to the wrapper when entering viewport. Disconnects after first reveal. Fires `trackAdvisoryHeartbeatViewed(pillarSlug)` on trigger.

**Placement:**

- Rendered via a new named slot on `PillarHero.astro`:
  ```astro
  <slot name="backdrop" />
  ```
- Slot container inside hero: `<div class="absolute inset-0 overflow-hidden pointer-events-none"><slot name="backdrop" /></div>`.
- Pillar I and II pages pass nothing — slot is empty, zero cost.
- Pillar III page passes `<HeartbeatBackdrop slot="backdrop" pillarSlug="operational-stewardship" />`.

### 5.5 `PillarHero.astro` (updated)

**Change:** wrap the existing hero content with a relative container that adds a backdrop slot. The watermark numeral stays. Order in DOM (front to back by z-index):

1. Main content (Label, H1, LineReveal, subtitle, intro paragraphs) — `z-[1]`
2. Watermark numeral — `z-0` (already absolute)
3. Backdrop slot wrapper — `z-[-10]` (behind numeral and content)

Add to frontmatter no new props; just the slot. Pillar III page uses it, others leave it empty.

## 6. Analytics

### 6.1 Event Additions (`src/lib/analytics.ts`)

Extend the `AnalyticsEvent` union:

```ts
| "Advisory:CounterViewed"
| "Advisory:TimelineStageViewed"
| "Advisory:OffMarketViewed"
| "Advisory:HeartbeatViewed"
```

Add helpers:

```ts
export function trackAdvisoryCounterViewed(pillar: string): void {
  trackEvent("Advisory:CounterViewed", { pillar });
}

export function trackAdvisoryTimelineStageViewed(pillar: string, stage: string): void {
  trackEvent("Advisory:TimelineStageViewed", { pillar, stage });
}

export function trackAdvisoryOffMarketViewed(pillar: string, hasStat: boolean): void {
  trackEvent("Advisory:OffMarketViewed", { pillar, hasStat });
}

export function trackAdvisoryHeartbeatViewed(pillar: string): void {
  trackEvent("Advisory:HeartbeatViewed", { pillar });
}
```

### 6.2 Deduplication Rules

- **Counter**, **Off-Market**, **Heartbeat**: fire at most once per page visit per component instance. The `IntersectionObserver` that triggers the visual also fires the analytics call, then disconnects.
- **Timeline**: per-stage dedupe. Opening the same stage twice on one page visit fires one event; opening different stages each fires their own event. Implementation: a `Set<string>` scoped inside the timeline's script block.

### 6.3 `pillar` Value

Use the URL slug, matching Phase 1:
- `"strategic-housing"` for Pillar I
- `"transaction-representation"` for Pillar II
- `"operational-stewardship"` for Pillar III

## 7. Accessibility

- **Counter:** animating digits `aria-hidden="true"`; wrapping `<div role="group" aria-label="{prefix}{value}{suffix} — {caption}">` carries the meaning for screen readers.
- **Timeline:** interactive nodes are `<button type="button">` with `aria-haspopup="true"`, `aria-expanded` toggled, `aria-controls` pointing to the popover; keyboard navigation: Tab focuses, Enter/Space toggles, Esc closes and returns focus, ArrowLeft/ArrowRight cycles between nodes. Non-interactive stages render as `<span>` (no ARIA button noise). Popover has `role="tooltip"` or `role="region"` with a visible `aria-labelledby` pointing to the stage name.
- **Off-Market Variant A:** numeric digit `aria-hidden="true"`; wrapping `role="group"` carries `aria-label` with the full statement (e.g., `"68 percent — Where the best diplomatic properties surface before they reach the open market."`).
- **Off-Market Variant B:** SVG map has `<title>` and `<desc>` children.
- **Heartbeat backdrop:** `aria-hidden="true"` — purely decorative.
- **Reduced motion:** each component checks `prefers-reduced-motion` via `matchMedia` and falls back to a static final state.
- **Lighthouse a11y score ≥ 95** on each pillar page post-Phase-2a.

## 8. Testing Plan

No automated test framework in the project.

**Static checks:**
- `npx astro check` — zero new errors.
- `npm run build` — clean build.

**Manual browser pass (per pillar page):**

**Pillar I — `/advisory/strategic-housing`:**
- Add one counter item (`value: "45"`, `prefix: "$"`, `suffix: "M"`, `caption: "..."`) via Keystatic or JSON. Reload.
  - Verify counter section appears between hero and service boxes.
  - Verify tween fires once on scroll-in.
  - Verify Plausible fires `Advisory:CounterViewed` with `{ pillar: "strategic-housing" }`.
- Add three counter items. Verify 3-column row layout on md+, stacks on mobile.
- Clear all items. Verify section disappears.
- Set `prefers-reduced-motion: reduce` in DevTools. Verify counter shows final value instantly.

**Pillar II — `/advisory/transaction-representation`:**
- Populate each `timelineStages[].description` via Keystatic.
  - Desktop: hover each node → popover appears after ~100ms with correct content; leaving closes.
  - Desktop: click each node → toggles popover; clicking another node swaps.
  - Desktop: Tab to a node, Enter opens popover, Esc closes and returns focus.
  - Desktop: ArrowLeft/ArrowRight cycles focus between nodes.
  - Mobile (DevTools emulate ≤ 640px): tap each node → popover opens below; tap another node → swaps; tap outside → closes.
  - Verify `Advisory:TimelineStageViewed` fires once per stage per page visit.
- Blank one stage's description. Reload. Verify that stage is a span (not a button), has no popover, does not fire analytics.
- Toggle `offMarket.enabled = true`, leave `percentage` blank → Variant B renders (SVG map + caption).
- Populate `offMarket.percentage = "68"` → Variant A renders (animated number + caption). Tween plays once.
- Verify `Advisory:OffMarketViewed` fires once with correct `hasStat` value.

**Pillar III — `/advisory/operational-stewardship`:**
- Reload the page. Scroll into hero. Verify heartbeat line draws in over ~2s.
- Hard-reload → verify animation plays again (not cached past disconnect).
- Set `prefers-reduced-motion: reduce` in DevTools. Reload. Verify line renders statically (already at full stroke).
- Verify `Advisory:HeartbeatViewed` fires once.

**Responsive pass:** 375 / 768 / 1100 / 1440 on each pillar page.

**A11y pass:**
- Keyboard-only: complete Tab loop on Pillar II timeline is smooth; focus visible; no trapped focus.
- VoiceOver (macOS, Cmd-F5): Pillar II timeline button announces state; popover content announced on open. Pillar I counter tile announces the full label. Heartbeat and watermark numerals are not announced.
- Lighthouse accessibility ≥ 95 on each pillar page.

**CMS smoke test:** every new field saves and propagates correctly after a Keystatic Cloud publish.

## 9. Implementation Sequence (high-level)

(Detailed task plan will be produced by writing-plans.)

1. Extend `AnalyticsEvent` union + add 4 tracker helpers.
2. Extend Keystatic config (Pillar I counter; Pillar II timelineStages + offMarket).
3. Seed the two singleton JSONs with default values for new fields.
4. Build `PortfolioCounter.astro` and integrate into Pillar I page.
5. Update `TransactionTimeline.astro` for popover + wire into Pillar II page (pass `stages`).
6. Build `OffMarketInfographic.astro` and integrate into Pillar II page.
7. Update `PillarHero.astro` with backdrop slot.
8. Build `HeartbeatBackdrop.astro` and integrate into Pillar III page.
9. End-to-end verification + `npm run build` + a11y + CMS smoke test.

## 10. Open Questions / Assumptions

- **Percentage display** in Variant A uses trailing `%` (e.g., `"68%"`). Easy to flip during implementation if preferred.
- **Map variant** SVG content in `OffMarketInfographic` Variant B is stylized — no real geography. Any visual adjustment (number of blocks, pin positions) is a small iteration, not a spec-level decision.
- **Counter tile caps at 4 items.** If the client adds more via Keystatic, the component renders them but layout may overflow on narrower viewports. UI doesn't enforce a cap; Keystatic's `itemLabel` surface is the soft constraint.

---

**End of spec.**

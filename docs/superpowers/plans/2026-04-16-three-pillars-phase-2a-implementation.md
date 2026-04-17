# Three Pillars — Phase 2a Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four deferred visual-polish interactives onto the three existing `/advisory/*` pages — portfolio counter (Pillar I), timeline hover/tap popovers (Pillar II), off-market infographic (Pillar II), heartbeat backdrop (Pillar III) — as vanilla-JS Astro components with CMS-editable content where applicable.

**Architecture:** Each interactive is a self-contained Astro component that uses `IntersectionObserver` for reveal-on-scroll and vanilla JS `<script>` blocks for interaction. No new React islands. `TransactionTimeline.astro` is upgraded in place to accept CMS stages and render per-node popovers. `PillarHero.astro` gains a `backdrop` slot so Pillar III can inject the heartbeat SVG behind its intro.

**Tech Stack:** Astro 5, Keystatic Cloud (CMS), Tailwind v4, Plausible analytics. No test framework — verification is `npx astro check` + `npm run build` + manual browser pass.

**Spec:** `docs/superpowers/specs/2026-04-16-three-pillars-phase-2a-visual-polish-design.md`

**Prerequisite:** Phase 1 must be in place on the working branch. This plan assumes the existence of `src/components/sections/advisory/{PillarHero,TransactionTimeline,ServiceBox,PullQuote,PillarCTA,PillarSecondaryNav}.astro`, the three `src/pages/advisory/*.astro` pages, the three `src/content/advisory-*.json` singletons, and the `advisorySchema` constant in `keystatic.config.ts`.

---

## Pre-Flight

Start the dev server once in a background terminal. Leave it running.

```bash
npm run dev
# http://localhost:4321
```

Each task that touches `.astro`, `.tsx`, or JSON content hot-reloads. Run `npx astro check` between tasks when types change. Run `npm run build` at phase boundaries.

---

## Phase 1: Analytics + CMS Schema

### Task 1: Add four Phase 2a analytics events

**Files:**
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Extend the event union and add four tracker helpers**

Open `src/lib/analytics.ts`. Extend the `AnalyticsEvent` union (currently ends with `"Advisory:NavDropdownOpened"`). After that line, add:

```ts
  | "Advisory:CounterViewed"
  | "Advisory:TimelineStageViewed"
  | "Advisory:OffMarketViewed"
  | "Advisory:HeartbeatViewed";
```

At the bottom of the file (after `trackAdvisoryNavDropdownOpened`), add:

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

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "feat(analytics): add Phase 2a advisory event trackers"
```

---

### Task 2: Split Keystatic `advisorySchema` into pillar-specific schemas

**Files:**
- Modify: `keystatic.config.ts`

Phase 1 used a single shared `advisorySchema` across all three singletons. Phase 2a introduces pillar-specific additions (`counter` on Pillar I; `timelineStages` + `offMarket` on Pillar II). Pillar III stays on the shared schema. We do this by defining three per-pillar schemas that spread the shared one.

- [ ] **Step 1: Add three per-pillar schema constants**

Open `keystatic.config.ts`. Immediately after the closing `};` of `advisorySchema` (line ~69 — the line that ends the existing shared object) and before `export default config({`, add:

```ts
const advisoryStrategicHousingSchema = {
  ...advisorySchema,
  counter: fields.array(
    fields.object({
      value: fields.text({
        label: "Value (numeric)",
        description: "The number to animate to — digits only, e.g. \"45\" or \"2.5\".",
      }),
      prefix: fields.text({
        label: "Prefix",
        description: "Optional text before the number, e.g. \"$\".",
      }),
      suffix: fields.text({
        label: "Suffix",
        description: "Optional text after the number, e.g. \"M\" or \"+\".",
      }),
      caption: fields.text({ label: "Caption", multiline: true }),
    }),
    {
      label: "Benchmark Counter",
      description: "0 items hides the section. 1 item renders as a hero number. 2–4 items render as a row of tiles.",
      itemLabel: (props) =>
        `${props.fields.prefix.value}${props.fields.value.value}${props.fields.suffix.value}`.trim() || "(empty)",
    },
  ),
};

const advisoryTransactionRepresentationSchema = {
  ...advisorySchema,
  timelineStages: fields.array(
    fields.object({
      name: fields.text({ label: "Stage Name" }),
      description: fields.text({
        label: "Description",
        description: "Shown in the popover on hover/tap. Blank = non-interactive label only.",
        multiline: true,
      }),
    }),
    {
      label: "Timeline Stages",
      description: "Five stages expected. If the array is empty, the component falls back to its hardcoded labels.",
      itemLabel: (props) => props.fields.name.value,
    },
  ),
  offMarket: fields.object(
    {
      enabled: fields.checkbox({ label: "Show Section", defaultValue: false }),
      percentage: fields.text({
        label: "Percentage (optional)",
        description: "Digits only, e.g. \"68\". If blank, the qualitative map variant renders instead of the stat.",
      }),
      caption: fields.text({
        label: "Caption",
        description: "Shown in both the stat variant and the map variant.",
        multiline: true,
      }),
    },
    { label: "Off-Market Access" },
  ),
};

const advisoryOperationalStewardshipSchema = {
  ...advisorySchema,
};
```

- [ ] **Step 2: Point each singleton at its new schema**

In the `singletons: { ... }` block, find the three advisory singleton registrations (around line 426) and change each `schema: advisorySchema,` to its pillar-specific schema:

```ts
    advisoryStrategicHousing: singleton({
      label: "Advisory — Strategic Housing",
      path: "src/content/advisory-strategic-housing",
      format: { data: "json" },
      schema: advisoryStrategicHousingSchema,
    }),

    advisoryTransactionRepresentation: singleton({
      label: "Advisory — Transaction & Representation",
      path: "src/content/advisory-transaction-representation",
      format: { data: "json" },
      schema: advisoryTransactionRepresentationSchema,
    }),

    advisoryOperationalStewardship: singleton({
      label: "Advisory — Operational Stewardship",
      path: "src/content/advisory-operational-stewardship",
      format: { data: "json" },
      schema: advisoryOperationalStewardshipSchema,
    }),
```

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

Expected: no new errors. If Keystatic complains about missing fields in the existing JSON singletons, Task 3 and Task 4 fix those.

- [ ] **Step 4: Commit**

```bash
git add keystatic.config.ts
git commit -m "feat(cms): split advisory schemas per pillar for Phase 2a fields"
```

---

### Task 3: Seed Pillar I `counter` default

**Files:**
- Modify: `src/content/advisory-strategic-housing.json`

- [ ] **Step 1: Add empty counter array**

Open `src/content/advisory-strategic-housing.json`. After the `seo` block (or anywhere at the top level — Keystatic does not enforce order), add a top-level `counter` key set to an empty array. Place it after `crossLinks` for readability:

```json
  "counter": []
```

The closing brace of the previous field (typically `"crossLinks": [ ... ]`) gets a comma, and `"counter": []` is added as a new top-level key before the final `}` of the JSON document.

- [ ] **Step 2: Verify the file is still valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/content/advisory-strategic-housing.json', 'utf8')); console.log('ok')"
```

Expected: `ok`.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

Expected: no errors. The Keystatic reader's typing for `advisoryStrategicHousing` now requires `counter` to exist, and the JSON file provides it.

- [ ] **Step 4: Commit**

```bash
git add src/content/advisory-strategic-housing.json
git commit -m "content: seed empty counter array on Pillar I"
```

---

### Task 4: Seed Pillar II `timelineStages` + `offMarket` defaults

**Files:**
- Modify: `src/content/advisory-transaction-representation.json`

- [ ] **Step 1: Add default values for the two new fields**

Open `src/content/advisory-transaction-representation.json`. Add these two top-level keys at the end of the file (before the closing `}`), remembering to add a trailing comma on the previous key:

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

- [ ] **Step 2: Verify JSON validity**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/content/advisory-transaction-representation.json', 'utf8')); console.log('ok')"
```

Expected: `ok`.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/advisory-transaction-representation.json
git commit -m "content: seed timelineStages + offMarket defaults on Pillar II"
```

---

### Phase 1 Build Gate

- [ ] **Run `npm run build`.**

```bash
npm run build
```

Expected: succeeds. No page rendering has changed yet (components land in Phase 2). If the build fails, fix before continuing.

---

## Phase 2: Build and Integrate Components

### Task 5: Build `PortfolioCounter.astro`

**Files:**
- Create: `src/components/sections/advisory/PortfolioCounter.astro`

- [ ] **Step 1: Create the component**

```astro
---
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

const { items, pillarSlug } = Astro.props;

if (items.length === 0) return;

const layout: "hero" | "row" = items.length === 1 ? "hero" : "row";
const colsClass =
  items.length === 2
    ? "md:grid-cols-2"
    : items.length === 3
      ? "md:grid-cols-3"
      : "md:grid-cols-2 lg:grid-cols-4";
---

<section
  class="bg-canvas px-6 md:px-12 lg:px-20 py-16 lg:py-24"
  data-portfolio-counter
  data-pillar={pillarSlug}
>
  {layout === "hero" && items[0] && (
    <div class="max-w-[640px] mx-auto text-center">
      <div
        role="group"
        aria-label={`${items[0].prefix ?? ""}${items[0].value}${items[0].suffix ?? ""} — ${items[0].caption}`}
      >
        <div class="font-heading font-bold text-primary leading-none" style="font-size: clamp(72px, 11vw, 120px);">
          <span aria-hidden="true">
            {items[0].prefix && <span>{items[0].prefix}</span>}
            <span data-counter-value data-target={items[0].value}>0</span>
            {items[0].suffix && <span>{items[0].suffix}</span>}
          </span>
        </div>
        <p class="mt-6 font-heading italic text-[18px] lg:text-[20px] text-text/70 leading-[1.55] max-w-[560px] mx-auto">
          {items[0].caption}
        </p>
      </div>
    </div>
  )}

  {layout === "row" && (
    <div class={`max-w-[1100px] mx-auto grid grid-cols-1 ${colsClass} gap-8 lg:gap-10`}>
      {items.map((item) => (
        <div
          role="group"
          aria-label={`${item.prefix ?? ""}${item.value}${item.suffix ?? ""} — ${item.caption}`}
          class="text-center"
        >
          <div class="font-heading font-bold text-primary leading-none" style="font-size: clamp(44px, 5.5vw, 72px);">
            <span aria-hidden="true">
              {item.prefix && <span>{item.prefix}</span>}
              <span data-counter-value data-target={item.value}>0</span>
              {item.suffix && <span>{item.suffix}</span>}
            </span>
          </div>
          <p class="mt-4 text-[13px] lg:text-sm text-text/70 leading-[1.55] max-w-[280px] mx-auto">
            {item.caption}
          </p>
        </div>
      ))}
    </div>
  )}
</section>

<script>
  import { trackAdvisoryCounterViewed } from "@/lib/analytics";

  function parseNumeric(raw: string): { value: number; decimals: number } | null {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return null;
    const dotIdx = raw.indexOf(".");
    const decimals = dotIdx === -1 ? 0 : raw.length - dotIdx - 1;
    return { value: parsed, decimals };
  }

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  function tweenValue(el: HTMLElement, target: number, decimals: number, durationMs: number) {
    const start = performance.now();
    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      const current = target * eased;
      el.textContent = current.toFixed(decimals);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    const sections = document.querySelectorAll<HTMLElement>("[data-portfolio-counter]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    sections.forEach((section) => {
      if (section.dataset.wired === "1") return;
      section.dataset.wired = "1";
      const valueEls = section.querySelectorAll<HTMLElement>("[data-counter-value]");
      const pillar = section.dataset.pillar ?? "unknown";

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            valueEls.forEach((el) => {
              const target = el.dataset.target ?? "";
              const parsed = parseNumeric(target);
              if (!parsed) {
                el.textContent = target;
                return;
              }
              if (reducedMotion) {
                el.textContent = parsed.value.toFixed(parsed.decimals);
              } else {
                tweenValue(el, parsed.value, parsed.decimals, 1400);
              }
            });
            trackAdvisoryCounterViewed(pillar);
            observer.disconnect();
          });
        },
        { threshold: 0.5 },
      );
      observer.observe(section);
    });
  }

  initCounters();
  document.addEventListener("astro:page-load", initCounters);
</script>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/PortfolioCounter.astro
git commit -m "feat(advisory): add PortfolioCounter component"
```

---

### Task 6: Integrate `PortfolioCounter` into Pillar I page

**Files:**
- Modify: `src/pages/advisory/strategic-housing.astro`

- [ ] **Step 1: Import the component and render it**

Open `src/pages/advisory/strategic-housing.astro`.

After line 10 (`import PillarCTA from ...`), add:

```ts
import PortfolioCounter from "@/components/sections/advisory/PortfolioCounter.astro";
```

Inside the `<main>` block, immediately after the closing `</PillarHero>` (around line 52 — the self-closing `<PillarHero ... />` tag), add:

```astro
    <PortfolioCounter items={[...data.counter]} pillarSlug="strategic-housing" />
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/advisory/strategic-housing`. With `counter: []` the page looks identical to before (section hidden).

Then temporarily edit `src/content/advisory-strategic-housing.json` to add one counter item:

```json
  "counter": [
    {
      "value": "45",
      "prefix": "$",
      "suffix": "M",
      "caption": "What 10 Manhattan leases cost a mission across 30 years"
    }
  ]
```

Reload. Expected:
- Counter section appears between hero and service boxes.
- `$0M` visible on initial render, tweens to `$45M` when scrolled into view.
- `Advisory:CounterViewed` fires once in the Plausible dev console (if enabled) or log.
- Revert the test edit; counter section disappears again.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/strategic-housing.astro
git commit -m "feat(advisory): render PortfolioCounter on Pillar I page"
```

---

### Task 7: Upgrade `TransactionTimeline.astro` with props and popovers

**Files:**
- Modify: `src/components/sections/advisory/TransactionTimeline.astro`

- [ ] **Step 1: Replace the file with the interactive version**

Replace the entire contents of `src/components/sections/advisory/TransactionTimeline.astro` with:

```astro
---
interface TimelineStage {
  name: string;
  description?: string;
}

interface Props {
  stages?: TimelineStage[];
  pillarSlug: string;
}

const { stages: stagesProp, pillarSlug } = Astro.props;

const fallback: TimelineStage[] = [
  { name: "Sourcing" },
  { name: "Negotiation" },
  { name: "Contract" },
  { name: "Closing" },
  { name: "Handoff" },
];

const stages: TimelineStage[] =
  stagesProp && stagesProp.length > 0 ? stagesProp : fallback;

const nodeCount = stages.length;
const firstX = 80;
const lastX = 1020;
const span = lastX - firstX;
---

<section
  aria-label="Transaction lifecycle"
  class="bg-canvas px-6 md:px-12 lg:px-20 pb-10 lg:pb-14 relative"
  data-transaction-timeline
  data-pillar={pillarSlug}
>
  <div class="max-w-[1100px] mx-auto relative">
    <svg
      viewBox={`0 0 1100 72`}
      class="w-full h-auto"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Transaction lifecycle: sourcing through handoff</title>
      <desc>
        {nodeCount}-stage horizontal timeline showing the full-cycle
        representation process.
      </desc>
      <line
        x1={firstX}
        y1="24"
        x2={lastX}
        y2="24"
        stroke="#E8DFD0"
        stroke-width="1"
      />
      {stages.map((stage, i) => {
        const x = firstX + (nodeCount === 1 ? 0 : (i * span) / (nodeCount - 1));
        return (
          <Fragment>
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
              {stage.name}
            </text>
          </Fragment>
        );
      })}
    </svg>

    {/* Overlay layer: interactive buttons + popovers aligned to SVG nodes */}
    <div class="absolute inset-0 pointer-events-none" data-timeline-overlay>
      {stages.map((stage, i) => {
        const leftPct = (firstX + (nodeCount === 1 ? 0 : (i * span) / (nodeCount - 1))) / 1100 * 100;
        const hasDetail = Boolean(stage.description && stage.description.trim().length > 0);
        const popId = `tl-pop-${i}`;
        if (!hasDetail) {
          return (
            <span
              aria-hidden="true"
              class="absolute block w-5 h-5 -translate-x-1/2 -translate-y-1/2"
              style={`left: ${leftPct}%; top: 24px;`}
            />
          );
        }
        return (
          <div
            class="absolute"
            style={`left: ${leftPct}%; top: 24px;`}
          >
            <button
              type="button"
              data-timeline-node
              data-stage={stage.name}
              data-index={i}
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls={popId}
              aria-label={`${stage.name} — tap to reveal detail`}
              class="pointer-events-auto absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer bg-transparent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-colors"
            />
            <div
              id={popId}
              data-timeline-popover
              role="region"
              aria-label={`${stage.name} detail`}
              hidden
              class="pointer-events-none absolute z-20 w-[280px] sm:w-[300px] bg-primary text-canvas p-4 sm:p-5 shadow-lg rounded-sm -translate-x-1/2 left-1/2"
            >
              <p class="font-heading font-bold text-[15px] mb-1.5 text-canvas">
                {stage.name}
              </p>
              <p class="text-[13px] leading-[1.55] text-canvas/80">
                {stage.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>

<script>
  import { trackAdvisoryTimelineStageViewed } from "@/lib/analytics";

  function initTimelines() {
    const timelines = document.querySelectorAll<HTMLElement>("[data-transaction-timeline]");
    timelines.forEach((timeline) => {
      if (timeline.dataset.wired === "1") return;
      timeline.dataset.wired = "1";

      const pillar = timeline.dataset.pillar ?? "unknown";
      const buttons = Array.from(
        timeline.querySelectorAll<HTMLButtonElement>("[data-timeline-node]"),
      );
      const viewed = new Set<string>();
      let openButton: HTMLButtonElement | null = null;
      let openTimer: number | undefined;
      let closeTimer: number | undefined;

      const getPopover = (btn: HTMLButtonElement): HTMLElement | null => {
        const id = btn.getAttribute("aria-controls");
        return id ? document.getElementById(id) : null;
      };

      const positionPopover = (btn: HTMLButtonElement, pop: HTMLElement) => {
        // Default above on desktop, below on mobile.
        const narrow = window.matchMedia("(max-width: 640px)").matches;
        pop.style.top = narrow ? "24px" : "-16px";
        pop.style.transform = narrow ? "translate(-50%, 16px)" : "translate(-50%, -100%)";
      };

      const open = (btn: HTMLButtonElement) => {
        if (openButton && openButton !== btn) close(openButton);
        const pop = getPopover(btn);
        if (!pop) return;
        positionPopover(btn, pop);
        pop.hidden = false;
        pop.style.pointerEvents = "auto";
        btn.setAttribute("aria-expanded", "true");
        openButton = btn;
        const stage = btn.dataset.stage ?? "unknown";
        if (!viewed.has(stage)) {
          viewed.add(stage);
          trackAdvisoryTimelineStageViewed(pillar, stage);
        }
      };

      const close = (btn: HTMLButtonElement) => {
        const pop = getPopover(btn);
        if (pop) {
          pop.hidden = true;
          pop.style.pointerEvents = "none";
        }
        btn.setAttribute("aria-expanded", "false");
        if (openButton === btn) openButton = null;
      };

      const closeAll = () => {
        if (openButton) close(openButton);
      };

      buttons.forEach((btn, idx) => {
        // Desktop hover: delayed open, delayed close
        btn.addEventListener("mouseenter", () => {
          window.clearTimeout(closeTimer);
          openTimer = window.setTimeout(() => open(btn), 100);
        });
        btn.addEventListener("mouseleave", () => {
          window.clearTimeout(openTimer);
          closeTimer = window.setTimeout(() => close(btn), 200);
        });

        // Click/tap toggles (primary interaction on mobile)
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isOpen = btn.getAttribute("aria-expanded") === "true";
          if (isOpen) close(btn);
          else open(btn);
        });

        // Keyboard
        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const isOpen = btn.getAttribute("aria-expanded") === "true";
            if (isOpen) close(btn);
            else open(btn);
          } else if (e.key === "Escape") {
            close(btn);
            btn.focus();
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            buttons[(idx + 1) % buttons.length]?.focus();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            buttons[(idx - 1 + buttons.length) % buttons.length]?.focus();
          }
        });
      });

      // Click outside closes
      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-timeline-node]") && !target.closest("[data-timeline-popover]")) {
          closeAll();
        }
      });
    });
  }

  initTimelines();
  document.addEventListener("astro:page-load", initTimelines);
</script>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no errors. The Pillar II page still passes no props; the component falls back to its hardcoded stages (but will error because `pillarSlug` is now required — that's intentional and resolved in Task 8).

Note: if astro check flags missing `pillarSlug` on the existing `<TransactionTimeline />` in `src/pages/advisory/transaction-representation.astro`, that's expected — Task 8 fixes it.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/TransactionTimeline.astro
git commit -m "feat(advisory): upgrade TransactionTimeline with props and popovers"
```

---

### Task 8: Wire CMS timeline stages into Pillar II page

**Files:**
- Modify: `src/pages/advisory/transaction-representation.astro`

- [ ] **Step 1: Pass `stages` and `pillarSlug` to the timeline**

Open `src/pages/advisory/transaction-representation.astro`. Find the `<TransactionTimeline />` line (around line 54) and replace with:

```astro
    <TransactionTimeline
      stages={[...data.timelineStages]}
      pillarSlug="transaction-representation"
    />
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/advisory/transaction-representation`.

With the default seed (all `description` fields empty), timeline renders statically — no popovers, no buttons, no hover effects. Expected.

Temporarily edit `src/content/advisory-transaction-representation.json` to add a description to the first stage:

```json
    { "name": "Sourcing", "description": "Identify on-market and off-market opportunities aligned to mission criteria. Typical: 2–6 months." },
```

Reload. Expected:
- Hovering the "SOURCING" node opens a popover after ~100ms above the node.
- Moving away closes it after ~200ms.
- Clicking the node toggles the popover.
- Tabbing to the node focuses with a visible gold outline; Enter toggles; Esc closes.
- On a narrow viewport (≤640px in DevTools), tapping opens the popover below the node.
- `Advisory:TimelineStageViewed` fires once per unique stage opened.

Revert the JSON edit.

- [ ] **Step 3: Type-check + build**

```bash
npx astro check
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/transaction-representation.astro
git commit -m "feat(advisory): drive TransactionTimeline stages from CMS"
```

---

### Task 9: Build `OffMarketInfographic.astro`

**Files:**
- Create: `src/components/sections/advisory/OffMarketInfographic.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  enabled: boolean;
  percentage: string;
  caption: string;
  pillarSlug: string;
}

const { enabled, percentage, caption, pillarSlug } = Astro.props;

if (!enabled) return;

const trimmedPercentage = percentage.trim();
const hasStat = trimmedPercentage.length > 0 && !Number.isNaN(parseFloat(trimmedPercentage));
---

<section
  class="bg-canvas px-6 md:px-12 lg:px-20 py-16 lg:py-24"
  data-off-market
  data-pillar={pillarSlug}
  data-has-stat={hasStat ? "1" : "0"}
>
  <div class="max-w-[880px] mx-auto text-center">
    {hasStat && (
      <div
        role="group"
        aria-label={`${trimmedPercentage} percent — ${caption}`}
      >
        <div class="font-heading font-bold text-accent leading-none" style="font-size: clamp(80px, 12vw, 128px);">
          <span aria-hidden="true">
            <span data-offmarket-value data-target={trimmedPercentage}>0</span>
            <span>%</span>
          </span>
        </div>
        <p class="mt-6 font-heading italic text-[18px] lg:text-[20px] text-text/75 leading-[1.55] max-w-[560px] mx-auto">
          {caption}
        </p>
      </div>
    )}

    {!hasStat && (
      <div>
        <svg
          viewBox="0 0 640 360"
          class="w-full h-auto max-w-[640px] mx-auto"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Stylized map of a diplomatic quarter</title>
          <desc>
            Abstract representation of a diplomatic neighborhood with gold pin
            markers indicating off-market properties known to the advisory.
          </desc>
          {/* Street grid */}
          <g stroke="#E8DFD0" stroke-width="1">
            <line x1="0" y1="90" x2="640" y2="90" />
            <line x1="0" y1="180" x2="640" y2="180" />
            <line x1="0" y1="270" x2="640" y2="270" />
            <line x1="120" y1="0" x2="120" y2="360" />
            <line x1="260" y1="0" x2="260" y2="360" />
            <line x1="400" y1="0" x2="400" y2="360" />
            <line x1="520" y1="0" x2="520" y2="360" />
          </g>
          {/* Building blocks */}
          <g fill="#F5F0E8" stroke="#E8DFD0" stroke-width="1">
            <rect x="20" y="20" width="80" height="50" />
            <rect x="140" y="20" width="100" height="60" />
            <rect x="280" y="30" width="100" height="50" />
            <rect x="420" y="20" width="80" height="60" />
            <rect x="540" y="30" width="80" height="50" />
            <rect x="20" y="110" width="80" height="60" />
            <rect x="140" y="100" width="100" height="70" />
            <rect x="280" y="110" width="100" height="60" />
            <rect x="420" y="110" width="80" height="60" />
            <rect x="540" y="120" width="80" height="50" />
            <rect x="20" y="200" width="80" height="50" />
            <rect x="140" y="200" width="100" height="60" />
            <rect x="280" y="200" width="100" height="60" />
            <rect x="420" y="200" width="80" height="60" />
            <rect x="540" y="210" width="80" height="50" />
            <rect x="20" y="290" width="80" height="50" />
            <rect x="140" y="290" width="100" height="50" />
            <rect x="280" y="290" width="100" height="50" />
            <rect x="420" y="290" width="80" height="50" />
            <rect x="540" y="290" width="80" height="50" />
          </g>
          {/* Pins */}
          <g>
            <circle cx="180" cy="50" r="6" fill="#B8965A" />
            <circle cx="330" cy="140" r="6" fill="#B8965A" />
            <circle cx="460" cy="50" r="6" fill="#B8965A" />
            <circle cx="70" cy="225" r="6" fill="#B8965A" />
            <circle cx="580" cy="235" r="6" fill="#B8965A" />
          </g>
        </svg>
        <p class="mt-6 font-heading italic text-[18px] lg:text-[20px] text-text/75 leading-[1.55] max-w-[560px] mx-auto">
          {caption}
        </p>
      </div>
    )}
  </div>
</section>

<script>
  import { trackAdvisoryOffMarketViewed } from "@/lib/analytics";

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  function tweenInteger(el: HTMLElement, target: number, durationMs: number) {
    const start = performance.now();
    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      el.textContent = Math.round(target * eased).toString();
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = Math.round(target).toString();
    }
    requestAnimationFrame(frame);
  }

  function initOffMarket() {
    const sections = document.querySelectorAll<HTMLElement>("[data-off-market]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    sections.forEach((section) => {
      if (section.dataset.wired === "1") return;
      section.dataset.wired = "1";
      const pillar = section.dataset.pillar ?? "unknown";
      const hasStat = section.dataset.hasStat === "1";
      const valueEl = section.querySelector<HTMLElement>("[data-offmarket-value]");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (valueEl) {
              const target = parseFloat(valueEl.dataset.target ?? "0");
              if (!Number.isNaN(target)) {
                if (reducedMotion) {
                  valueEl.textContent = Math.round(target).toString();
                } else {
                  tweenInteger(valueEl, target, 1400);
                }
              }
            }
            trackAdvisoryOffMarketViewed(pillar, hasStat);
            observer.disconnect();
          });
        },
        { threshold: 0.5 },
      );
      observer.observe(section);
    });
  }

  initOffMarket();
  document.addEventListener("astro:page-load", initOffMarket);
</script>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/OffMarketInfographic.astro
git commit -m "feat(advisory): add OffMarketInfographic component"
```

---

### Task 10: Integrate `OffMarketInfographic` into Pillar II page

**Files:**
- Modify: `src/pages/advisory/transaction-representation.astro`

- [ ] **Step 1: Import and render**

Open `src/pages/advisory/transaction-representation.astro`.

After the existing advisory component imports (after `import TransactionTimeline from ...`), add:

```ts
import OffMarketInfographic from "@/components/sections/advisory/OffMarketInfographic.astro";
```

Inside the `<main>` block, immediately after the closing `</section>` of the service-boxes section (the `</section>` that follows the `.map` over `data.services`) and before `<PullQuote ... />`, add:

```astro
    <OffMarketInfographic
      enabled={data.offMarket.enabled}
      percentage={data.offMarket.percentage}
      caption={data.offMarket.caption}
      pillarSlug="transaction-representation"
    />
```

- [ ] **Step 2: Verify in browser (both variants)**

Navigate to `http://localhost:4321/advisory/transaction-representation`.

With seed `enabled: false`, section is hidden.

Temporarily edit the JSON to `"enabled": true`, leave `percentage: ""`. Reload. Expected:
- Variant B renders: stylized map + caption.
- `Advisory:OffMarketViewed` fires with `{ hasStat: false }`.

Change `percentage: "68"`. Reload. Expected:
- Variant A renders: giant `0%` that tweens up to `68%` on scroll-in; caption below.
- `Advisory:OffMarketViewed` fires with `{ hasStat: true }`.

Revert to `enabled: false` when done.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/transaction-representation.astro
git commit -m "feat(advisory): render OffMarketInfographic on Pillar II page"
```

---

### Task 11: Add `backdrop` slot to `PillarHero.astro`

**Files:**
- Modify: `src/components/sections/advisory/PillarHero.astro`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/components/sections/advisory/PillarHero.astro` with:

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
  {/* Backdrop slot (rendered behind numeral and content). Empty by default. */}
  <div class="absolute inset-0 pointer-events-none" style="z-index: 0;">
    <slot name="backdrop" />
  </div>

  <span
    aria-hidden="true"
    role="presentation"
    class="pointer-events-none select-none absolute right-4 lg:right-10 top-2 lg:top-8 font-heading font-bold leading-none text-primary/[0.08]"
    style="font-size: clamp(180px, 28vw, 320px); z-index: 1;"
  >
    {numeral}
  </span>

  <div class="relative max-w-[1100px] mx-auto" style="z-index: 2;">
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

- [ ] **Step 2: Verify existing pillar pages still look correct**

Visit all three pillar pages in the browser. Expected: each renders identically to before — the new backdrop slot is empty and zero-cost on all three pages at this point.

- [ ] **Step 3: Type-check**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/advisory/PillarHero.astro
git commit -m "feat(advisory): add backdrop slot to PillarHero"
```

---

### Task 12: Build `HeartbeatBackdrop.astro`

**Files:**
- Create: `src/components/sections/advisory/HeartbeatBackdrop.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  pillarSlug: string;
}

const { pillarSlug } = Astro.props;
---

<div
  class="heartbeat-wrap absolute inset-0 flex items-center justify-center"
  data-heartbeat
  data-pillar={pillarSlug}
  aria-hidden="true"
>
  <svg
    viewBox="0 0 1200 200"
    preserveAspectRatio="none"
    class="w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      class="heartbeat-path"
      d="M 0 100 L 200 100 L 220 60 L 240 140 L 260 100 L 500 100 L 520 60 L 540 140 L 560 100 L 800 100 L 820 60 L 840 140 L 860 100 L 1200 100"
      stroke="var(--color-accent-light)"
      stroke-opacity="0.22"
      stroke-width="1.25"
      fill="none"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</div>

<style>
  .heartbeat-path {
    stroke-dasharray: 2800;
    stroke-dashoffset: 2800;
  }
  .heartbeat-wrap.is-visible .heartbeat-path {
    transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1);
    stroke-dashoffset: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .heartbeat-path {
      stroke-dashoffset: 0;
      transition: none;
    }
  }
</style>

<script>
  import { trackAdvisoryHeartbeatViewed } from "@/lib/analytics";

  function initHeartbeat() {
    const wraps = document.querySelectorAll<HTMLElement>("[data-heartbeat]");
    wraps.forEach((wrap) => {
      if (wrap.dataset.wired === "1") return;
      wrap.dataset.wired = "1";
      const pillar = wrap.dataset.pillar ?? "unknown";

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            wrap.classList.add("is-visible");
            trackAdvisoryHeartbeatViewed(pillar);
            observer.disconnect();
          });
        },
        { threshold: 0.3 },
      );
      observer.observe(wrap);
    });
  }

  initHeartbeat();
  document.addEventListener("astro:page-load", initHeartbeat);
</script>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/advisory/HeartbeatBackdrop.astro
git commit -m "feat(advisory): add HeartbeatBackdrop component"
```

---

### Task 13: Render `HeartbeatBackdrop` in Pillar III hero slot

**Files:**
- Modify: `src/pages/advisory/operational-stewardship.astro`

- [ ] **Step 1: Import and inject via the named slot**

Open `src/pages/advisory/operational-stewardship.astro`.

After the existing advisory imports, add:

```ts
import HeartbeatBackdrop from "@/components/sections/advisory/HeartbeatBackdrop.astro";
```

Find the `<PillarHero ... />` element. It's currently self-closing. Convert it to an opening/closing pair and inject the heartbeat as a named slot child:

```astro
    <PillarHero
      numeral={data.hero.numeral}
      title={data.hero.title}
      subtitle={data.hero.subtitle}
      intro={data.hero.intro}
      introSecondary={data.hero.introSecondary}
    >
      <HeartbeatBackdrop slot="backdrop" pillarSlug="operational-stewardship" />
    </PillarHero>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/advisory/operational-stewardship`.

Expected:
- On initial scroll into hero, a subtle heartbeat-waveform line draws from left to right over ~2 seconds in the upper-middle area of the hero (behind the text).
- Hard-reload re-plays the animation once.
- `Advisory:HeartbeatViewed` fires with `{ pillar: "operational-stewardship" }` on first reveal.

Emulate reduced motion in DevTools (Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce"). Reload. Expected: the line appears at full draw immediately, no animation.

- [ ] **Step 3: Type-check + build**

```bash
npx astro check
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/advisory/operational-stewardship.astro
git commit -m "feat(advisory): render HeartbeatBackdrop in Pillar III hero"
```

---

## Phase 3: Final Verification

### Task 14: End-to-end QA + production build

**Files:** (no code changes — verification only)

- [ ] **Step 1: Clean build**

```bash
npm run build
```

Expected: succeeds. All three pillar pages regenerate under `dist/advisory/*/index.html`.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

- [ ] **Step 3: Pillar I manual QA (`/advisory/strategic-housing`)**

Temporarily edit the counter field in `src/content/advisory-strategic-housing.json` (or via Keystatic) with three items:

```json
  "counter": [
    { "value": "45", "prefix": "$", "suffix": "M", "caption": "Example caption 1" },
    { "value": "30", "prefix": "", "suffix": "yr", "caption": "Example caption 2" },
    { "value": "7000", "prefix": "", "suffix": "+", "caption": "Example caption 3" }
  ]
```

- [ ] Counter section renders as a 3-column row on desktop (md+), stacks on mobile.
- [ ] All three numbers tween from 0 to target on scroll-in.
- [ ] `Advisory:CounterViewed` fires once with `{ pillar: "strategic-housing" }`.
- [ ] Clear to one item → renders as centered hero number.
- [ ] Clear to empty array → section disappears.
- [ ] Enable `prefers-reduced-motion: reduce` via DevTools Rendering panel → counter shows target value instantly.
- [ ] Revert JSON to `"counter": []` before finishing.

- [ ] **Step 4: Pillar II manual QA (`/advisory/transaction-representation`)**

Temporarily populate all 5 timeline descriptions in the JSON (any short text).

- [ ] Desktop hover on each node opens popover above node after ~100ms.
- [ ] Desktop click on each node toggles popover.
- [ ] Opening a new node closes the previously open one (only one at a time).
- [ ] Tab focuses each button; focus ring is visible (gold outline).
- [ ] Enter/Space on focused button toggles popover.
- [ ] Escape closes popover and returns focus to button.
- [ ] ArrowLeft / ArrowRight cycles focus between buttons.
- [ ] Mobile (DevTools device toolbar ≤ 640px): tap toggles; popover renders below node.
- [ ] Click outside timeline closes the open popover.
- [ ] `Advisory:TimelineStageViewed` fires once per unique stage per page visit.
- [ ] Clear one stage's description → that stage is non-interactive (no button role, no hover, no analytics).

Toggle `offMarket.enabled: true`, `percentage: ""`:

- [ ] Variant B renders (SVG map + caption) between services and pull quote.
- [ ] `Advisory:OffMarketViewed` fires with `{ hasStat: false }`.

Set `percentage: "68"`:

- [ ] Variant A renders (giant `%` number + caption).
- [ ] Number tweens from 0 to 68 on scroll-in.
- [ ] `Advisory:OffMarketViewed` fires with `{ hasStat: true }`.
- [ ] Reduced motion emulation → shows final value instantly.

Revert timeline descriptions to empty and `offMarket.enabled: false` before finishing.

- [ ] **Step 5: Pillar III manual QA (`/advisory/operational-stewardship`)**

- [ ] Scroll into hero. Heartbeat waveform draws from left to right over ~2s, subtle gold at low opacity.
- [ ] Hard-reload (Cmd-Shift-R) → animation plays again once.
- [ ] Soft navigation back to page via nav dropdown → animation plays again (Astro page-load listener).
- [ ] Reduced motion emulation → line renders fully drawn immediately, no animation.
- [ ] Line does not interfere with hero text readability or layout.
- [ ] `Advisory:HeartbeatViewed` fires once with `{ pillar: "operational-stewardship" }`.

- [ ] **Step 6: Cross-cutting checks**

- [ ] `view-source:` on each pillar page shows the JSON-LD blocks (unchanged from Phase 1 — regression check).
- [ ] No new console errors on any pillar page.
- [ ] Responsive pass at 375 / 768 / 1100 / 1440 on each pillar page: all new sections render cleanly, no overflow or awkward wrapping.
- [ ] Lighthouse accessibility ≥ 95 on each pillar page (run against the preview build, not dev).

- [ ] **Step 7: CMS smoke test**

Open Keystatic at `http://localhost:4321/keystatic` (or Keystatic Cloud).

- [ ] Advisory — Strategic Housing: "Benchmark Counter" field is present. Add/remove items; changes persist after save and render on page.
- [ ] Advisory — Transaction & Representation: "Timeline Stages" and "Off-Market Access" fields are present. Stage descriptions edit inline; off-market `enabled`, `percentage`, `caption` all editable.
- [ ] Advisory — Operational Stewardship: no new fields added (regression check — should look identical to Phase 1 state).

- [ ] **Step 8: Final verification commit (only if any tweaks surfaced during QA)**

If QA surfaced small adjustments, commit them individually. Otherwise, no commit.

- [ ] **Step 9: Push + PR (outside this plan)**

Plan complete. Push the branch and open a PR when ready.

---

## Deferred to Phase 2b (separate future plan)

Do NOT implement in this plan:

- Pillar I: interactive rent-vs-buy directional slider.
- Pillar III: interactive dashboard (Phase 1's static `DashboardIllustration.astro` stays).

---

**End of plan.**

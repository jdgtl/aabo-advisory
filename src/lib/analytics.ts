/**
 * Plausible analytics helper functions.
 * Wraps the plausible() global with typed event names and per-event payload shapes.
 */

export type PillarId =
  | "strategic-housing"
  | "transaction-representation"
  | "operational-stewardship";

type EventPropMap = {
  "Calculator:Started": never;
  "Calculator:GateShown": never;
  "Calculator:LeadCaptured": never;
  "Calculator:GateSkipped": never;
  "Calculator:FullResultsViewed": never;
  "Calculator:PDFDownloaded": never;
  "Calculator:ResultsEmailed": never;
  "Contact:ModalOpened": never;
  "Contact:Submitted": never;
  "Article:Opened": { title: string };
  "CTA:Clicked": { location: string };
  "Advisory:CTAClicked": { pillar: PillarId; location: string };
  "Advisory:CrossLinkClicked": { pillar: PillarId; targetHref: string; label: string };
  "Advisory:NavDropdownOpened": { source: "desktop" | "mobile" };
};

export type AnalyticsEvent = keyof EventPropMap;

type PropArgs<E extends AnalyticsEvent> =
  [EventPropMap[E]] extends [never] ? [] : [props: EventPropMap[E]];

type PlausibleProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleProps }) => void;
  }
}

export function trackEvent<E extends AnalyticsEvent>(
  event: E,
  ...rest: PropArgs<E>
): void {
  if (typeof window === "undefined" || !window.plausible) return;
  const props = rest[0] as PlausibleProps | undefined;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break UX — swallow transport/CSP errors.
  }
}

export function trackCalculatorStarted(): void {
  trackEvent("Calculator:Started");
}

export function trackGateShown(): void {
  trackEvent("Calculator:GateShown");
}

export function trackLeadCaptured(): void {
  trackEvent("Calculator:LeadCaptured");
}

export function trackGateSkipped(): void {
  trackEvent("Calculator:GateSkipped");
}

export function trackFullResultsViewed(): void {
  trackEvent("Calculator:FullResultsViewed");
}

export function trackContactModalOpened(): void {
  trackEvent("Contact:ModalOpened");
}

export function trackContactSubmitted(): void {
  trackEvent("Contact:Submitted");
}

export function trackArticleOpened(title: string): void {
  trackEvent("Article:Opened", { title });
}

export function trackCTAClicked(location: string): void {
  trackEvent("CTA:Clicked", { location });
}

export function trackPDFDownloaded(): void {
  trackEvent("Calculator:PDFDownloaded");
}

export function trackResultsEmailed(): void {
  trackEvent("Calculator:ResultsEmailed");
}

export function trackAdvisoryCTAClicked(pillar: PillarId, location: string): void {
  trackEvent("Advisory:CTAClicked", { pillar, location });
}

export function trackAdvisoryCrossLinkClicked(
  pillar: PillarId,
  targetHref: string,
  label: string,
): void {
  trackEvent("Advisory:CrossLinkClicked", { pillar, targetHref, label });
}

export function trackAdvisoryNavDropdownOpened(source: "desktop" | "mobile"): void {
  trackEvent("Advisory:NavDropdownOpened", { source });
}

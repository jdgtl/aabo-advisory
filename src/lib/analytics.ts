/**
 * Plausible analytics helper functions.
 * Wraps the plausible() global with typed event names.
 */

type AnalyticsEvent =
  | "Calculator:Started"
  | "Calculator:GateShown"
  | "Calculator:LeadCaptured"
  | "Calculator:GateSkipped"
  | "Calculator:FullResultsViewed"
  | "Contact:ModalOpened"
  | "Contact:Submitted"
  | "Article:Opened"
  | "CTA:Clicked";

type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, props?: EventProps): void {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(event, props ? { props } : undefined);
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

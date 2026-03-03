/**
 * Type-safe JSON-LD structured data generators (schema.org)
 * Injected into <head> via Astro layouts for SEO and GEO.
 */

import { site } from "./constants";

const SITE_URL = site.url;
const ORG_NAME = site.name;

/* ── Shared fragments ── */

const organizationRef = {
  "@type": "Organization" as const,
  name: ORG_NAME,
  url: SITE_URL,
};

const areaServed = {
  "@type": "City" as const,
  name: "New York",
};

/* ── 1. Organization (global, every page) ── */

export function organizationJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    description:
      "Sovereign-grade real estate advisory for diplomatic missions in global capitals.",
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "New York",
      addressRegion: "NY",
      addressCountry: "US",
    },
    areaServed,
    knowsAbout: [
      "Diplomatic Real Estate",
      "Sovereign Housing Strategy",
      "Mission Housing Advisory",
    ],
  });
}

/* ── 2. WebSite (global, sitelinks search box) ── */

export function webSiteJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: SITE_URL,
  });
}

/* ── 3. ProfessionalService (homepage) ── */

export function professionalServiceJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: ORG_NAME,
    description:
      "Strategic housing, acquisition, and long-term stewardship for diplomatic missions.",
    serviceType: [
      "Real Estate Advisory",
      "Strategic Housing Advisory",
      "Transaction & Representation",
      "Operational Stewardship",
    ],
    areaServed,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Advisory Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Strategic Housing Advisory",
            description:
              "Rent vs. buy analysis, portfolio strategy, financial modeling & policy support",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Transaction & Representation",
            description:
              "Acquisition, disposals, leasing, negotiation and execution",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Operational Stewardship",
            description:
              "Post-closing oversight, vendor coordination, ongoing asset monitoring",
          },
        },
      ],
    },
  });
}

/* ── 4. Article (insight/dossier pages) ── */

export interface ArticleJsonLdInput {
  headline: string;
  description: string;
  datePublished: string;
  slug: string;
  articleSection: string;
  wordCount?: number;
  readTime?: string;
}

export function articleJsonLd(input: ArticleJsonLdInput) {
  const timeRequired = input.readTime
    ? `PT${parseInt(input.readTime, 10) || 12}M`
    : "PT12M";

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    author: organizationRef,
    publisher: organizationRef,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/insights/${input.slug}`,
    },
    articleSection: input.articleSection,
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    timeRequired,
  });
}

/* ── 5. BreadcrumbList ── */

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  });
}

/* ── 6. FAQPage ── */

export interface FAQItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(faqs: readonly FAQItem[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });
}

/* ── 7. WebApplication (calculator) ── */

export function webApplicationJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Diplomatic Housing Buy vs. Rent Calculator",
    description:
      "A multi-decade cost comparison tool for diplomatic missions evaluating whether to purchase or lease residential property in New York City.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  });
}

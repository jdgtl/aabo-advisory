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

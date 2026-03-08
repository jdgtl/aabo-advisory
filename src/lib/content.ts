import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";

export const reader = createReader(process.cwd(), keystaticConfig);

/** ~265 wpm average adult reading speed */
export function calcReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 265));
  return `${mins} min read`;
}

/** Format YYYY-MM-DD → "Month YYYY", pass through other formats */
export function formatDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m] = date.split("-");
    const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "long" });
    return `${month} ${y}`;
  }
  return date;
}

export async function getHomepage() {
  return await reader.singletons.homepage.read();
}

export async function getInsightsPage() {
  return await reader.singletons.insightsPage.read();
}

export async function getCalculatorPage() {
  return await reader.singletons.calculatorPage.read();
}

export async function getFooter() {
  return await reader.singletons.footer.read();
}

export async function getSiteSettings() {
  return await reader.singletons.siteSettings.read();
}

export async function getAllArticles() {
  const slugs = await reader.collections.articles.list();
  const articles = await Promise.all(
    slugs.map(async (slug) => {
      const article = await reader.collections.articles.read(slug);
      return article ? { slug, ...article } : null;
    })
  );
  return articles
    .filter(Boolean)
    .filter((a) => !a!.draft) as NonNullable<(typeof articles)[number]>[];
}

export async function getArticle(slug: string) {
  return await reader.collections.articles.read(slug);
}

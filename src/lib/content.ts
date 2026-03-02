import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";

export const reader = createReader(process.cwd(), keystaticConfig);

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
  return articles.filter(Boolean) as NonNullable<(typeof articles)[number]>[];
}

export async function getArticle(slug: string) {
  return await reader.collections.articles.read(slug);
}

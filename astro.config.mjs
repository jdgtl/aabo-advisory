import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import fs from "node:fs";
import path from "node:path";

// Build a map of article slug → date from frontmatter for sitemap lastmod
function getArticleDates() {
  const dir = path.resolve("src/content/articles");
  const dates = new Map();
  if (!fs.existsSync(dir)) return dates;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".mdoc")) continue;
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    const match = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    if (match) {
      const slug = file.replace(/\.mdoc$/, "");
      dates.set(slug, match[1]);
    }
  }
  return dates;
}

const articleDates = getArticleDates();

export default defineConfig({
  site: "https://aaboadvisory.com",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    react(),
    markdoc(),
    sitemap({
      serialize(item) {
        // Match insight article URLs to their content date
        const match = item.url.match(/\/insights\/([^/]+)\/?$/);
        if (match && articleDates.has(match[1])) {
          item.lastmod = new Date(articleDates.get(match[1])).toISOString();
          return item;
        }

        // Match newsletter URLs (daily, weekly, quarterly)
        const newsletterMatch = item.url.match(/\/newsletter\/(daily|weekly|quarterly)\/([^/]+)\/?$/);
        if (newsletterMatch) {
          item.lastmod = new Date().toISOString();
          return item;
        }

        // Static pages get the build date
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
    keystatic(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

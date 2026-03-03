import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.string(),
    excerpt: z.string(),
    date: z.string(),
    readTime: z.string().optional(),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = { articles };

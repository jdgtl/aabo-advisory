import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.string(),
    excerpt: z.string(),
    keyTakeaway: z.string().optional().default(""),
    date: z.coerce.string(),
    readTime: z.string().optional(),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = { articles };

import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional().default(true),
    featured: z.boolean().optional().default(false),
    category: z.string(),
    date: z.coerce.string(),
    excerpt: z.string(),
    keyTakeaway: z.string().optional().default(""),
    publicationUrl: z.string().optional(),
    publicationLabel: z.string().optional(),
    publicationLinkText: z.string().optional(),
  }),
});

export const collections = { articles };

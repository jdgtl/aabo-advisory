import tagsData from "../content/newsletter-tags.json";

export interface NewsletterTag {
  label: string;
  value: string;
}

export function getNewsletterTags(): NewsletterTag[] {
  return tagsData.tags;
}

/** For use in keystatic.config.ts multiselect fields */
export function getTagOptions(): { label: string; value: string }[] {
  return tagsData.tags.map((t) => ({ label: t.label, value: t.value }));
}

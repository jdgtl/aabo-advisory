import { config, fields, collection, singleton } from "@keystatic/core";
import { getTagOptions } from "./src/lib/newsletter-tags";

const tagOptions = getTagOptions();

const advisorySchema = {
  seo: fields.object(
    {
      title: fields.text({ label: "SEO Title" }),
      description: fields.text({ label: "SEO Description", multiline: true }),
    },
    { label: "SEO" },
  ),
  hero: fields.object(
    {
      numeral: fields.select({
        label: "Numeral",
        options: [
          { label: "I", value: "I" },
          { label: "II", value: "II" },
          { label: "III", value: "III" },
        ],
        defaultValue: "I",
      }),
      title: fields.text({ label: "Title" }),
      subtitle: fields.text({ label: "Subtitle" }),
      intro: fields.text({ label: "Intro Paragraph 1", multiline: true }),
      introSecondary: fields.text({ label: "Intro Paragraph 2", multiline: true }),
    },
    { label: "Hero" },
  ),
  services: fields.array(
    fields.object({
      headline: fields.text({ label: "Headline" }),
      body: fields.text({ label: "Body", multiline: true }),
    }),
    {
      label: "Service Boxes",
      itemLabel: (props) => props.fields.headline.value,
    },
  ),
  pullQuote: fields.object(
    {
      text: fields.text({ label: "Pull Quote Text", multiline: true }),
    },
    { label: "Pull Quote" },
  ),
  cta: fields.object(
    {
      headline: fields.text({ label: "CTA Headline" }),
      buttonText: fields.text({ label: "Button Text" }),
    },
    { label: "CTA" },
  ),
  crossLinks: fields.array(
    fields.object({
      label: fields.text({ label: "Label" }),
      href: fields.text({
        label: "Href",
        description:
          "Absolute path, e.g. /advisory/operational-stewardship or /insights/<slug>.",
      }),
    }),
    {
      label: "Cross Links",
      itemLabel: (props) => props.fields.label.value,
    },
  ),
};

const advisoryStrategicHousingSchema = {
  ...advisorySchema,
  counter: fields.array(
    fields.object({
      value: fields.text({
        label: "Value (numeric)",
        description: "The number to animate to — digits only, e.g. \"45\" or \"2.5\".",
      }),
      prefix: fields.text({
        label: "Prefix",
        description: "Optional text before the number, e.g. \"$\".",
      }),
      suffix: fields.text({
        label: "Suffix",
        description: "Optional text after the number, e.g. \"M\" or \"+\".",
      }),
      caption: fields.text({ label: "Caption", multiline: true }),
    }),
    {
      label: "Benchmark Counter",
      description: "0 items hides the section. 1 item renders as a hero number. 2–4 items render as a row of tiles.",
      itemLabel: (props) =>
        `${props.fields.prefix.value}${props.fields.value.value}${props.fields.suffix.value}`.trim() || "(empty)",
    },
  ),
};

const advisoryTransactionRepresentationSchema = {
  ...advisorySchema,
  timelineStages: fields.array(
    fields.object({
      name: fields.text({ label: "Stage Name" }),
      description: fields.text({
        label: "Description",
        description: "Shown in the popover on hover/tap. Blank = non-interactive label only.",
        multiline: true,
      }),
    }),
    {
      label: "Timeline Stages",
      description: "Five stages expected. If the array is empty, the component falls back to its hardcoded labels.",
      itemLabel: (props) => props.fields.name.value,
    },
  ),
  offMarket: fields.object(
    {
      enabled: fields.checkbox({ label: "Show Section", defaultValue: false }),
      percentage: fields.text({
        label: "Percentage (optional)",
        description: "Digits only, e.g. \"68\". If blank, the qualitative map variant renders instead of the stat.",
      }),
      caption: fields.text({
        label: "Caption",
        description: "Shown in both the stat variant and the map variant.",
        multiline: true,
      }),
    },
    { label: "Off-Market Access" },
  ),
};

const advisoryOperationalStewardshipSchema = {
  ...advisorySchema,
};

export default config({
  storage: {
    kind: "cloud",
  },
  cloud: {
    project: "sauce-creative/aabo-advisory",
  },

  collections: {
    articles: collection({
      label: "Articles",
      slugField: "title",
      path: "src/content/articles/*",
      format: { contentField: "body" },
      entryLayout: "content",
      previewUrl: "/insights/{slug}",
      columns: ["category", "date", "draft", "featured"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        draft: fields.checkbox({ label: "Draft", description: "Hidden from listings. Preview via /insights/{slug}", defaultValue: true }),
        featured: fields.checkbox({ label: "Featured", description: "Show on homepage grid.", defaultValue: false }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Insights", value: "Insights" },
            { label: "Industry News", value: "Industry News" },
            { label: "Market Updates", value: "Market Updates" },
          ],
          defaultValue: "Insights",
        }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        excerpt: fields.text({ label: "Excerpt", multiline: true }),
        keyTakeaway: fields.text({ label: "Key Takeaway", multiline: true }),
        publicationUrl: fields.url({
          label: "Publication URL",
          description: "Publitas flipbook URL — opens in a full-screen viewer.",
        }),
        publicationLabel: fields.text({
          label: "Publication Label",
          description: "Small uppercase text (e.g. 'Publication', 'Newsletter', 'Report').",
        }),
        publicationLinkText: fields.text({
          label: "Publication Link Text",
          description: "Button text (e.g. 'View Interactive Flipbook', 'Read The Diplomat Q1').",
        }),
        body: fields.markdoc({ label: "Body" }),
      },
    }),

    "weekly-summaries": collection({
      label: "Weekly Summaries",
      slugField: "title",
      path: "src/content/weekly-summaries/*",
      format: { contentField: "body" },
      entryLayout: "content",
      previewUrl: "/newsletter/weekly/{slug}",
      columns: ["date", "draft"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        draft: fields.checkbox({ label: "Draft", description: "Hidden from listings. Preview via /newsletter/weekly/{slug}", defaultValue: true }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        excerpt: fields.text({ label: "Excerpt", multiline: true }),
        tags: fields.multiselect({
          label: "Tags",
          options: tagOptions,
        }),
        body: fields.markdoc({ label: "Body" }),
      },
    }),

    "quarterly-reports": collection({
      label: "Quarterly Reports",
      slugField: "title",
      path: "src/content/quarterly-reports/*",
      format: { contentField: "body" },
      entryLayout: "content",
      previewUrl: "/newsletter/quarterly/{slug}",
      columns: ["quarter", "date", "draft"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        quarter: fields.text({ label: "Quarter", description: "e.g. Q1 2026" }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        excerpt: fields.text({ label: "Excerpt", multiline: true }),
        tags: fields.multiselect({
          label: "Tags",
          options: tagOptions,
        }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        body: fields.markdoc({ label: "Body" }),
      },
    }),
  },

  singletons: {
    homepage: singleton({
      label: "Homepage",
      path: "src/content/homepage",
      format: { data: "json" },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({ label: "Headline" }),
            subtext: fields.text({ label: "Subtext" }),
            description: fields.text({ label: "Description", multiline: true }),
            cta: fields.text({ label: "CTA Button Text" }),
          },
          { label: "Hero Section" },
        ),

        approach: fields.object(
          {
            headline: fields.text({ label: "Headline" }),
            label: fields.text({ label: "Section Label" }),
            cards: fields.array(
              fields.object({
                title: fields.text({ label: "Title" }),
                text: fields.text({ label: "Text", multiline: true }),
                keyword: fields.text({ label: "Keyword" }),
              }),
              {
                label: "Cards",
                itemLabel: (props) => props.fields.title.value,
              },
            ),
          },
          { label: "Approach Section" },
        ),

        services: fields.object(
          {
            headline: fields.text({ label: "Headline" }),
            subtext: fields.text({ label: "Subtext", multiline: true }),
            pillars: fields.array(
              fields.object({
                numeral: fields.text({ label: "Numeral" }),
                title: fields.text({ label: "Title" }),
                note: fields.text({ label: "Note" }),
                items: fields.array(fields.text({ label: "Item" }), {
                  label: "Items",
                  itemLabel: (props) => props.value,
                }),
              }),
              {
                label: "Service Pillars",
                itemLabel: (props) => props.fields.title.value,
              },
            ),
          },
          { label: "Services Section" },
        ),

        about: fields.object(
          {
            headline: fields.text({ label: "Headline" }),
            paragraphs: fields.array(
              fields.text({ label: "Paragraph", multiline: true }),
              { label: "Paragraphs", itemLabel: (props) => props.value.slice(0, 50) + "…" },
            ),
          },
          { label: "About Section" },
        ),

        cta: fields.object(
          {
            headline: fields.text({ label: "Headline" }),
            subtext: fields.text({ label: "Subtext", multiline: true }),
            buttonText: fields.text({ label: "Button Text" }),
          },
          { label: "CTA Banner" },
        ),

        faqs: fields.array(
          fields.object({
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          {
            label: "FAQs",
            itemLabel: (props) => props.fields.question.value,
          },
        ),
      },
    }),

    insightsPage: singleton({
      label: "Insights Page",
      path: "src/content/insights-page",
      format: { data: "json" },
      schema: {
        header: fields.object(
          {
            title: fields.text({ label: "Page Title" }),
            subtitle: fields.text({ label: "Page Subtitle" }),
            description: fields.text({ label: "Page Description", multiline: true }),
          },
          { label: "Page Header" },
        ),

        categories: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            slug: fields.text({ label: "Slug" }),
          }),
          {
            label: "Filter Categories",
            itemLabel: (props) => props.fields.label.value,
          },
        ),
      },
    }),

    calculatorPage: singleton({
      label: "Calculator Page",
      path: "src/content/calculator-page",
      format: { data: "json" },
      schema: {
        header: fields.object(
          {
            title: fields.text({ label: "Page Title" }),
            subtitle: fields.text({ label: "Page Subtitle" }),
            description: fields.text({ label: "Page Description", multiline: true }),
          },
          { label: "Page Header" },
        ),

        verdicts: fields.object(
          {
            buyText: fields.text({ label: "Buy Verdict Text", multiline: true }),
            rentText: fields.text({ label: "Rent Verdict Text", multiline: true }),
          },
          { label: "Verdict Messages" },
        ),

        gate: fields.object(
          {
            headline: fields.text({ label: "Headline" }),
            subtext: fields.text({ label: "Subtext" }),
            buttonText: fields.text({ label: "Button Text" }),
          },
          { label: "Lead Gate" },
        ),

        cta: fields.object(
          {
            label: fields.text({ label: "Section Label" }),
            headline: fields.text({ label: "Headline" }),
            description: fields.text({ label: "Description", multiline: true }),
            buttonText: fields.text({ label: "Button Text" }),
          },
          { label: "Consultation CTA" },
        ),

        disclaimerText: fields.text({
          label: "Disclaimer Text",
          multiline: true,
        }),

        faqs: fields.array(
          fields.object({
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          {
            label: "FAQs",
            itemLabel: (props) => props.fields.question.value,
          },
        ),
      },
    }),

    footer: singleton({
      label: "Footer",
      path: "src/content/footer",
      format: { data: "json" },
      schema: {
        tagline: fields.text({ label: "Tagline" }),
        motto: fields.text({ label: "Motto" }),
        toolLinks: fields.array(
          fields.object({
            label: fields.text({ label: "Text" }),
            href: fields.text({ label: "Link" }),
          }),
          {
            label: "Tools Links",
            itemLabel: (props) => props.fields.label.value,
          },
        ),
        navLinks: fields.array(
          fields.object({
            label: fields.text({ label: "Text" }),
            href: fields.text({ label: "Link" }),
          }),
          {
            label: "Navigate Links",
            itemLabel: (props) => props.fields.label.value,
          },
        ),
        connectLinks: fields.array(
          fields.object({
            label: fields.text({ label: "Text" }),
            href: fields.text({ label: "Link" }),
          }),
          {
            label: "Connect Links",
            itemLabel: (props) => props.fields.label.value,
          },
        ),
      },
    }),

    siteSettings: singleton({
      label: "Site Settings",
      path: "src/content/site-settings",
      format: { data: "json" },
      schema: {
        siteName: fields.text({ label: "Site Name" }),
        siteDescription: fields.text({
          label: "Site Description",
          multiline: true,
        }),
        contactEmail: fields.text({ label: "Contact Email" }),
        location: fields.text({ label: "Location" }),
      },
    }),

    newsletterPage: singleton({
      label: "Newsletter Page",
      path: "src/content/newsletter-page",
      format: { data: "json" },
      schema: {
        headline: fields.text({ label: "Headline" }),
        subtext: fields.text({ label: "Subtext" }),
        weeklyDescription: fields.text({ label: "Weekly Summary Description", multiline: true }),
        quarterlyDescription: fields.text({ label: "Quarterly Reports Description", multiline: true }),
      },
    }),

    newsletterTags: singleton({
      label: "Newsletter Tags",
      path: "src/content/newsletter-tags",
      format: { data: "json" },
      schema: {
        tags: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            value: fields.text({ label: "Value (slug)" }),
          }),
          {
            label: "Tags",
            itemLabel: (props) => props.fields.label.value,
          },
        ),
      },
    }),

    advisoryStrategicHousing: singleton({
      label: "Advisory — Strategic Housing",
      path: "src/content/advisory-strategic-housing",
      format: { data: "json" },
      schema: advisoryStrategicHousingSchema,
    }),

    advisoryTransactionRepresentation: singleton({
      label: "Advisory — Transaction & Representation",
      path: "src/content/advisory-transaction-representation",
      format: { data: "json" },
      schema: advisoryTransactionRepresentationSchema,
    }),

    advisoryOperationalStewardship: singleton({
      label: "Advisory — Operational Stewardship",
      path: "src/content/advisory-operational-stewardship",
      format: { data: "json" },
      schema: advisoryOperationalStewardshipSchema,
    }),
  },
});

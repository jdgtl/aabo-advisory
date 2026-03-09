import { config, fields, collection, singleton } from "@keystatic/core";

export default config({
  storage: {
    kind: "cloud",
    branchPrefix: "x-never/",
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
  },
});

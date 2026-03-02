import { config, fields, collection, singleton } from "@keystatic/core";

export default config({
  storage: { kind: "local" },

  collections: {
    articles: collection({
      label: "Articles",
      slugField: "title",
      path: "src/content/articles/*",
      format: { contentField: "body" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Strategic Whitepaper", value: "Strategic Whitepaper" },
            { label: "Field Guide", value: "Field Guide" },
            { label: "Quiet Insight", value: "Quiet Insight" },
            { label: "Calculator Guide", value: "Calculator Guide" },
          ],
          defaultValue: "Quiet Insight",
        }),
        excerpt: fields.text({ label: "Excerpt", multiline: true }),
        date: fields.text({ label: "Date" }),
        readTime: fields.text({ label: "Read Time" }),
        featured: fields.checkbox({ label: "Featured", defaultValue: false }),
        body: fields.markdoc({ label: "Body" }),
      },
    }),
  },

  singletons: {
    homepage: singleton({
      label: "Homepage",
      path: "src/content/homepage",
      schema: {
        heroHeadline: fields.text({ label: "Hero Headline" }),
        heroSubtext: fields.text({ label: "Hero Subtext" }),
        heroDescription: fields.text({
          label: "Hero Description",
          multiline: true,
        }),
        heroCTA: fields.text({ label: "Hero CTA Text" }),

        approachHeadline: fields.text({ label: "Approach Headline" }),
        approachSubtext: fields.text({ label: "Approach Subtext" }),
        approachCards: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            text: fields.text({ label: "Text", multiline: true }),
            keyword: fields.text({ label: "Keyword" }),
          }),
          {
            label: "Approach Cards",
            itemLabel: (props) => props.fields.title.value,
          },
        ),

        servicesHeadline: fields.text({ label: "Services Headline" }),
        servicesSubtext: fields.text({
          label: "Services Subtext",
          multiline: true,
        }),
        servicePillars: fields.array(
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

        aboutHeadline: fields.text({ label: "About Headline" }),
        aboutParagraphs: fields.array(
          fields.text({ label: "Paragraph", multiline: true }),
          { label: "About Paragraphs", itemLabel: (props) => props.value.slice(0, 50) + "…" },
        ),

        ctaHeadline: fields.text({ label: "CTA Headline" }),
        ctaSubtext: fields.text({ label: "CTA Subtext", multiline: true }),
        ctaButtonText: fields.text({ label: "CTA Button Text" }),
      },
    }),

    insightsPage: singleton({
      label: "Insights Page",
      path: "src/content/insights-page",
      schema: {
        pageTitle: fields.text({ label: "Page Title" }),
        pageSubtitle: fields.text({ label: "Page Subtitle" }),
        pageDescription: fields.text({
          label: "Page Description",
          multiline: true,
        }),
        categories: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            slug: fields.text({ label: "Slug" }),
          }),
          {
            label: "Categories",
            itemLabel: (props) => props.fields.label.value,
          },
        ),
      },
    }),

    calculatorPage: singleton({
      label: "Calculator Page",
      path: "src/content/calculator-page",
      schema: {
        pageTitle: fields.text({ label: "Page Title" }),
        pageSubtitle: fields.text({ label: "Page Subtitle" }),
        pageDescription: fields.text({
          label: "Page Description",
          multiline: true,
        }),
        verdictBuyText: fields.text({ label: "Verdict Buy Text" }),
        verdictRentText: fields.text({ label: "Verdict Rent Text" }),
        disclaimerText: fields.text({
          label: "Disclaimer Text",
          multiline: true,
        }),
        gateHeadline: fields.text({ label: "Gate Headline" }),
        gateSubtext: fields.text({ label: "Gate Subtext" }),
        gateButtonText: fields.text({ label: "Gate Button Text" }),
      },
    }),

    footer: singleton({
      label: "Footer",
      path: "src/content/footer",
      schema: {
        tagline: fields.text({ label: "Tagline" }),
        motto: fields.text({ label: "Motto" }),
      },
    }),

    siteSettings: singleton({
      label: "Site Settings",
      path: "src/content/site-settings",
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

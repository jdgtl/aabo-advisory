import { useState } from "react";
import { trackArticleOpened } from "@/lib/analytics";

interface Article {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  readTime: string;
}

interface Category {
  readonly label: string;
  readonly slug: string;
}

interface Props {
  articles: readonly Article[];
  categories: readonly Category[];
}

export default function InsightsFilter({ articles, categories }: Props) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all"
      ? articles
      : articles.filter(
          (a) => a.category.toLowerCase().replace(/\s+/g, "-") === active
        );

  return (
    <>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-10 lg:mb-14">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActive(cat.slug)}
            className={`px-4 py-2 text-[11px] tracking-[0.12em] uppercase font-medium border transition-all duration-300 cursor-pointer ${
              active === cat.slug
                ? "bg-primary text-canvas border-primary"
                : "bg-transparent text-text/60 border-mid hover:border-accent hover:text-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Article cards */}
      <div className="flex flex-col">
        {filtered.map((a) => (
          <a
            key={a.slug}
            href={`/insights/${a.slug}`}
            onClick={() => trackArticleOpened(a.title)}
            className="group grid grid-cols-1 md:grid-cols-[3px_1fr_auto] gap-4 md:gap-7 py-9 border-t border-mid no-underline items-center transition-all duration-300 hover:pl-3 hover:bg-light/50"
          >
            <div className="hidden md:block bg-accent self-stretch rounded-sm" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 border border-accent/30 text-[9px] tracking-[0.12em] uppercase text-accent font-semibold">
                  {a.category}
                </span>
                <span className="text-[11px] text-warm/50">{a.date}</span>
              </div>
              <h2 className="font-heading text-xl lg:text-[26px] font-bold text-primary leading-[1.25] mb-2">
                {a.title}
              </h2>
              <p className="text-sm leading-[1.65] text-text/55 max-w-[600px]">
                {a.excerpt}
              </p>
            </div>
            <div className="text-[11px] text-accent tracking-[0.1em] whitespace-nowrap font-medium">
              {a.readTime} →
            </div>
          </a>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-text/40 text-sm">
            No articles in this category yet.
          </div>
        )}
      </div>
    </>
  );
}

import { useState, useEffect } from "react";

interface NewsletterItem {
  slug: string;
  type: "daily" | "weekly" | "quarterly";
  title: string;
  date: string;
  dateFormatted: string;
  excerpt: string;
  tags: readonly string[];
  readTime: string;
  quarter?: string;
}

interface NewsletterTag {
  label: string;
  value: string;
}

interface Props {
  newsletters: NewsletterItem[];
  tags: NewsletterTag[];
}

const TYPE_FILTERS = [
  { slug: "all", label: "All" },
  { slug: "daily", label: "Daily Digest" },
  { slug: "weekly", label: "Weekly Summary" },
  { slug: "quarterly", label: "Quarterly Report" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  quarterly: "Quarterly",
};

const TYPE_PATHS: Record<string, string> = {
  daily: "daily",
  weekly: "weekly",
  quarterly: "quarterly",
};

export default function NewsletterArchive({ newsletters, tags }: Props) {
  const [activeType, setActiveType] = useState("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // On mount, check for ?token= and fetch preferences
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    fetch(`/api/newsletter-preferences?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tags && Array.isArray(data.tags)) {
          setActiveTags(data.tags);
        }
      })
      .catch(() => {});
  }, []);

  const toggleTag = (value: string) =>
    setActiveTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );

  const filtered = newsletters.filter((n) => {
    if (activeType !== "all" && n.type !== activeType) return false;
    if (activeTags.length > 0 && !activeTags.some((t) => n.tags.includes(t)))
      return false;
    return true;
  });

  const tagLabelMap = Object.fromEntries(tags.map((t) => [t.value, t.label]));

  return (
    <>
      {/* Section heading */}
      <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-3 font-semibold">
        Archive
      </div>
      <h2 className="font-heading text-[24px] sm:text-[28px] font-bold text-primary leading-[1.2] mb-6">
        Past Issues
      </h2>

      {/* Type filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.slug}
            onClick={() => setActiveType(f.slug)}
            className={`px-4 py-2 text-[11px] tracking-[0.12em] uppercase font-medium border transition-all duration-300 cursor-pointer ${
              activeType === f.slug
                ? "bg-primary text-canvas border-primary"
                : "bg-transparent text-text/60 border-mid hover:border-accent hover:text-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tag filter buttons */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 lg:mb-14">
          {tags.map((tag) => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.08em] font-medium border transition-all duration-300 cursor-pointer ${
                activeTags.includes(tag.value)
                  ? "bg-accent text-canvas border-accent"
                  : "bg-transparent text-text/40 border-mid hover:border-accent hover:text-accent"
              }`}
            >
              {tag.label}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              onClick={() => setActiveTags([])}
              className="px-3 py-1.5 text-[10px] tracking-[0.08em] font-medium border border-mid text-text/40 hover:text-accent hover:border-accent transition-all duration-300 cursor-pointer"
            >
              Clear Tags
            </button>
          )}
        </div>
      )}

      {/* Newsletter cards */}
      <div className="flex flex-col">
        {filtered.map((n) => (
          <a
            key={`${n.type}-${n.slug}`}
            href={`/newsletter/${TYPE_PATHS[n.type]}/${n.slug}`}
            className="group grid grid-cols-1 md:grid-cols-[3px_1fr_auto] gap-4 md:gap-7 py-9 border-t border-mid no-underline items-center transition-all duration-300 hover:pl-3 hover:bg-light/50"
          >
            <div className="hidden md:block bg-accent self-stretch rounded-sm" />
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="px-2 py-0.5 border border-accent/30 text-[9px] tracking-[0.12em] uppercase text-accent font-semibold">
                  {TYPE_LABELS[n.type]}
                </span>
                <span className="text-[11px] text-warm/50">
                  {n.dateFormatted}
                </span>
                {n.tags.length > 0 && (
                  <span className="text-[10px] text-text/30">
                    {n.tags
                      .map((t) => tagLabelMap[t] ?? t)
                      .slice(0, 3)
                      .join(" · ")}
                  </span>
                )}
              </div>
              <h3 className="font-heading text-xl lg:text-[26px] font-bold text-primary leading-[1.25] mb-2">
                {n.title}
              </h3>
              <p className="text-sm leading-[1.65] text-text/55 max-w-[600px]">
                {n.excerpt}
              </p>
            </div>
            <div className="text-[11px] text-accent tracking-[0.1em] whitespace-nowrap font-medium">
              {n.readTime} →
            </div>
          </a>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-text/40 text-sm">
            No newsletters match your filters.
          </div>
        )}
      </div>
    </>
  );
}

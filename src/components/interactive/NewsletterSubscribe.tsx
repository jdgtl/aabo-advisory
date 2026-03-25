import { useState, useCallback } from "react";
import TurnstileWidget from "./TurnstileWidget";

interface NewsletterTag {
  label: string;
  value: string;
}

interface Props {
  dailyDescription: string;
  weeklyDescription: string;
  quarterlyDescription: string;
  tags: NewsletterTag[];
}

const NEWSLETTER_TYPES = [
  { key: "daily", label: "Daily Digest" },
  { key: "weekly", label: "Weekly Summary" },
  { key: "quarterly", label: "Quarterly Report" },
] as const;

export default function NewsletterSubscribe({
  dailyDescription,
  weeklyDescription,
  quarterlyDescription,
  tags,
}: Props) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [types, setTypes] = useState<Record<string, boolean>>({
    daily: true,
    weekly: false,
    quarterly: false,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);

  const descriptions: Record<string, string> = {
    daily: dailyDescription,
    weekly: weeklyDescription,
    quarterly: quarterlyDescription,
  };

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const toggleType = (key: string) =>
    setTypes((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleTag = (value: string) =>
    setSelectedTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const chosenTypes = Object.entries(types)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (chosenTypes.length === 0) {
      setError("Please select at least one newsletter type.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          types: chosenTypes,
          tags: selectedTags,
          turnstile_token: turnstileToken,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-light border border-mid p-10 text-center">
        <div
          className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center mx-auto mb-4 text-xl text-accent"
          aria-hidden="true"
        >
          ✓
        </div>
        <h3 className="font-heading text-[18px] font-bold text-primary mb-2">
          You're Subscribed
        </h3>
        <p className="text-sm text-text/55">
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-light border border-mid p-8 sm:p-10">
      <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
        Stay Informed
      </div>
      <h2 className="font-heading text-[24px] sm:text-[28px] font-bold text-primary leading-[1.2] mb-2">
        Subscribe to Our Newsletter
      </h2>
      <p className="text-sm leading-[1.65] text-text/55 mb-8 max-w-[520px]">
        Select the newsletters and topics that matter most to you.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label
              htmlFor="nl-name"
              className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium"
            >
              Name
            </label>
            <input
              id="nl-name"
              value={form.name}
              onChange={set("name")}
              placeholder="Full name"
              required
              className="w-full p-3.5 text-sm font-body bg-canvas border border-mid text-text outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="nl-email"
              className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium"
            >
              Email
            </label>
            <input
              id="nl-email"
              value={form.email}
              onChange={set("email")}
              type="email"
              placeholder="your@email.com"
              required
              className="w-full p-3.5 text-sm font-body bg-canvas border border-mid text-text outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {/* Newsletter type checkboxes */}
        <div className="mb-6">
          <div className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-3 font-medium">
            Newsletter Types
          </div>
          <div className="flex flex-col gap-3">
            {NEWSLETTER_TYPES.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={types[key]}
                  onChange={() => toggleType(key)}
                  className="mt-0.5 accent-accent w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors">
                    {label}
                  </span>
                  {descriptions[key] && (
                    <p className="text-xs text-text/45 leading-relaxed mt-0.5">
                      {descriptions[key]}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Interest tags */}
        {tags.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-3 font-medium">
              Topics of Interest
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1.5 text-[11px] tracking-[0.08em] font-medium border transition-all duration-300 cursor-pointer ${
                    selectedTags.includes(tag.value)
                      ? "bg-primary text-canvas border-primary"
                      : "bg-transparent text-text/60 border-mid hover:border-accent hover:text-accent"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <TurnstileWidget onToken={onTurnstileToken} />

        {error && (
          <p className="text-xs text-red mb-3" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-canvas border-none py-4 px-10 text-xs tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-accent hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
    </div>
  );
}

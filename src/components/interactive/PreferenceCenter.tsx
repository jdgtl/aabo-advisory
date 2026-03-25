import { useState, useEffect } from "react";

interface NewsletterTag {
  label: string;
  value: string;
}

interface PreferencesData {
  email: string;
  lists: { daily: boolean; weekly: boolean; quarterly: boolean };
  interests: string[];
  availableTags: NewsletterTag[];
}

const NEWSLETTER_TYPES = [
  { key: "daily", label: "Daily Digest" },
  { key: "weekly", label: "Weekly Summary" },
  { key: "quarterly", label: "Quarterly Report" },
] as const;

export default function PreferenceCenter() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [data, setData] = useState<PreferencesData | null>(null);

  // Local editable state
  const [lists, setLists] = useState<Record<string, boolean>>({
    daily: false,
    weekly: false,
    quarterly: false,
  });
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);

    if (!t) {
      setLoading(false);
      return;
    }

    fetch(`/api/newsletter-preferences?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || "Failed to load preferences.");
        }
        return res.json() as Promise<PreferencesData>;
      })
      .then((json) => {
        setData(json);
        setLists({
          daily: json.lists.daily ?? false,
          weekly: json.lists.weekly ?? false,
          quarterly: json.lists.quarterly ?? false,
        });
        setInterests(json.interests ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleList = (key: string) =>
    setLists((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleInterest = (value: string) =>
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/newsletter-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lists, interests }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to save preferences.");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!token) return;
    if (
      !window.confirm(
        "Are you sure you want to unsubscribe from all newsletters?",
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          lists: { daily: false, weekly: false, quarterly: false },
          interests: [],
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to unsubscribe.");
      }
      setUnsubscribed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // No token
  if (!loading && !token) {
    return (
      <div className="bg-light border border-mid p-10 text-center">
        <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-6 font-semibold">
          Newsletter Preferences
        </div>
        <p className="text-sm text-text/60 leading-relaxed">
          No subscription token found. Use the link from your email.
        </p>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="bg-light border border-mid p-10 text-center">
        <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-6 font-semibold">
          Newsletter Preferences
        </div>
        <p className="text-sm text-text/45">Loading your preferences…</p>
      </div>
    );
  }

  // Fatal fetch error
  if (error && !data) {
    return (
      <div className="bg-light border border-mid p-10 text-center">
        <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-6 font-semibold">
          Newsletter Preferences
        </div>
        <p className="text-sm text-red leading-relaxed" role="alert">
          {error}
        </p>
      </div>
    );
  }

  // Unsubscribed confirmation
  if (unsubscribed) {
    return (
      <div className="bg-light border border-mid p-10 text-center">
        <div
          className="w-12 h-12 rounded-full border-2 border-mid flex items-center justify-center mx-auto mb-4 text-xl text-text/50"
          aria-hidden="true"
        >
          ✓
        </div>
        <h3 className="font-heading text-[18px] font-bold text-primary mb-2">
          Unsubscribed
        </h3>
        <p className="text-sm text-text/55">
          You have been unsubscribed from all newsletters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-light border border-mid p-8 sm:p-10">
      <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
        Newsletter Preferences
      </div>
      <h1 className="font-heading text-[24px] sm:text-[28px] font-bold text-primary leading-[1.2] mb-2">
        Manage Your Subscriptions
      </h1>
      {data?.email && (
        <p className="text-sm text-text/55 mb-8">
          Preferences for{" "}
          <span className="text-primary font-medium">{data.email}</span>
        </p>
      )}

      {/* Newsletter types */}
      <div className="mb-6">
        <div className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-3 font-medium">
          Newsletter Types
        </div>
        <div className="flex flex-col gap-3">
          {NEWSLETTER_TYPES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={lists[key] ?? false}
                onChange={() => toggleList(key)}
                className="accent-accent w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Interest tags */}
      {data?.availableTags && data.availableTags.length > 0 && (
        <div className="mb-8">
          <div className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-3 font-medium">
            Topics of Interest
          </div>
          <div className="flex flex-wrap gap-2">
            {data.availableTags.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleInterest(tag.value)}
                className={`px-3 py-1.5 text-[11px] tracking-[0.08em] font-medium border transition-all duration-300 cursor-pointer ${
                  interests.includes(tag.value)
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

      {/* Save error */}
      {error && data && (
        <p className="text-xs text-red mb-4" role="alert">
          {error}
        </p>
      )}

      {/* Success message */}
      {success && (
        <p className="text-xs text-accent mb-4" role="status">
          Preferences saved successfully.
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-canvas border-none py-4 px-10 text-xs tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-accent hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </button>
        <button
          type="button"
          onClick={handleUnsubscribeAll}
          disabled={saving}
          className="bg-transparent text-red border border-red py-4 px-8 text-xs tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-red hover:text-canvas disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Unsubscribe from All
        </button>
      </div>
    </div>
  );
}

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

const TYPE_TO_COLLECTION: Record<string, string> = {
  daily: "daily-digests",
  weekly: "weekly-summaries",
  quarterly: "quarterly-reports",
};

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily Digest",
  weekly: "Weekly Summary",
  quarterly: "Quarterly Reports",
};

interface ItemState {
  sending: boolean;
  sent: boolean;
  sentAt: string | null;
  error: string | null;
}

export default function AdminPanel({ newsletters }: { newsletters: NewsletterItem[] }) {
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [loading, setLoading] = useState(true);

  function kvKey(item: NewsletterItem) {
    return `newsletter-sent:${TYPE_TO_COLLECTION[item.type]}:${item.slug}`;
  }

  useEffect(() => {
    async function fetchStatuses() {
      const keys = newsletters.map(kvKey);
      try {
        const res = await fetch("/api/newsletter-sent-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys }),
        });
        const statuses = (await res.json()) as Record<string, string | null>;

        const states: Record<string, ItemState> = {};
        for (const item of newsletters) {
          const key = kvKey(item);
          states[key] = {
            sending: false,
            sent: !!statuses[key],
            sentAt: statuses[key] ?? null,
            error: null,
          };
        }
        setItemStates(states);
      } catch {
        // If status fetch fails, assume all unsent
        const states: Record<string, ItemState> = {};
        for (const item of newsletters) {
          states[kvKey(item)] = { sending: false, sent: false, sentAt: null, error: null };
        }
        setItemStates(states);
      }
      setLoading(false);
    }
    fetchStatuses();
  }, [newsletters]);

  async function handleSend(item: NewsletterItem) {
    const confirmed = window.confirm(`Send "${item.title}" to all subscribers?`);
    if (!confirmed) return;

    const key = kvKey(item);
    const collection = TYPE_TO_COLLECTION[item.type];

    setItemStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], sending: true, error: null },
    }));

    try {
      const res = await fetch("/api/newsletter-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, slug: item.slug, title: item.title }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (data.success) {
        setItemStates((prev) => ({
          ...prev,
          [key]: { sending: false, sent: true, sentAt: new Date().toISOString(), error: null },
        }));
      } else {
        setItemStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], sending: false, error: data.error ?? "Send failed" },
        }));
      }
    } catch {
      setItemStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], sending: false, error: "Network error" },
      }));
    }
  }

  const grouped = (["daily", "weekly", "quarterly"] as const).map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: newsletters.filter((n) => n.type === type).sort((a, b) => b.date.localeCompare(a.date)),
  }));

  if (loading) {
    return (
      <div className="text-secondary py-12 text-center">Loading newsletters...</div>
    );
  }

  return (
    <div className="space-y-10">
      {grouped.map(({ type, label, items }) => (
        <section key={type}>
          <h2 className="font-heading text-[22px] font-bold text-primary mb-4">{label}</h2>
          {items.length === 0 ? (
            <p className="text-secondary text-sm">No {label.toLowerCase()} entries yet.</p>
          ) : (
            <div className="border border-mid rounded-lg overflow-hidden">
              {items.map((item, i) => {
                const key = kvKey(item);
                const state = itemStates[key] ?? { sending: false, sent: false, sentAt: null, error: null };

                return (
                  <div
                    key={item.slug}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 ${
                      i > 0 ? "border-t border-mid" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-primary text-[15px] truncate">{item.title}</div>
                      <div className="text-secondary text-sm mt-0.5">{item.dateFormatted}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {state.sent ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                          Ready to send
                        </span>
                      )}

                      {!state.sent && (
                        <button
                          onClick={() => handleSend(item)}
                          disabled={state.sending}
                          className="text-sm font-medium px-4 py-1.5 bg-accent text-primary hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {state.sending ? "Sending..." : "Send"}
                        </button>
                      )}

                      {state.error && (
                        <span className="text-sm text-red-600">{state.error}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  /** CMS content for the gate headline/subtext */
  cms?: {
    gateHeadline?: string;
    gateSubtext?: string;
    gateButtonText?: string;
  };
}

export default function LeadGate({ onClose, onSuccess, cms }: Props) {
  const [form, setForm] = useState({ name: "", org: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/calculator-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-primary/80 backdrop-blur-[12px] flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas w-full max-w-[480px] max-h-[90vh] overflow-y-auto relative"
      >
        <div className="pt-9 px-8 sm:px-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
                Full Analysis
              </div>
              <h2 className="font-heading text-2xl font-bold text-primary leading-[1.2]">
                {cms?.gateHeadline ?? "Access the Full Analysis"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer text-[22px] text-text/30 px-2 py-1 leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm leading-relaxed text-text/55 mt-3">
            {cms?.gateSubtext ?? "Enter your details to unlock the complete rent vs. buy comparison with detailed projections."}
          </p>
        </div>

        <div className="pt-7 pb-10 px-8 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                Name
              </label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Full name"
                className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                Organization
              </label>
              <input
                value={form.org}
                onChange={set("org")}
                placeholder="Mission or entity"
                className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>
          <div className="mb-7">
            <label className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
              Email
            </label>
            <input
              value={form.email}
              onChange={set("email")}
              type="email"
              placeholder="your@email.com"
              className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
            />
          </div>
          {error && (
            <p className="text-xs text-red mb-3">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-canvas border-none py-4 px-8 text-xs tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-accent hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Unlocking…" : (cms?.gateButtonText ?? "Unlock Calculator")}
          </button>
        </div>
      </div>
    </div>
  );
}

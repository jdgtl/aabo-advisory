import { useState, useCallback, useEffect, useRef } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { trackContactSubmitted } from "@/lib/analytics";

interface Props {
  onClose: () => void;
}

export default function ContactModal({ onClose }: Props) {
  const [form, setForm] = useState({ name: "", org: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);
  const dialogRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  /* Focus trapping + restore focus on close */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first input on open
    const firstInput = dialog.querySelector<HTMLElement>("input, button");
    firstInput?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstile_token: turnstileToken }),
      });
      if (!res.ok) throw new Error("Submission failed");
      trackContactSubmitted();
      setSubmitted(true);
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
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a consultation"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas w-full max-w-[520px] max-h-[90vh] overflow-y-auto relative"
      >
        <div className="pt-9 px-8 sm:px-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
                Contact
              </div>
              <h2 className="font-heading text-[28px] font-bold text-primary leading-[1.2]">
                Schedule a Consultation
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="bg-transparent border-none cursor-pointer text-[22px] text-text/30 px-2 py-1 leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm leading-relaxed text-text/55 mt-3">
            We respond within one business day.
          </p>
        </div>

        {!submitted ? (
          <div className="pt-7 pb-10 px-8 sm:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="contact-name" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                  Name
                </label>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Full name"
                  required
                  className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="contact-org" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                  Organization
                </label>
                <input
                  id="contact-org"
                  value={form.org}
                  onChange={set("org")}
                  placeholder=""
                  className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="contact-email" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                Email
              </label>
              <input
                id="contact-email"
                value={form.email}
                onChange={set("email")}
                type="email"
                placeholder="your@email.com"
                required
                className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
              />
            </div>
            <div className="mb-7">
              <label htmlFor="contact-message" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                Message
              </label>
              <textarea
                id="contact-message"
                value={form.message}
                onChange={set("message")}
                rows={4}
                placeholder="Brief description of your inquiry"
                className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent resize-y min-h-[100px]"
              />
            </div>
            <TurnstileWidget onToken={onTurnstileToken} />
            {error && (
              <p className="text-xs text-red mb-3" role="alert">{error}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary text-canvas border-none py-4 px-8 text-xs tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-accent hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Submit Inquiry"}
            </button>
          </div>
        ) : (
          <div className="py-12 px-10 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center mx-auto mb-5 text-xl text-accent" aria-hidden="true">
              ✓
            </div>
            <h3 className="font-heading text-[22px] font-bold text-primary mb-2.5">Thank You</h3>
            <p className="text-sm leading-relaxed text-text/60 mb-7">
              We have received your inquiry and will respond within one business day.
            </p>
            <button
              onClick={onClose}
              className="bg-transparent text-primary border-[1.5px] border-primary py-3 px-8 text-[11px] tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-primary hover:text-canvas"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { trackLeadCaptured, trackGateShown } from "@/lib/analytics";

export interface CalculatorData {
  // Summary
  priceRange: string;
  units: number;
  timeline: number;
  verdict: string;
  savings: string;
  // Full inputs
  pricePerUnit: number;
  commonCharges: number;
  propertyTaxes: number;
  propType: string;
  monthlyRent: number;
  otherCharges: number;
  rentTaxes: number;
  annualAppreciation: number;
  annualRentGrowth: number;
}

interface Props {
  onClose: () => void;
  onSuccess: (info: { name: string; email: string; org: string }) => void;
  cms?: {
    gateHeadline?: string;
    gateSubtext?: string;
    gateButtonText?: string;
  };
  calculatorData?: CalculatorData;
}

export default function LeadGate({ onClose, onSuccess, cms, calculatorData }: Props) {
  const [form, setForm] = useState({ name: "", org: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackGateShown();
  }, []);

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
    const firstInput = dialog.querySelector<HTMLElement>("input, button");
    firstInput?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

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
      // Generate PDF + email HTML in parallel (if calculator data available)
      let pdfBase64: string | undefined;
      let emailHtml: string | undefined;

      if (calculatorData) {
        try {
          const [{ runCalculation }, { generatePdfBase64 }, { buildEmailHtml }] = await Promise.all([
            import("@/components/calculator/engine"),
            import("@/components/calculator/pdf/generatePdf"),
            import("@/components/calculator/pdf/emailTemplate"),
          ]);

          const result = runCalculation({
            units: calculatorData.units,
            pricePerUnit: calculatorData.pricePerUnit,
            commonCharges: calculatorData.commonCharges,
            propertyTaxes: calculatorData.propertyTaxes,
            propType: calculatorData.propType,
            monthlyRent: calculatorData.monthlyRent,
            otherCharges: calculatorData.otherCharges,
            rentTaxes: calculatorData.rentTaxes,
            timelineYears: calculatorData.timeline,
            appreciation: calculatorData.annualAppreciation / 100,
            rentGrowth: calculatorData.annualRentGrowth / 100,
          });

          const pdfInputs = {
            ...calculatorData,
            timelineYears: calculatorData.timeline,
            result,
            userName: form.name,
            userOrg: form.org || undefined,
          };

          const [pdf, html] = await Promise.all([
            generatePdfBase64(pdfInputs),
            Promise.resolve(buildEmailHtml({
              units: calculatorData.units,
              pricePerUnit: calculatorData.pricePerUnit,
              timelineYears: calculatorData.timeline,
              annualAppreciation: calculatorData.annualAppreciation,
              annualRentGrowth: calculatorData.annualRentGrowth,
              monthlyRent: calculatorData.monthlyRent,
              result,
              userName: form.name,
              userOrg: form.org || undefined,
            })),
          ]);

          pdfBase64 = pdf;
          emailHtml = html;
        } catch {
          // PDF generation failed — still submit lead
        }
      }

      const res = await fetch("/api/calculator-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          turnstile_token: turnstileToken,
          calculatorData,
          repeat: (() => { try { return localStorage.getItem("aabo_calculator_submitted") === "1"; } catch { return false; } })(),
          pdfBase64,
          emailHtml,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      try { localStorage.setItem("aabo_calculator_submitted", "1"); } catch {}
      trackLeadCaptured();
      onSuccess({ name: form.name, email: form.email, org: form.org });
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
      aria-label="Unlock full analysis"
    >
      <div
        ref={dialogRef}
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
                {cms?.gateHeadline ?? "Your Detailed Analysis"}
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
            {cms?.gateSubtext ?? "Provide your details to receive the complete analysis with year-by-year projections and a downloadable report."}
          </p>
        </div>

        <div className="pt-7 pb-10 px-8 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="gate-name" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                Name
              </label>
              <input
                id="gate-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Full name"
                required
                className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="gate-org" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
                Organization
              </label>
              <input
                id="gate-org"
                value={form.org}
                onChange={set("org")}
                placeholder=""
                className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>
          <div className="mb-7">
            <label htmlFor="gate-email" className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium">
              Email
            </label>
            <input
              id="gate-email"
              value={form.email}
              onChange={set("email")}
              type="email"
              placeholder="youremail@email.com"
              required
              className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent"
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
            {loading ? "Preparing your analysis…" : (cms?.gateButtonText ?? "Continue")}
          </button>
        </div>
      </div>
    </div>
  );
}

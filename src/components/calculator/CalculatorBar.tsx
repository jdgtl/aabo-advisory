import { useState, useEffect, useRef, useCallback } from "react";
import { getCalculatorState, getUserEmail, onUserEmailChange } from "./calculatorState";
import { trackPDFDownloaded, trackResultsEmailed } from "@/lib/analytics";

export default function CalculatorBar() {
  const [userEmail, setUserEmail] = useState<string | undefined>(() => getUserEmail());
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");
  const [emailState, setEmailState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Subscribe to userEmail changes from CalculatorIsland
  useEffect(() => onUserEmailChange(setUserEmail), []);

  // Stick below nav via ResizeObserver — target the sticky wrapper, not inner nav
  useEffect(() => {
    const navInner = document.querySelector<HTMLElement>("[data-nav]");
    const stickyWrapper = navInner?.closest<HTMLElement>(".sticky");
    const bar = barRef.current;
    if (!stickyWrapper || !bar) return;

    const sync = () => {
      bar.style.top = `${stickyWrapper.getBoundingClientRect().height}px`;
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(stickyWrapper);
    return () => ro.disconnect();
  }, []);

  async function handlePrint() {
    const inputs = getCalculatorState();
    if (!inputs) return;
    const { printReport } = await import("./pdf/generatePdf");
    printReport(inputs);
  }

  async function handleDownload() {
    if (downloadState === "loading") return;
    const inputs = getCalculatorState();
    if (!inputs) return;
    setDownloadState("loading");
    try {
      const { downloadPdf } = await import("./pdf/generatePdf");
      await downloadPdf(inputs);
      trackPDFDownloaded();
      setDownloadState("done");
      setTimeout(() => setDownloadState("idle"), 2000);
    } catch {
      setDownloadState("idle");
    }
  }

  async function handleEmail() {
    if (emailState === "loading" || !userEmail) return;
    const inputs = getCalculatorState();
    if (!inputs) return;
    setEmailState("loading");
    try {
      const [{ generatePdfBase64 }, { buildEmailHtml }] = await Promise.all([
        import("./pdf/generatePdf"),
        import("./pdf/emailTemplate"),
      ]);

      const [pdfBase64, emailHtml] = await Promise.all([
        generatePdfBase64(inputs),
        Promise.resolve(buildEmailHtml({
          units: inputs.units,
          pricePerUnit: inputs.pricePerUnit,
          timelineYears: inputs.timelineYears,
          annualAppreciation: inputs.annualAppreciation,
          annualRentGrowth: inputs.annualRentGrowth,
          monthlyRent: inputs.monthlyRent,
          result: inputs.result,
          userName: inputs.userName ?? "",
          userOrg: inputs.userOrg,
        })),
      ]);

      const res = await fetch("/api/calculator-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inputs.userName ?? "",
          email: userEmail,
          action: "resend-email",
          pdfBase64,
          emailHtml,
          turnstile_token: "",
        }),
      });

      if (!res.ok) throw new Error("Send failed");
      trackResultsEmailed();
      setEmailState("sent");
      setTimeout(() => setEmailState("idle"), 3000);
    } catch {
      setEmailState("error");
      setTimeout(() => setEmailState("idle"), 3000);
    }
  }

  const actionClass =
    "text-[10px] text-canvas/70 hover:text-accent transition-colors cursor-pointer tracking-[0.05em] uppercase bg-transparent border-0 p-0";

  return (
    <>
      <div
        ref={barRef}
        className="sticky z-30 bg-primary border-b border-accent/[0.15] px-6 sm:px-10 md:px-16 lg:px-20 print-hide will-change-[top]"
        style={{
          top: 0,
          boxShadow: "inset 0 3px 6px -3px rgba(0,0,0,0.15), inset 0 -2px 4px -3px rgba(0,0,0,0.08)",
        }}
      >
        <div className="max-w-[1100px] mx-auto flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-4">
            <span className="font-heading text-base font-bold text-canvas tracking-[0.08em]">AABO</span>
            <div className="w-px h-5 bg-accent/40" />
            <span className="text-[10px] tracking-[0.18em] uppercase text-accent font-medium">Portfolio Calculator</span>
          </div>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-4">
            {userEmail ? (
              <button onClick={handleEmail} disabled={emailState === "loading"} className={actionClass}>
                {emailState === "loading" ? "Sending\u2026" : emailState === "sent" ? "Sent" : emailState === "error" ? "Failed" : "Email"}
              </button>
            ) : (
              <button onClick={() => setShowEmailModal(true)} className={actionClass}>
                Email
              </button>
            )}
            <div className="w-px h-4 bg-accent/25" />
            <button onClick={handlePrint} className={actionClass}>
              Print
            </button>
            <div className="w-px h-4 bg-accent/25" />
            <button onClick={handleDownload} disabled={downloadState === "loading"} className={actionClass}>
              {downloadState === "loading" ? "Generating\u2026" : downloadState === "done" ? "Downloaded" : "Download"}
            </button>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <EmailModal onClose={() => setShowEmailModal(false)} />
      )}
    </>
  );
}

/* ── Email Modal (mailto fallback when no userEmail) ── */

function EmailModal({ onClose }: { onClose: () => void }) {
  const [emails, setEmails] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSend = useCallback(() => {
    const list = emails
      .split(/[,;\n]+/)
      .map((e) => e.trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (list.length === 0) {
      setError("Please enter at least one valid email address.");
      return;
    }

    const subject = encodeURIComponent("Portfolio Calculator — Aabo Advisory");
    const body = encodeURIComponent(
      `I thought you might find this useful:\n\nPortfolio Calculator\nhttps://aaboadvisory.com/calculator`
    );
    const to = list.join(",");

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(onClose, 1500);
  }, [emails, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-primary/80 backdrop-blur-[12px] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Email calculator"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas w-full max-w-[440px] relative"
      >
        <div className="pt-8 px-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
                Share
              </div>
              <h2 className="font-heading text-[22px] font-bold text-primary leading-[1.2]">
                Send via Email
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
          <p className="text-sm text-text/55 mt-2 leading-relaxed">
            Enter one or more email addresses, separated by commas.
          </p>
        </div>

        {!sent ? (
          <div className="pt-5 pb-8 px-8">
            <label
              htmlFor="calc-email-recipients"
              className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium"
            >
              Recipients
            </label>
            <textarea
              id="calc-email-recipients"
              ref={inputRef}
              value={emails}
              onChange={(e) => {
                setEmails(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder="name@example.com, colleague@example.com"
              className="w-full p-3.5 text-sm font-body bg-light border border-mid text-text outline-none transition-colors focus:border-accent resize-y min-h-[80px] placeholder:text-text/25"
            />
            {error && (
              <p className="text-xs text-red mt-1.5 mb-0" role="alert">{error}</p>
            )}
            <button
              onClick={handleSend}
              className="w-full mt-4 bg-primary text-canvas border-none py-3.5 px-8 text-xs tracking-[0.14em] uppercase cursor-pointer font-body font-medium transition-all duration-300 hover:bg-accent hover:text-primary"
            >
              Open Email Client
            </button>
          </div>
        ) : (
          <div className="py-10 px-8 text-center">
            <div className="text-accent text-2xl mb-2">✓</div>
            <p className="text-sm text-text/60">Opening your email client…</p>
          </div>
        )}
      </div>
    </div>
  );
}

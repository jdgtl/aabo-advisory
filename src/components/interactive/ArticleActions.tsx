import { useState, useCallback, useEffect, useRef } from "react";

interface Props {
  title: string;
  slug: string;
}

export default function ArticleActions({ title, slug }: Props) {
  const [generating, setGenerating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    if (generating) return;
    setGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.getElementById("main-content");
      if (!el) return;

      // Clone to avoid html2pdf's overlay issue
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      try {
        await html2pdf()
          .set({
            margin: [10, 10, 10, 10],
            filename: `${title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`,
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(clone)
          .save();
      } finally {
        document.body.removeChild(clone);
      }
    } finally {
      setGenerating(false);
    }
  }

  const linkClass =
    "text-[11px] tracking-[0.08em] uppercase font-medium text-text/45 hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0";

  return (
    <>
      <div className="flex items-center justify-between print-hide">
        <button onClick={() => setShowEmailModal(true)} className={linkClass}>
          Email
        </button>
        <button onClick={handlePrint} className={linkClass}>
          Print
        </button>
        <button onClick={handleDownload} disabled={generating} className={linkClass}>
          {generating ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {showEmailModal && (
        <EmailModal
          title={title}
          slug={slug}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}

/* ── Email Modal ── */

interface EmailModalProps {
  title: string;
  slug: string;
  onClose: () => void;
}

function EmailModal({ title, slug, onClose }: EmailModalProps) {
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

    const url = `https://aaboadvisory.com/insights/${slug}`;
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `I thought you might find this article interesting:\n\n${title}\n${url}`
    );
    const to = list.join(",");

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(onClose, 1500);
  }, [emails, title, slug, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-primary/80 backdrop-blur-[12px] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Email article"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas w-full max-w-[440px] relative"
      >
        <div className="pt-8 px-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
                Share Article
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
              htmlFor="email-recipients"
              className="text-[11px] tracking-[0.1em] uppercase text-text/50 mb-1.5 block font-medium"
            >
              Recipients
            </label>
            <textarea
              id="email-recipients"
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

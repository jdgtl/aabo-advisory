import { useState } from "react";

interface Props {
  title: string;
}

export default function ArticleActions({ title }: Props) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    const shareData = { title, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.getElementById("main-content");
      if (!el) return;

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();
    } finally {
      setGenerating(false);
    }
  }

  const btnClass =
    "flex items-center gap-2.5 w-full px-4 py-3 text-[11px] tracking-[0.1em] uppercase font-medium text-warm/70 hover:text-accent transition-colors cursor-pointer bg-transparent border-0";

  return (
    <div className="flex flex-col divide-y divide-canvas/[0.08]">
      <button onClick={handleShare} className={btnClass}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copied ? "Copied!" : "Share"}
      </button>

      <button onClick={handlePrint} className={btnClass}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print
      </button>

      <button onClick={handleDownload} disabled={generating} className={btnClass}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {generating ? "Generating…" : "Download PDF"}
      </button>
    </div>
  );
}

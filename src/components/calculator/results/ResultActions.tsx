import { useState } from "react";
import type { PdfInputs } from "../pdf/generatePdf";
import { trackPDFDownloaded, trackResultsEmailed } from "@/lib/analytics";

interface Props {
  inputs: PdfInputs;
  userEmail?: string;
}

export default function ResultActions({ inputs, userEmail }: Props) {
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");
  const [emailState, setEmailState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleDownload() {
    if (downloadState === "loading") return;
    setDownloadState("loading");
    try {
      const { downloadPdf } = await import("../pdf/generatePdf");
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
    setEmailState("loading");
    try {
      const [{ generatePdfBase64 }, { buildEmailHtml }] = await Promise.all([
        import("../pdf/generatePdf"),
        import("../pdf/emailTemplate"),
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

  const linkClass =
    "text-[11px] tracking-[0.08em] uppercase font-medium text-text/45 hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-6 mb-10">
      {userEmail && (
        <button onClick={handleEmail} disabled={emailState === "loading"} className={linkClass}>
          {emailState === "loading" ? "Sending\u2026" : emailState === "sent" ? "Sent" : emailState === "error" ? "Failed \u2014 Try Again" : "Email"}
        </button>
      )}
      <button onClick={() => window.print()} className={linkClass}>
        Print
      </button>
      <button onClick={handleDownload} disabled={downloadState === "loading"} className={linkClass}>
        {downloadState === "loading" ? "Generating\u2026" : downloadState === "done" ? "Downloaded" : "Download"}
      </button>
    </div>
  );
}

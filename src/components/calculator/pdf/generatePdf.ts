import type { CalcResult } from "../engine";
import { fmtFull, fmt } from "../formatters";

export interface PdfInputs {
  units: number;
  pricePerUnit: number;
  commonCharges: number;
  propertyTaxes: number;
  propType: string;
  monthlyRent: number;
  otherCharges: number;
  rentTaxes: number;
  timelineYears: number;
  annualAppreciation: number;
  annualRentGrowth: number;
  result: CalcResult;
  userName?: string;
  userOrg?: string;
}

/* ── Brand colors (hardcoded for html2canvas) ── */
const C = {
  primary: "#0F1B2D",
  secondary: "#1A2D47",
  accent: "#B8965A",
  accentLight: "#D4B87A",
  canvas: "#FAF8F5",
  text: "#1A1A1A",
  warm: "#C8B89A",
  mid: "#E8DFD0",
  light: "#F5F0E8",
  green: "#4A7C59",
  red: "#8B3A3A",
};

function buildHtml(inputs: PdfInputs): string {
  const { result, units, pricePerUnit, timelineYears, annualAppreciation, annualRentGrowth } = inputs;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const propLabel = inputs.propType === "residential"
    ? "Condos, Co-ops & 1\u20133 Family Houses"
    : "Commercial & All Other Property";

  const verdictLabel = result.buyWins
    ? "Ownership creates a sovereign advantage."
    : "Renting is more cost-effective in this scenario.";

  const verdictColor = result.buyWins ? C.primary : C.light;
  const verdictTextColor = result.buyWins ? C.canvas : C.primary;

  const metrics = [
    { label: "Total Purchase Price", value: fmtFull(result.totalPurchasePrice) },
    { label: `Property Value Yr ${timelineYears}`, value: fmtFull(Math.round(result.saleValue)) },
    { label: "Net Cost of Buying", value: fmtFull(Math.round(result.buyNetSpend)) },
    { label: "Total Cost of Renting", value: fmtFull(Math.round(result.rentNetSpend)) },
    { label: "Terminal Equity", value: fmtFull(Math.round(result.terminalValue)) },
  ];

  const yearRows = result.yearlyData.map((d) => `
    <tr style="border-bottom:1px solid ${C.mid};">
      <td style="padding:6px 8px;text-align:center;font-weight:700;color:${C.primary};">${d.year}</td>
      <td style="padding:6px 8px;text-align:right;color:${C.text};">${fmtFull(d.buyAnnualCost)}</td>
      <td style="padding:6px 8px;text-align:right;color:${C.text};">${fmtFull(d.rentAnnualCost)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600;color:${C.primary};">${fmtFull(d.cumBuySpend)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600;color:${C.accent};">${fmtFull(d.cumRentSpend)}</td>
      <td style="padding:6px 8px;text-align:right;color:${C.text};">${fmtFull(d.propertyValue)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600;color:${C.green};">${fmtFull(d.equity)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:700;color:${d.advantage >= 0 ? C.green : C.red};">${d.advantage >= 0 ? "+" : ""}${fmtFull(d.advantage)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;color:${C.text};background:#fff;width:210mm;">

  <!-- Header -->
  <div style="background:${C.primary};padding:28px 40px;display:flex;justify-content:space-between;align-items:center;">
    <div style="color:${C.accent};font-size:18px;font-weight:700;letter-spacing:0.12em;">AABO ADVISORY</div>
    <div style="color:${C.warm};font-size:10px;letter-spacing:0.1em;">PORTFOLIO ANALYSIS</div>
  </div>
  <div style="height:3px;background:${C.accent};"></div>

  <!-- Prepared for -->
  <div style="padding:24px 40px;background:${C.light};border-bottom:1px solid ${C.mid};">
    <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:6px;font-weight:600;">Prepared For</div>
    <div style="font-size:14px;font-weight:700;color:${C.primary};">${inputs.userName ?? "—"}</div>
    ${inputs.userOrg ? `<div style="font-size:12px;color:${C.text};opacity:0.6;margin-top:2px;">${inputs.userOrg}</div>` : ""}
    <div style="font-size:11px;color:${C.text};opacity:0.4;margin-top:4px;">${today}</div>
  </div>

  <!-- Inputs Summary -->
  <div style="padding:24px 40px;">
    <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:12px;font-weight:600;">Input Summary</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:16px;">
          <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${C.accent};margin-bottom:8px;font-weight:600;">Purchase Scenario</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Units</td><td style="padding:4px 0;text-align:right;font-weight:600;">${units}</td></tr>
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Price per Unit</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtFull(pricePerUnit)}</td></tr>
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Common Charges /mo</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtFull(inputs.commonCharges)}</td></tr>
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Property Taxes /mo</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtFull(inputs.propertyTaxes)}</td></tr>
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Classification</td><td style="padding:4px 0;text-align:right;font-weight:600;">${propLabel}</td></tr>
          </table>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:16px;border-left:1px solid ${C.mid};">
          <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${C.accent};margin-bottom:8px;font-weight:600;">Rental Scenario</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Monthly Rent /unit</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtFull(inputs.monthlyRent)}</td></tr>
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Other Charges /mo</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtFull(inputs.otherCharges)}</td></tr>
            <tr><td style="padding:4px 0;color:${C.text};opacity:0.6;">Taxes /mo /unit</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtFull(inputs.rentTaxes)}</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${C.mid};font-size:11px;">
      <span style="color:${C.text};opacity:0.6;">Hold Period:</span> <strong>${timelineYears} years</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span style="color:${C.text};opacity:0.6;">Appreciation:</span> <strong>${annualAppreciation}%</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span style="color:${C.text};opacity:0.6;">Rent Growth:</span> <strong>${annualRentGrowth}%</strong>
    </div>
  </div>

  <!-- Verdict -->
  <div style="margin:0 40px;padding:20px 24px;background:${verdictColor};border-left:4px solid ${C.accent};">
    <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.accent};margin-bottom:6px;font-weight:600;">${timelineYears}-Year Verdict</div>
    <div style="font-size:18px;font-weight:700;color:${verdictTextColor};margin-bottom:4px;">${verdictLabel}</div>
    <div style="font-size:12px;color:${verdictTextColor};opacity:0.6;">
      Net savings of ${fmtFull(Math.abs(Math.round(result.savings)))} over ${timelineYears} years by ${result.buyWins ? "buying" : "renting"}.${result.breakeven != null ? ` Breakeven at year ${result.breakeven}.` : ""}
    </div>
    <div style="margin-top:8px;font-size:24px;font-weight:700;color:${C.accent};">${fmt(Math.abs(result.savings))}</div>
  </div>

  <!-- Metrics -->
  <div style="padding:24px 40px;">
    <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:12px;font-weight:600;">Key Metrics</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        ${metrics.map((m) => `
          <td style="width:20%;padding:10px;background:${C.light};border:1px solid ${C.mid};vertical-align:top;">
            <div style="font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};opacity:0.5;margin-bottom:4px;">${m.label}</div>
            <div style="font-size:15px;font-weight:700;color:${C.primary};">${m.value}</div>
          </td>
        `).join("")}
      </tr>
    </table>
  </div>

  <!-- Year-by-Year Table -->
  <div style="padding:0 40px 24px;">
    <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:10px;font-weight:600;">Year-by-Year Projection</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead>
        <tr style="border-bottom:2px solid ${C.accent};">
          <th style="padding:6px 8px;text-align:center;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Year</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Buy Annual</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Rent Annual</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Cum. Buy</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Cum. Rent</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Prop. Value</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Net Equity</th>
          <th style="padding:6px 8px;text-align:right;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.accent};font-weight:600;">Advantage</th>
        </tr>
      </thead>
      <tbody>
        ${yearRows}
      </tbody>
    </table>
  </div>

  <!-- Disclaimer -->
  <div style="padding:16px 40px;border-top:1px solid ${C.mid};font-size:9px;color:${C.text};opacity:0.35;line-height:1.6;">
    This analysis provides estimates for illustrative purposes only and does not constitute financial, tax, or legal advice. Actual costs will vary based on specific property characteristics, market conditions, financing terms, and individual circumstances. Consult qualified professionals before making real estate decisions.
  </div>

  <!-- Footer -->
  <div style="background:${C.primary};padding:16px 40px;font-size:9px;color:${C.warm};opacity:0.6;letter-spacing:0.06em;">
    AABO Advisory &middot; aaboadvisory.com &middot; Confidential
  </div>

</body>
</html>`;
}

function generateFilename(inputs: PdfInputs): string {
  const name = inputs.userName?.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() ?? "analysis";
  return `aabo-portfolio-analysis-${name}.pdf`;
}

export async function generatePdfBase64(inputs: PdfInputs): Promise<string> {
  const html2pdf = (await import("html2pdf.js")).default;
  const html = buildHtml(inputs);

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const base64: string = await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: generateFilename(inputs),
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .toPdf()
      .outputPdf("datauristring");

    // Extract base64 portion from data URI
    const commaIdx = base64.indexOf(",");
    return commaIdx >= 0 ? base64.slice(commaIdx + 1) : base64;
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadPdf(inputs: PdfInputs): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const html = buildHtml(inputs);

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: generateFilename(inputs),
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

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

/* ── SVG Chart builders ── */

function buildCumulativeChart(data: CalcResult["yearlyData"]): string {
  const W = 680, H = 200, PAD = { top: 20, right: 20, bottom: 30, left: 70 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const allVals = data.flatMap((d) => [d.cumBuySpend, d.cumRentSpend, d.propertyValue]);
  const maxVal = Math.max(...allVals);
  const minVal = 0;

  const x = (i: number) => PAD.left + (i / (data.length - 1)) * plotW;
  const y = (v: number) => PAD.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  const line = (key: keyof typeof data[0]) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key] as number).toFixed(1)}`).join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = minVal + pct * (maxVal - minVal);
    const yPos = y(val);
    return `<line x1="${PAD.left}" y1="${yPos}" x2="${W - PAD.right}" y2="${yPos}" stroke="${C.mid}" stroke-width="0.5"/>
      <text x="${PAD.left - 8}" y="${yPos + 3}" text-anchor="end" font-size="8" fill="${C.text}" opacity="0.4">${fmt(val)}</text>`;
  }).join("");

  const xLabels = data.map((d, i) => {
    if (data.length > 15 && i % 5 !== 0 && i !== data.length - 1) return "";
    return `<text x="${x(i)}" y="${H - 4}" text-anchor="middle" font-size="8" fill="${C.text}" opacity="0.5">Yr ${d.year}</text>`;
  }).join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;">
    ${gridLines}
    ${xLabels}
    <path d="${line("cumBuySpend")}" fill="none" stroke="${C.primary}" stroke-width="2.5"/>
    <path d="${line("cumRentSpend")}" fill="none" stroke="${C.accent}" stroke-width="2.5"/>
    <path d="${line("propertyValue")}" fill="none" stroke="${C.green}" stroke-width="1.5" stroke-dasharray="6,3"/>
    <!-- Legend -->
    <rect x="${PAD.left}" y="${PAD.top - 14}" width="10" height="3" fill="${C.primary}"/>
    <text x="${PAD.left + 14}" y="${PAD.top - 10}" font-size="8" fill="${C.text}" opacity="0.6">Cum. Buy Cost</text>
    <rect x="${PAD.left + 100}" y="${PAD.top - 14}" width="10" height="3" fill="${C.accent}"/>
    <text x="${PAD.left + 114}" y="${PAD.top - 10}" font-size="8" fill="${C.text}" opacity="0.6">Cum. Rent Cost</text>
    <rect x="${PAD.left + 200}" y="${PAD.top - 14}" width="10" height="3" fill="${C.green}" opacity="0.6"/>
    <text x="${PAD.left + 214}" y="${PAD.top - 10}" font-size="8" fill="${C.text}" opacity="0.6">Property Value</text>
  </svg>`;
}

function buildAdvantageChart(data: CalcResult["yearlyData"]): string {
  const W = 680, H = 160, PAD = { top: 16, right: 20, bottom: 30, left: 70 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const vals = data.map((d) => d.advantage);
  const maxAbs = Math.max(...vals.map(Math.abs), 1);

  const barW = Math.min(plotW / data.length - 2, 30);
  const zeroY = PAD.top + plotH * (maxAbs / (2 * maxAbs));

  const bars = data.map((d, i) => {
    const cx = PAD.left + (i + 0.5) * (plotW / data.length);
    const barH = (Math.abs(d.advantage) / maxAbs) * (plotH / 2);
    const isPos = d.advantage >= 0;
    const barY = isPos ? zeroY - barH : zeroY;
    const color = isPos ? C.green : C.red;
    const label = data.length > 15 && i % 5 !== 0 && i !== data.length - 1 ? "" :
      `<text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="8" fill="${C.text}" opacity="0.5">Yr ${d.year}</text>`;
    return `<rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="${barH}" fill="${color}" opacity="0.8" rx="1"/>
      ${label}`;
  }).join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;">
    <line x1="${PAD.left}" y1="${zeroY}" x2="${W - PAD.right}" y2="${zeroY}" stroke="${C.mid}" stroke-width="1"/>
    <text x="${PAD.left - 8}" y="${zeroY + 3}" text-anchor="end" font-size="8" fill="${C.text}" opacity="0.4">$0</text>
    <text x="${PAD.left - 8}" y="${PAD.top + 8}" text-anchor="end" font-size="8" fill="${C.green}" opacity="0.6">+${fmt(maxAbs)}</text>
    <text x="${PAD.left - 8}" y="${H - PAD.bottom}" text-anchor="end" font-size="8" fill="${C.red}" opacity="0.6">-${fmt(maxAbs)}</text>
    ${bars}
    <!-- Legend -->
    <rect x="${PAD.left}" y="${PAD.top - 12}" width="10" height="3" fill="${C.green}" opacity="0.8"/>
    <text x="${PAD.left + 14}" y="${PAD.top - 8}" font-size="8" fill="${C.text}" opacity="0.6">Buy Advantage</text>
    <rect x="${PAD.left + 100}" y="${PAD.top - 12}" width="10" height="3" fill="${C.red}" opacity="0.8"/>
    <text x="${PAD.left + 114}" y="${PAD.top - 8}" font-size="8" fill="${C.text}" opacity="0.6">Rent Advantage</text>
  </svg>`;
}

/* ── Inline logo SVG (from /public/logo.svg, fill overridden for PDF) ── */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 528.17 150.43" height="28"><g fill="{{FILL}}"><path d="M47.42,146.67c.1.78.11,1.64.01,2.47,0,.08-.07.13-.15.13H.21c-.08,0-.15-.07-.15-.14-.06-.85-.07-1.63-.05-2.47,0-.08.07-.15.15-.15,3.77.1,6.89-1.13,9.39-3.84,2.05-2.23,3.75-4.69,5.27-7.38,2.48-4.39,4.71-8.7,6.63-13.38l8.37-20.49,4.15-.02-4.64,14c-1.3,3.94-2.02,7.91-2.38,12.06-.65,7.53,1.42,14.66,9.02,17.48,3.61,1.34,7.1,1.67,11.29,1.59.08,0,.14.05.15.13Z"/><path d="M115.06,149.07l-22.6-56.52s0,0,0,0c0,0-.3-.75-.3-.75-1.77-2.85-4.55-3.95-8.28-3.74,2.98-.65,5.14-3.72,4.38-6.02,0,0,0,0,0,0L61.83,15.96c-.05-.13-.23-.13-.28,0l-3.98,10.53,30.23,76.35,9.8,25c1.72,4.39,3.75,13.15-.25,16.79-1.64,1.49-3.58,1.79-5.88,1.94-.08,0-.14.07-.14.15l.05,2.42c0,.08.07.15.15.15h23.38c.11,0,.18-.11.14-.21Z"/><path d="M139.91,146.71c0-.08-.06-.15-.14-.15-5.28-.21-8.49-1.58-11.49-6.01-2.15-3.18-3.93-6.5-5.39-10.17C105.53,86.75,87.99,43.39,69.82.11c-.83-.14-1.46-.14-2.26-.04l-2.71,7.17s-.01.07.3.86l56.7,141.82c-.28-.7-.22-.66-.16-.66h18.18s.04-2.56.04-2.56Z"/><path d="M146.51,85.42l20.39-44.43h3.59l20.43,44.43h-3.59l-5.84-12.74h-25.56l-5.8,12.74h-3.62ZM156.88,70.22h23.66l-11.85-25.82-11.81,25.82Z"/><path d="M193.91,85.42l20.39-44.43h3.59l20.43,44.43h-3.59l-5.84-12.74h-25.56l-5.8,12.74h-3.62ZM204.28,70.22h23.66l-11.85-25.82-11.81,25.82Z"/><path d="M247.74,85.42v-44.43h14.45c9.28,0,15.05,3.79,15.05,11.57,0,4.77-3.16,8.12-8.19,9.54,5.87,1.36,9.6,5.94,9.6,11,0,7.9-5.77,12.32-15.26,12.32h-15.64ZM250.97,60.93h10.9c7.35,0,12.13-3.25,12.13-8.37,0-6.04-4.46-8.97-12.13-8.97h-10.9v17.35ZM250.97,82.8h12.09c7.7,0,12.3-3.67,12.3-9.76,0-5.09-4.99-9.58-12.66-9.58h-11.74v19.34Z"/><path d="M287.82,63.21c0-13.59,10.48-23.23,24.93-23.23s24.93,9.64,24.93,23.23-10.48,23.23-24.93,23.23-24.93-9.64-24.93-23.23ZM334.34,63.21c0-12.01-9.04-20.51-21.59-20.51s-21.62,8.5-21.62,20.51,9.07,20.51,21.62,20.51,21.59-8.53,21.59-20.51Z"/><path d="M170.51,149.42l20.39-44.43h3.59l20.43,44.43h-3.59l-5.84-12.74h-25.56l-5.8,12.74h-3.62ZM180.88,134.22h23.66l-11.85-25.82-11.81,25.82Z"/><path d="M224.34,149.42v-44.43h17.05c14.48,0,24.54,9.07,24.54,22.12s-10.05,22.31-24.54,22.31h-17.05ZM227.61,146.8h13.61c12.59,0,21.41-8.15,21.41-19.69s-8.82-19.53-21.41-19.53h-13.61v39.22Z"/><path d="M292.27,149.42l-20.43-44.43h3.62l18.6,40.95,18.6-40.95h3.62l-20.43,44.43h-3.59Z"/><path d="M327.05,149.42v-44.43h3.27v44.43h-3.27Z"/><path d="M347.44,138.8l2.99-.54c1.16,5.91,6.19,9.26,12.62,9.26,7.38,0,11.5-4.2,11.5-9.23,0-3.76-1.83-6.7-7.14-9.01l-9.07-4.04c-5.48-2.4-8.96-5.09-8.96-10.37s4.92-10.52,13.46-10.52c7.52,0,12.62,4.14,13.5,9.99l-2.95.54c-.77-4.58-4.64-8-10.55-8-6.5,0-10.2,3.76-10.2,7.93,0,3.57,2.18,5.66,7.03,7.84l8.86,3.95c6.15,2.75,9.28,5.91,9.28,11.66,0,6.73-5.48,11.79-14.77,11.79s-14.13-4.42-15.61-11.25Z"/><path d="M388.69,127.21c0-13.59,10.48-23.23,24.93-23.23s24.93,9.64,24.93,23.23-10.48,23.23-24.93,23.23-24.93-9.64-24.93-23.23ZM435.2,127.21c0-12.01-9.04-20.51-21.59-20.51s-21.62,8.5-21.62,20.51,9.07,20.51,21.62,20.51,21.59-8.53,21.59-20.51Z"/><path d="M451.31,149.42v-44.43h14.13c9.46,0,15.33,3.6,15.33,12.04,0,7.36-5.59,10.9-11.92,11.82l19.3,20.57h-4.22l-18.81-20.19h-10.55v20.19h-3.27ZM454.58,126.64h10.83c6.64,0,12.13-3,12.13-9.61s-4.46-9.42-12.13-9.42h-10.83v19.02Z"/><path d="M507.18,149.42v-18.83l-17.68-25.6h3.9l15.4,22.75,15.43-22.75h3.94l-17.72,25.6v18.83h-3.27Z"/></g></svg>`;

/* ── Main HTML builder ── */

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

  const cumulativeChart = buildCumulativeChart(result.yearlyData);
  const advantageChart = buildAdvantageChart(result.yearlyData);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }</style>
</head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;color:${C.text};background:#fff;width:210mm;">
  <!-- Header -->
  <div style="background:${C.primary};padding:24px 40px;display:flex;justify-content:space-between;align-items:center;">
    ${LOGO_SVG.replace("{{FILL}}", C.accent)}
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

  <!-- Cumulative Cost Chart -->
  <div style="padding:0 40px 20px;">
    <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:10px;font-weight:600;">Cumulative Cost Comparison</div>
    <div style="background:${C.light};padding:16px;border:1px solid ${C.mid};">
      ${cumulativeChart}
    </div>
  </div>

  <!-- Advantage Chart -->
  <div style="padding:0 40px 24px;">
    <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:10px;font-weight:600;">Annual Buy vs. Rent Advantage</div>
    <div style="background:${C.light};padding:16px;border:1px solid ${C.mid};">
      ${advantageChart}
    </div>
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

/**
 * Render HTML inside an isolated iframe so Tailwind styles cannot interfere,
 * then run html2pdf against the iframe's body element.
 */
function createIsolatedContainer(html: string): { iframe: HTMLIFrameElement; body: HTMLElement; cleanup: () => void } {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:absolute;left:-9999px;top:0;width:210mm;height:297mm;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  return {
    iframe,
    body: doc.body,
    cleanup: () => document.body.removeChild(iframe),
  };
}

export async function generatePdfBase64(inputs: PdfInputs): Promise<string> {
  const html2pdf = (await import("html2pdf.js")).default;
  const html = buildHtml(inputs);
  const { body, cleanup } = createIsolatedContainer(html);

  try {
    const base64: string = await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: generateFilename(inputs),
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(body)
      .toPdf()
      .outputPdf("datauristring");

    const commaIdx = base64.indexOf(",");
    return commaIdx >= 0 ? base64.slice(commaIdx + 1) : base64;
  } finally {
    cleanup();
  }
}

export async function downloadPdf(inputs: PdfInputs): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const html = buildHtml(inputs);
  const { body, cleanup } = createIsolatedContainer(html);

  try {
    await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: generateFilename(inputs),
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(body)
      .save();
  } finally {
    cleanup();
  }
}

export function printReport(inputs: PdfInputs): void {
  const html = buildHtml(inputs);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}

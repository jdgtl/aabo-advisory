import { useState, useEffect, useRef, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const C = {
  primary: "#0F1B2D", secondary: "#1A2D47", text: "#1A1A1A",
  accent: "#B8965A", accentLight: "#D4B87A", warm: "#C8B89A",
  mid: "#E8DFD0", light: "#F5F0E8", canvas: "#FAF8F5",
  green: "#4A7C59", red: "#8B3A3A",
};
const FONT = { headline: "'Playfair Display', Georgia, serif", body: "'DM Sans', sans-serif" };

/* ─── TAX FUNCTIONS (informational) ─── */
function calcNYCTransferTax(p, t = "condo") {
  const c = t === "condo" || t === "coop" || t === "house";
  if (c) return p <= 500000 ? p * 0.01 : p * 0.01425;
  return p <= 500000 ? p * 0.01425 : p * 0.02625;
}
function calcNYSTransferTax(p, t = "condo") {
  const c = t === "condo" || t === "coop" || t === "house";
  if (c) return p < 3000000 ? p * 0.004 : p * 0.0065;
  return p < 2000000 ? p * 0.004 : p * 0.0065;
}
function calcMansionTax(p) {
  if (p < 1e6) return 0; if (p < 2e6) return p * 0.01; if (p < 3e6) return p * 0.0125;
  if (p < 5e6) return p * 0.015; if (p < 10e6) return p * 0.0225; if (p < 15e6) return p * 0.0325;
  if (p < 20e6) return p * 0.035; if (p < 25e6) return p * 0.0375; return p * 0.039;
}

/* ─── CALCULATION ENGINE (Excel-matched) ─── */
function runCalculation(p) {
  const tp = p.pricePerUnit * p.units, mo = p.timelineYears * 12;
  const ac = 12 * (p.commonCharges + p.propertyTaxes) * p.units;
  const acqCost = p.acquisitionCostPct * tp;
  const nycTx = calcNYCTransferTax(tp, p.propertyType);
  const nysTx = calcNYSTransferTax(tp, p.propertyType);
  const manTx = calcMansionTax(tp);
  const closingCosts = Math.max(0, acqCost - nycTx - nysTx - manTx);
  const maintCost = p.units * (p.maintenancePct * p.timelineYears / 10 * p.pricePerUnit);
  const fvB = (Math.pow(1 + p.annualAppreciation, p.timelineYears) - 1) / p.annualAppreciation;
  const buyTotal = ac * fvB + tp + maintCost + acqCost;
  const sale = tp * Math.pow(1 + p.annualAppreciation, p.timelineYears);
  const dispCost = p.disposalCostPct * sale;
  const buyNet = buyTotal + dispCost - sale;
  const terminal = sale - dispCost;
  const ar = (p.monthlyRent + p.otherCharges + p.rentTaxes) * p.units * 12;
  const brkFee = p.rentBrokerPct * ar;
  const fvR = ((Math.pow(1 + p.annualRentGrowth, p.timelineYears) - 1) / p.annualRentGrowth) * (1 + p.annualRentGrowth);
  const rentTotal = ar * fvR + brkFee;

  const yearlyData = [];
  let cumBuy = tp + acqCost, cumRent = 0;
  for (let y = 1; y <= p.timelineYears; y++) {
    const yc = ac * Math.pow(1 + p.annualAppreciation, y - 1);
    const ym = (y % 10 === 0) ? p.maintenancePct * tp : 0;
    cumBuy += yc + ym;
    const yr = ar * Math.pow(1 + p.annualRentGrowth, y - 1);
    cumRent += yr;
    const pv = tp * Math.pow(1 + p.annualAppreciation, y);
    const yd = p.disposalCostPct * pv;
    const eq = pv - yd;
    const nb = cumBuy + yd - pv;
    yearlyData.push({ year: y, buyAnnualCost: Math.round(yc), rentAnnualCost: Math.round(yr),
      cumBuySpend: Math.round(cumBuy), cumRentSpend: Math.round(cumRent),
      propertyValue: Math.round(pv), equity: Math.round(eq),
      netBuyCost: Math.round(nb), netRentCost: Math.round(cumRent),
      advantage: Math.round(cumRent - nb) });
  }

  return { totalPurchasePrice: tp, totalAcquisitionCosts: acqCost, closingCosts,
    nycTransferTax: nycTx, nysTransferTax: nysTx, mansionTax: manTx,
    totalMaintenanceCosts: maintCost, buyTotalSpend: buyTotal, saleValue: sale,
    totalDisposalCosts: dispCost, buyNetSpend: buyNet, terminalValue: terminal,
    annualCarrying: ac, annualRentCost: ar, rentBrokerFee: brkFee,
    rentTotalSpend: rentTotal, rentNetSpend: rentTotal,
    buyMonthlyCost: buyNet / mo, rentMonthlyCost: rentTotal / mo,
    savings: rentTotal - buyNet, buyWins: buyNet < rentTotal,
    breakevenYear: yearlyData.find(d => d.advantage > 0)?.year || null, yearlyData };
}

/* ─── FORMATTING ─── */
const fmtFull = (n) => { const r = Math.round(n), a = Math.abs(r).toLocaleString("en-US"); return r < 0 ? `-$${a}` : `$${a}`; };
const fmt = (n) => { if (Math.abs(n) >= 1e6) { const m = n / 1e6; return `$${m.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`; } return fmtFull(n); };
const fmtInput = (n) => Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("en-US") : String(n);

/* ─── SCROLL REVEAL ─── */
function useReveal(th = 0.12) {
  const ref = useRef(null); const [v, setV] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.unobserve(el); } }, { threshold: th }); o.observe(el); return () => o.disconnect(); }, []);
  return [ref, v];
}
function R({ children, delay = 0, style = {} }) {
  const [ref, v] = useReveal();
  return (<div ref={ref} style={{ ...style, opacity: v ? 1 : 0, transform: v ? "none" : "translateY(24px)", transition: `opacity 0.6s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.6s cubic-bezier(.4,0,.2,1) ${delay}s` }}>{children}</div>);
}

/* ─── INFO TOOLTIP (fixed position, two-section) ─── */
function InfoTip({ definition, formula }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 8, left: Math.min(r.left, window.innerWidth - 320) });
    }
    setShow(true);
  };

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", marginLeft: 6, cursor: "help" }}
      onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      <span style={{
        width: 15, height: 15, borderRadius: "50%", border: `1px solid ${C.warm}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, color: C.warm, fontFamily: FONT.body, fontStyle: "italic",
        opacity: 0.6,
      }}>i</span>
      {show && (
        <div style={{
          position: "fixed", top: coords.top, left: coords.left,
          width: 300, padding: 0, background: C.primary, color: C.canvas,
          fontFamily: FONT.body, fontWeight: 400, zIndex: 10000,
          boxShadow: `0 12px 40px ${C.primary}70`, border: `1px solid ${C.accent}40`,
          pointerEvents: "none",
        }}>
          <div style={{ padding: "14px 16px", fontSize: 12, lineHeight: 1.6, color: C.canvas }}>
            {definition}
          </div>
          {formula && (
            <div style={{ padding: "12px 16px", fontSize: 11, lineHeight: 1.55, color: C.warm,
              borderTop: `1px solid ${C.accent}30`, background: `${C.secondary}80` }}>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, fontWeight: 600, display: "block", marginBottom: 4 }}>Calculation</span>
              {formula}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

/* ─── DOLLAR INPUT (formatted with commas) ─── */
function DollarInput({ label, value, onChange, min, max, step, hint }) {
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState(fmtInput(value));

  useEffect(() => { if (!focused) setDisplay(fmtInput(value)); }, [value, focused]);

  const handleFocus = () => { setFocused(true); setDisplay(String(value)); };
  const handleBlur = () => { setFocused(false); setDisplay(fmtInput(value)); };
  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    setDisplay(e.target.value);
    const num = parseFloat(raw);
    if (!isNaN(num)) onChange(num);
  };

  return (
    <div style={{ flex: "1 1 180px", minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, opacity: 0.45, marginBottom: 6, fontWeight: 600, fontFamily: FONT.body }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${focused ? C.accent : C.mid}`, background: C.canvas, transition: "border-color 0.25s ease", overflow: "hidden" }}>
        <span style={{ padding: "12px 0 12px 14px", fontSize: 14, color: C.warm, fontFamily: FONT.body, userSelect: "none" }}>$</span>
        <input type="text" inputMode="decimal" value={display}
          onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}
          style={{ flex: 1, border: "none", outline: "none", padding: "12px 14px 12px 4px", fontSize: 14, fontFamily: FONT.body, color: C.text, background: "transparent", width: "100%" }}
        />
      </div>
      {hint && <div style={{ fontSize: 10, color: C.warm, marginTop: 4, opacity: 0.6 }}>{hint}</div>}
    </div>
  );
}

function Input({ label, value, onChange, prefix = "", suffix, min, max, step, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ flex: "1 1 180px", minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, opacity: 0.45, marginBottom: 6, fontWeight: 600, fontFamily: FONT.body }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${focused ? C.accent : C.mid}`, background: C.canvas, transition: "border-color 0.25s ease", overflow: "hidden" }}>
        {prefix && <span style={{ padding: "12px 0 12px 14px", fontSize: 14, color: C.warm, fontFamily: FONT.body, userSelect: "none" }}>{prefix}</span>}
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", outline: "none", padding: prefix ? "12px 14px 12px 4px" : "12px 14px", fontSize: 14, fontFamily: FONT.body, color: C.text, background: "transparent", width: "100%" }}
        />
        {suffix && <span style={{ padding: "12px 14px 12px 0", fontSize: 13, color: C.warm, fontFamily: FONT.body, userSelect: "none" }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: C.warm, marginTop: 4, opacity: 0.6 }}>{hint}</div>}
    </div>
  );
}

function SelectInput({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ flex: "1 1 180px", minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, opacity: 0.45, marginBottom: 6, fontWeight: 600, fontFamily: FONT.body }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", border: `1px solid ${focused ? C.accent : C.mid}`, background: C.canvas, padding: "12px 14px", fontSize: 14, fontFamily: FONT.body, color: C.text, outline: "none", cursor: "pointer", appearance: "auto", transition: "border-color 0.25s ease" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── METRIC CARD ─── */
function MetricCard({ label, value, sub, accent, definition, formula }) {
  return (
    <div style={{ padding: "24px 20px", background: accent ? C.primary : C.light, flex: "1 1 200px", minWidth: 180 }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: accent ? C.accent : C.warm, marginBottom: 8, fontWeight: 600, fontFamily: FONT.body }}>
        {label}
        {definition && <InfoTip definition={definition} formula={formula} />}
      </div>
      <div style={{ fontFamily: FONT.headline, fontSize: 24, fontWeight: 700, color: accent ? C.canvas : C.primary, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: accent ? C.warm : C.text, opacity: 0.5, marginTop: 6, fontFamily: FONT.body }}>{sub}</div>}
    </div>
  );
}

/* ─── TAX BREAKDOWN ─── */
function TaxBreakdown({ result }) {
  const rows = [
    { label: "NYC Transfer Tax", value: result.nycTransferTax },
    { label: "NYS Transfer Tax", value: result.nysTransferTax },
    { label: "Mansion Tax", value: result.mansionTax, highlight: result.mansionTax > 0 },
    { label: "Broker & Legal (est.)", value: result.closingCosts },
  ];
  return (
    <div style={{ background: C.light, padding: "24px", borderLeft: `3px solid ${C.accent}` }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 4, fontWeight: 600, fontFamily: FONT.body }}>
        Acquisition Cost Breakdown
        <InfoTip
          definition="Estimated split of your all-in acquisition rate between statutory taxes and broker/legal fees."
          formula="Total Acquisition = Acquisition Rate × Total Purchase Price"
        />
      </div>
      <div style={{ fontSize: 11, color: C.text, opacity: 0.35, marginBottom: 14, fontFamily: FONT.body }}>Components within the all-in acquisition rate</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.mid}` : "none", fontSize: 13, fontFamily: FONT.body }}>
          <span style={{ color: C.text, opacity: 0.6 }}>{r.label}</span>
          <span style={{ color: r.highlight ? C.accent : C.primary, fontWeight: r.highlight ? 700 : 600 }}>{fmtFull(r.value)}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 4, borderTop: `2px solid ${C.accent}`, fontSize: 14, fontFamily: FONT.body, fontWeight: 700 }}>
        <span style={{ color: C.primary }}>Total Acquisition</span>
        <span style={{ color: C.primary }}>{fmtFull(result.totalAcquisitionCosts)}</span>
      </div>
    </div>
  );
}

/* ─── CHART TOOLTIP FACTORY ─── */
function makeTooltip(dataSource, fields) {
  return function ChartTooltip({ active, label }) {
    if (!active || label == null) return null;
    const row = dataSource.find(d => d.year === label);
    if (!row) return null;
    return (
      <div style={{ background: C.primary, padding: "16px 20px", border: `1px solid ${C.accent}33`, minWidth: 220, boxShadow: `0 8px 32px ${C.primary}40` }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, marginBottom: 10, fontWeight: 600, fontFamily: FONT.body }}>Year {label}</div>
        {fields.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "4px 0", fontSize: 13, fontFamily: FONT.body }}>
            <span style={{ color: C.warm, opacity: 0.7 }}>{f.label}</span>
            <span style={{ color: f.color || C.canvas, fontWeight: 600 }}>{fmtFull(row[f.key])}</span>
          </div>
        ))}
      </div>
    );
  };
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function AaboBuyVsRent() {
  const [units, setUnits] = useState(9);
  const [pricePerUnit, setPricePerUnit] = useState(2000000);
  const [commonCharges, setCommonCharges] = useState(1200);
  const [propertyTaxes, setPropertyTaxes] = useState(1000);
  const [propertyType, setPropertyType] = useState("condo");
  const [monthlyRent, setMonthlyRent] = useState(8000);
  const [otherCharges, setOtherCharges] = useState(0);
  const [rentTaxes, setRentTaxes] = useState(0);
  const [rentBrokerPct, setRentBrokerPct] = useState(7.5);
  const [timelineYears, setTimelineYears] = useState(16);
  const [annualAppreciation, setAnnualAppreciation] = useState(2.5);
  const [annualRentGrowth, setAnnualRentGrowth] = useState(2.75);
  const [acquisitionCostPct, setAcquisitionCostPct] = useState(4.5);
  const [disposalCostPct, setDisposalCostPct] = useState(6.5);
  const [maintenancePct, setMaintenancePct] = useState(5);
  const [activeView, setActiveView] = useState("summary");
  const [showAdvanced, setShowAdvanced] = useState(true);

  useEffect(() => {
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap";
    document.head.appendChild(l);
  }, []);

  const result = useMemo(() => runCalculation({
    units, pricePerUnit, commonCharges, propertyTaxes, monthlyRent, otherCharges, rentTaxes,
    timelineYears, annualAppreciation: annualAppreciation / 100, annualRentGrowth: annualRentGrowth / 100,
    acquisitionCostPct: acquisitionCostPct / 100, disposalCostPct: disposalCostPct / 100,
    maintenancePct: maintenancePct / 100, rentBrokerPct: rentBrokerPct / 100, propertyType,
  }), [units, pricePerUnit, commonCharges, propertyTaxes, monthlyRent, otherCharges, rentTaxes, timelineYears, annualAppreciation, annualRentGrowth, acquisitionCostPct, disposalCostPct, maintenancePct, rentBrokerPct, propertyType]);

  const SummaryTip = useMemo(() => makeTooltip(result.yearlyData, [
    { key: "netBuyCost", label: "Net Buy Cost", color: C.canvas },
    { key: "netRentCost", label: "Rent Cost", color: C.accent },
    { key: "advantage", label: "Buy Advantage", color: C.green },
  ]), [result.yearlyData]);
  const EquityTip = useMemo(() => makeTooltip(result.yearlyData, [
    { key: "equity", label: "Net Equity", color: C.green },
    { key: "cumRentSpend", label: "Cumulative Rent", color: C.red },
  ]), [result.yearlyData]);
  const AnnualTip = useMemo(() => makeTooltip(result.yearlyData, [
    { key: "buyAnnualCost", label: "Buy Annual Cost", color: C.canvas },
    { key: "rentAnnualCost", label: "Rent Annual Cost", color: C.accent },
  ]), [result.yearlyData]);
  const CumulativeTip = useMemo(() => makeTooltip(result.yearlyData, [
    { key: "cumBuySpend", label: "Cumulative Buy", color: C.canvas },
    { key: "cumRentSpend", label: "Cumulative Rent", color: C.accent },
    { key: "propertyValue", label: "Property Value", color: C.green },
  ]), [result.yearlyData]);
  const AdvantageTip = useMemo(() => makeTooltip(result.yearlyData, [
    { key: "advantage", label: "Buy Advantage", color: C.accent },
    { key: "netBuyCost", label: "Net Buy Cost", color: C.canvas },
    { key: "netRentCost", label: "Rent Cost", color: C.warm },
  ]), [result.yearlyData]);

  const tabs = [
    { id: "summary", label: "Summary" }, { id: "annual", label: "Annual Costs" },
    { id: "cumulative", label: "Cumulative" }, { id: "advantage", label: "Net Advantage" },
    { id: "taxes", label: "Tax Detail" },
  ];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: C.canvas, fontFamily: FONT.body, color: C.text }}>

      {/* HEADER */}
      <div style={{ background: C.primary, padding: "0 48px", borderBottom: `1px solid ${C.accent}25` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: FONT.headline, fontSize: 16, fontWeight: 700, color: C.canvas, letterSpacing: "0.08em" }}>AABO</span>
            <div style={{ width: 1, height: 20, background: `${C.accent}40` }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent, fontWeight: 500 }}>Buy vs. Rent Calculator</span>
          </div>
          <div style={{ fontSize: 10, color: C.warm, opacity: 0.4, letterSpacing: "0.08em" }}>Strategic Housing Advisory</div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>

        {/* TITLE */}
        <R>
          <div style={{ padding: "48px 0 12px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Strategic Housing Advisory · Calculator</div>
            <h1 style={{ fontFamily: FONT.headline, fontSize: 40, fontWeight: 700, color: C.primary, margin: "0 0 12px 0", lineHeight: 1.15 }}>Buy vs. Rent Analysis</h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text, opacity: 0.55, maxWidth: 580, margin: 0 }}>A multi-decade cost comparison incorporating NYC & NYS transfer taxes, mansion tax, transaction costs, and long-term asset appreciation.</p>
          </div>
        </R>
        <div style={{ width: 48, height: 2, background: C.accent, marginBottom: 40 }} />

        {/* INPUTS */}
        <R delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 40, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 28, height: 28, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.accent, fontWeight: 700, fontFamily: FONT.headline }}>B</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: FONT.headline }}>Purchase Scenario</div>
                  <div style={{ fontSize: 11, color: C.warm, opacity: 0.6 }}>Acquisition, carrying, and disposal</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <Input label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} />
                <DollarInput label="Price per Unit" value={pricePerUnit} onChange={setPricePerUnit} />
                <DollarInput label="Common Charges /mo" value={commonCharges} onChange={setCommonCharges} />
                <DollarInput label="Property Taxes /mo" value={propertyTaxes} onChange={setPropertyTaxes} />
                <SelectInput label="Property Type" value={propertyType} onChange={setPropertyType}
                  options={[{ value: "condo", label: "Condo / Co-op" }, { value: "other", label: "All Other Types" }]} />
              </div>
            </div>
            <div style={{ background: C.mid, width: 1 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 28, height: 28, background: C.canvas, border: `1.5px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.primary, fontWeight: 700, fontFamily: FONT.headline }}>R</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: FONT.headline }}>Rental Scenario</div>
                  <div style={{ fontSize: 11, color: C.warm, opacity: 0.6 }}>Monthly obligations over time</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <Input label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} />
                <DollarInput label="Monthly Rent /unit" value={monthlyRent} onChange={setMonthlyRent} />
                <DollarInput label="Other Charges /mo" value={otherCharges} onChange={setOtherCharges} />
                <DollarInput label="Taxes /mo /unit" value={rentTaxes} onChange={setRentTaxes} />
              </div>
            </div>
          </div>
        </R>

        {/* TIMELINE & GROWTH */}
        <R delay={0.15}>
          <div style={{ background: C.light, padding: "28px 32px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>Timeline & Growth Assumptions</div>
              <div style={{ flex: 1, height: 1, background: C.mid }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "start" }}>
              <Input label="Hold Period (Years)" value={timelineYears} onChange={setTimelineYears} suffix="yrs" min={1} max={30} step={1} />
              <Input label="Annual Appreciation" value={annualAppreciation} onChange={setAnnualAppreciation} suffix="%" min={-5} max={15} step={0.25} hint="Property value growth" />
              <Input label="Annual Rent Growth" value={annualRentGrowth} onChange={setAnnualRentGrowth} suffix="%" min={0} max={15} step={0.25} hint="Market rent escalation" />
            </div>
          </div>
        </R>

        {/* TRANSACTION COST ASSUMPTIONS — prominent section */}
        <R delay={0.18}>
          <div style={{ background: C.light, padding: "28px 32px", marginBottom: 40, border: `1px solid ${C.mid}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showAdvanced ? 20 : 0, cursor: "pointer" }}
              onClick={() => setShowAdvanced(!showAdvanced)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>Transaction Cost Assumptions</div>
                <div style={{ flex: "0 0 auto", height: 1, width: 60, background: C.mid }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.accent, fontWeight: 500, letterSpacing: "0.04em" }}>
                {showAdvanced ? "Collapse" : "Expand"}
                <span style={{ transition: "transform 0.3s ease", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "none", fontSize: 16, lineHeight: 1 }}>⌄</span>
              </div>
            </div>
            {showAdvanced && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <Input label="Acquisition Costs" value={acquisitionCostPct} onChange={setAcquisitionCostPct} suffix="%" min={0} max={15} step={0.5} hint="All-in: broker, legal, taxes" />
                <Input label="Disposal Costs" value={disposalCostPct} onChange={setDisposalCostPct} suffix="%" min={0} max={15} step={0.5} hint="Broker + legal at sale" />
                <Input label="Maintenance Cost" value={maintenancePct} onChange={setMaintenancePct} suffix="%" min={0} max={20} step={0.5} hint="Per 10-year cycle" />
                <Input label="Rent Broker Fee" value={rentBrokerPct} onChange={setRentBrokerPct} suffix="%" min={0} max={15} step={0.5} hint="One-time, on annual rent" />
              </div>
            )}
          </div>
        </R>

        {/* VERDICT — no overflow:hidden so tooltip can extend */}
        <R delay={0.2}>
          <div style={{
            background: result.buyWins ? C.primary : C.light,
            padding: "36px 40px", marginBottom: 32,
            borderLeft: `4px solid ${C.accent}`,
            position: "relative",
          }}>
            {result.buyWins && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 20%, ${C.secondary}88 0%, transparent 60%)`, pointerEvents: "none" }} />}
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 8, fontWeight: 600 }}>{timelineYears}-Year Verdict</div>
                <div style={{ fontFamily: FONT.headline, fontSize: 28, fontWeight: 700, color: result.buyWins ? C.canvas : C.primary, lineHeight: 1.2 }}>
                  {result.buyWins ? "Ownership creates a sovereign advantage." : "Renting is more cost-effective in this scenario."}
                </div>
                <div style={{ fontSize: 14, color: result.buyWins ? C.warm : C.text, opacity: 0.6, marginTop: 8 }}>
                  Net savings of {fmtFull(Math.abs(Math.round(result.savings)))} over {timelineYears} years by {result.buyWins ? "buying" : "renting"}.
                  {result.breakevenYear && ` Breakeven at year ${result.breakevenYear}.`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 4, fontWeight: 600 }}>
                  Total Savings
                  <InfoTip
                    definition="The total money saved over the hold period by choosing the cheaper option."
                    formula="Total Cost of Renting − Net Cost of Buying"
                  />
                </div>
                <div style={{ fontFamily: FONT.headline, fontSize: 36, fontWeight: 700, color: C.accent }}>{fmt(Math.abs(result.savings))}</div>
              </div>
            </div>
          </div>
        </R>

        {/* METRICS */}
        <R delay={0.25}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 40 }}>
            <MetricCard label="Total Purchase Price" value={fmtFull(result.totalPurchasePrice)}
              sub={`${units} units × ${fmtFull(pricePerUnit)}`}
              definition="The combined purchase price of all units."
              formula="Price per Unit × Number of Units"
            />
            <MetricCard label={`Property Value Yr ${timelineYears}`} value={fmtFull(Math.round(result.saleValue))}
              sub={`${annualAppreciation}% annual growth`}
              definition="Projected market value of all units at the end of the hold period, assuming steady annual appreciation."
              formula="Total Purchase Price × (1 + Appreciation Rate) ^ Hold Period"
            />
            <MetricCard label="Net Cost of Buying" value={fmtFull(Math.round(result.buyNetSpend))} accent
              sub={`${fmtFull(Math.round(result.buyMonthlyCost))}/mo effective`}
              definition="Total out-of-pocket cost of ownership minus the proceeds from selling. A negative number means you walk away with more than you spent."
              formula="Total Spend + Disposal Costs − Sale Value"
            />
            <MetricCard label="Total Cost of Renting" value={fmtFull(Math.round(result.rentNetSpend))}
              sub={`${fmtFull(Math.round(result.rentMonthlyCost))}/mo effective`}
              definition="Total rent paid over the hold period, accounting for annual rent increases, plus the one-time broker fee. No asset is recovered."
              formula="FV of Annual Rent (annuity due) + Broker Fee"
            />
            <MetricCard label="Terminal Equity" value={fmtFull(Math.round(result.terminalValue))} accent
              sub="After disposal costs"
              definition="The net equity you walk away with after selling the property and paying all disposal costs."
              formula="Sale Value − Disposal Costs"
            />
          </div>
        </R>

        {/* CHART TABS */}
        <R delay={0.28}>
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.mid}`, marginBottom: 32 }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "14px 20px", fontSize: 12, fontFamily: FONT.body,
                fontWeight: activeView === tab.id ? 700 : 400,
                color: activeView === tab.id ? C.primary : `${C.text}66`,
                borderBottom: activeView === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1, transition: "all 0.25s ease", letterSpacing: "0.04em",
              }}>{tab.label}</button>
            ))}
          </div>
        </R>

        {/* CHARTS */}
        <R delay={0.3}>
          <div style={{ marginBottom: 56 }}>

            {activeView === "summary" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Cumulative Cost Comparison</div>
                  <div style={{ height: 340 }}>
                    <ResponsiveContainer>
                      <AreaChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.primary} stopOpacity={0.2} /><stop offset="100%" stopColor={C.primary} stopOpacity={0.02} /></linearGradient>
                          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.15} /><stop offset="100%" stopColor={C.accent} stopOpacity={0.02} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
                        <Tooltip content={<SummaryTip />} />
                        <Area type="monotone" dataKey="netBuyCost" stroke={C.primary} fill="url(#bg)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="netRentCost" stroke={C.accent} fill="url(#rg)" strokeWidth={2} dot={false} />
                        {result.breakevenYear && <ReferenceLine x={result.breakevenYear} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} />}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 24, marginTop: 12, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text, opacity: 0.5 }}><div style={{ width: 16, height: 2, background: C.primary }} /> Net Buy Cost</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text, opacity: 0.5 }}><div style={{ width: 16, height: 2, background: C.accent }} /> Rent Cost</div>
                    {result.breakevenYear && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green }}><div style={{ width: 16, height: 2, background: C.green }} /> Breakeven</div>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Equity Growth vs. Rent Expenditure</div>
                  <div style={{ height: 340 }}>
                    <ResponsiveContainer>
                      <AreaChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.2} /><stop offset="100%" stopColor={C.green} stopOpacity={0.02} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
                        <Tooltip content={<EquityTip />} />
                        <Area type="monotone" dataKey="equity" stroke={C.green} fill="url(#eg)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="cumRentSpend" stroke={C.red} fill="none" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 24, marginTop: 12, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green }}><div style={{ width: 16, height: 2, background: C.green }} /> Net Equity</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.red }}><div style={{ width: 16, height: 2, background: C.red }} /> Cumulative Rent</div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "annual" && (
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Year-over-Year Carrying Cost vs. Rent</div>
                <div style={{ height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
                      <Tooltip content={<AnnualTip />} /><Bar dataKey="buyAnnualCost" fill={C.primary} radius={[2, 2, 0, 0]} /><Bar dataKey="rentAnnualCost" fill={C.accent} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 12, justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text, opacity: 0.5 }}><div style={{ width: 12, height: 12, background: C.primary, borderRadius: 2 }} /> Buy (Carrying)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text, opacity: 0.5 }}><div style={{ width: 12, height: 12, background: C.accent, borderRadius: 2 }} /> Rent</div>
                </div>
              </div>
            )}

            {activeView === "cumulative" && (
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Cumulative Spend (Before Asset Recovery)</div>
                <div style={{ height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
                      <Tooltip content={<CumulativeTip />} /><Line type="monotone" dataKey="cumBuySpend" stroke={C.primary} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="cumRentSpend" stroke={C.accent} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="propertyValue" stroke={C.green} strokeWidth={2} strokeDasharray="6 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 12, justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text, opacity: 0.5 }}><div style={{ width: 16, height: 2, background: C.primary }} /> Buy Spend</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text, opacity: 0.5 }}><div style={{ width: 16, height: 2, background: C.accent }} /> Rent Spend</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green }}><div style={{ width: 16, height: 2, background: C.green }} /> Property Value</div>
                </div>
              </div>
            )}

            {activeView === "advantage" && (
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Net Advantage of Buying (Positive = Buy Wins)</div>
                <div style={{ height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={70} />
                      <Tooltip content={<AdvantageTip />} /><ReferenceLine y={0} stroke={C.text} strokeOpacity={0.3} />
                      <Bar dataKey="advantage" radius={[2, 2, 0, 0]}>{result.yearlyData.map((e, i) => <Cell key={i} fill={e.advantage >= 0 ? C.green : C.red} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 12, justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green }}><div style={{ width: 12, height: 12, background: C.green, borderRadius: 2 }} /> Buying saves money</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.red }}><div style={{ width: 12, height: 12, background: C.red, borderRadius: 2 }} /> Renting saves money</div>
                </div>
              </div>
            )}

            {activeView === "taxes" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "stretch" }}>
                {/* LEFT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <TaxBreakdown result={result} />
                  <div style={{ background: C.light, padding: "24px", borderLeft: `3px solid ${C.primary}` }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.primary, marginBottom: 16, fontWeight: 600, opacity: 0.6 }}>
                      Estimated Disposal Costs at Sale
                      <InfoTip definition="Estimated broker and legal fees at the time you sell the property." formula="Disposal Rate × Projected Sale Value" />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.mid}`, fontSize: 13, fontFamily: FONT.body }}>
                      <span style={{ color: C.text, opacity: 0.6 }}>Disposal ({disposalCostPct}% of sale value)</span>
                      <span style={{ color: C.primary, fontWeight: 600 }}>{fmtFull(Math.round(result.totalDisposalCosts))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 4, borderTop: `2px solid ${C.primary}`, fontSize: 14, fontFamily: FONT.body, fontWeight: 700 }}>
                      <span style={{ color: C.primary }}>Total Disposal</span>
                      <span style={{ color: C.primary }}>{fmtFull(Math.round(result.totalDisposalCosts))}</span>
                    </div>
                  </div>
                  <div style={{ background: C.light, padding: "24px", borderLeft: `3px solid ${C.green}`, marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.green, marginBottom: 16, fontWeight: 600 }}>
                      Rent Transaction Costs
                      <InfoTip definition="One-time broker fee paid when signing the lease, based on the first year's annual rent." formula="Rent Broker Rate × Annual Rent" />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, fontFamily: FONT.body }}>
                      <span style={{ color: C.text, opacity: 0.6 }}>Broker Fee ({rentBrokerPct}% of annual rent)</span>
                      <span style={{ color: C.primary, fontWeight: 600 }}>{fmtFull(Math.round(result.rentBrokerFee))}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ background: C.primary, padding: "28px 24px", flex: 1 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 20, fontWeight: 600 }}>NYC Mansion Tax Schedule</div>
                    <div style={{ fontSize: 11, color: C.warm, opacity: 0.5, marginBottom: 16 }}>Applies to purchases of $1,000,000 and above</div>
                    {[
                      { range: "$1,000,000 – $1,999,999", rate: "1.00%", lo: 1e6, hi: 2e6 },
                      { range: "$2,000,000 – $2,999,999", rate: "1.25%", lo: 2e6, hi: 3e6 },
                      { range: "$3,000,000 – $4,999,999", rate: "1.50%", lo: 3e6, hi: 5e6 },
                      { range: "$5,000,000 – $9,999,999", rate: "2.25%", lo: 5e6, hi: 10e6 },
                      { range: "$10,000,000 – $14,999,999", rate: "3.25%", lo: 10e6, hi: 15e6 },
                      { range: "$15,000,000 – $19,999,999", rate: "3.50%", lo: 15e6, hi: 20e6 },
                      { range: "$20,000,000 – $24,999,999", rate: "3.75%", lo: 20e6, hi: 25e6 },
                      { range: "$25,000,000+", rate: "3.90%", lo: 25e6, hi: Infinity },
                    ].map((r, i) => {
                      const tp = pricePerUnit * units;
                      const act = tp >= r.lo && tp < r.hi;
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: act ? `${C.accent}18` : "transparent", borderLeft: act ? `3px solid ${C.accent}` : "3px solid transparent", marginBottom: 2, fontSize: 12, fontFamily: FONT.body, transition: "all 0.25s ease" }}>
                          <span style={{ color: act ? C.canvas : C.warm, opacity: act ? 1 : 0.5 }}>{r.range}</span>
                          <span style={{ color: act ? C.accent : C.warm, fontWeight: act ? 700 : 400, opacity: act ? 1 : 0.5 }}>{r.rate}</span>
                        </div>
                      );
                    })}
                    {result.mansionTax > 0 && (
                      <div style={{ marginTop: 16, padding: "12px", background: `${C.accent}12`, borderTop: `1px solid ${C.accent}33` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                          <span style={{ color: C.accent }}>Your Mansion Tax</span>
                          <span style={{ color: C.accent }}>{fmtFull(Math.round(result.mansionTax))}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ background: C.light, padding: "20px 24px", marginTop: "auto" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 12, fontWeight: 600 }}>Transfer Tax Rates Applied</div>
                    <div style={{ fontSize: 12, color: C.text, opacity: 0.55, lineHeight: 1.7 }}>
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: C.primary, opacity: 1 }}>NYC:</strong>{" "}
                        {propertyType === "condo"
                          ? pricePerUnit * units <= 500000 ? "1.00% (Condo ≤ $500,000)" : "1.425% (Condo > $500,000)"
                          : pricePerUnit * units <= 500000 ? "1.425% (Other ≤ $500,000)" : "2.625% (Other > $500,000)"}
                      </div>
                      <div>
                        <strong style={{ color: C.primary, opacity: 1 }}>NYS:</strong>{" "}
                        {propertyType === "condo"
                          ? pricePerUnit * units < 3000000 ? "0.40% (Condo < $3,000,000)" : "0.65% (Condo ≥ $3,000,000)"
                          : pricePerUnit * units < 2000000 ? "0.40% (Other < $2,000,000)" : "0.65% (Other ≥ $2,000,000)"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </R>

        {/* DATA TABLE */}
        <R delay={0.32}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>Year-by-Year Projection</div>
              <div style={{ flex: 1, height: 1, background: C.mid }} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: FONT.body }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.accent}` }}>
                    {["Year", "Buy Annual", "Rent Annual", "Cum. Buy", "Cum. Rent", "Property Value", "Net Equity", "Advantage"].map((h, i) => (
                      <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "center" : "right", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyData.map((d, i) => (
                    <tr key={d.year} style={{ borderBottom: `1px solid ${C.mid}`, background: i % 2 === 0 ? "transparent" : `${C.light}66` }}>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: C.primary, fontFamily: FONT.headline }}>{d.year}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.text, opacity: 0.7 }}>{fmtFull(d.buyAnnualCost)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.text, opacity: 0.7 }}>{fmtFull(d.rentAnnualCost)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.primary, fontWeight: 600 }}>{fmtFull(d.cumBuySpend)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.accent, fontWeight: 600 }}>{fmtFull(d.cumRentSpend)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.text, opacity: 0.6 }}>{fmtFull(d.propertyValue)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.green, fontWeight: 600 }}>{fmtFull(d.equity)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: d.advantage >= 0 ? C.green : C.red }}>{d.advantage >= 0 ? "+" : ""}{fmtFull(d.advantage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </R>

        {/* DISCLAIMER */}
        <R delay={0.35}>
          <div style={{ padding: "32px 0 56px", borderTop: `1px solid ${C.mid}` }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 12, fontWeight: 600 }}>Disclaimer</div>
            <p style={{ fontSize: 12, lineHeight: 1.8, color: C.text, opacity: 0.4, maxWidth: 700, margin: 0 }}>
              This calculator provides estimates for illustrative purposes only and does not constitute financial, tax, or legal advice. Actual costs will vary based on specific property characteristics, market conditions, financing terms, and individual circumstances. NYC transfer taxes, NYS transfer taxes, and mansion tax rates are based on current published schedules and may change. Consult qualified professionals before making real estate decisions.
            </p>
          </div>
        </R>
      </div>

      {/* FOOTER */}
      <div style={{ background: C.primary, padding: "32px 48px", borderTop: `1px solid ${C.accent}15` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: FONT.headline, fontSize: 14, fontWeight: 700, color: C.canvas, letterSpacing: "0.08em" }}>AABO</span>
            <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Advisory</span>
          </div>
          <div style={{ fontSize: 11, color: C.warm, opacity: 0.3 }}>Sovereign-grade real estate advisory for diplomatic missions in global capitals.</div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const C = {
  primary: "#0F1B2D", secondary: "#1A2D47", text: "#1A1A1A",
  accent: "#B8965A", warm: "#C8B89A", mid: "#E8DFD0",
  light: "#F5F0E8", canvas: "#FAF8F5", green: "#4A7C59", red: "#8B3A3A",
};
const F = { h: "'Playfair Display', Georgia, serif", b: "'DM Sans', sans-serif" };

/* ═══ TAX FUNCTIONS ═══ */
function nycTax(price, propType) {
  const res = propType === "residential";
  if (res) return price <= 500000 ? price * 0.01 : price * 0.01425;
  return price <= 500000 ? price * 0.01425 : price * 0.02625;
}
function nysTax(price, propType) {
  const res = propType === "residential";
  if (res) return price < 3000000 ? price * 0.004 : price * 0.0065;
  return price < 2000000 ? price * 0.004 : price * 0.0065;
}
function mansionTaxUnit(unitPrice) {
  if (unitPrice < 1e6) return 0;
  if (unitPrice < 2e6) return unitPrice * 0.01;
  if (unitPrice < 3e6) return unitPrice * 0.0125;
  if (unitPrice < 5e6) return unitPrice * 0.015;
  if (unitPrice < 10e6) return unitPrice * 0.0225;
  if (unitPrice < 15e6) return unitPrice * 0.0325;
  if (unitPrice < 20e6) return unitPrice * 0.035;
  if (unitPrice < 25e6) return unitPrice * 0.0375;
  return unitPrice * 0.039;
}

/* ═══ CONSTANTS ═══ */
const ACQ_PCT = 0.045;   // 4.5% all-in acquisition
const DISP_PCT = 0.065;  // 6.5% all-in disposal
const MAINT_PCT = 0.05;  // 5% per 10-year cycle
const RENT_BRK_PCT = 0.075; // 7.5% one-time rent broker

/* ═══ CALCULATION ENGINE ═══ */
function calc(p) {
  const tp = p.pricePerUnit * p.units, mo = p.timelineYears * 12;
  const ac = 12 * (p.commonCharges + p.propertyTaxes) * p.units;

  // ACQUISITION: flat 4.5% all-in
  const totalAcq = ACQ_PCT * tp;
  // Informational breakdown within the 4.5%
  const mansionPerUnit = mansionTaxUnit(p.pricePerUnit);
  const mansionTotal = mansionPerUnit * p.units;
  const acqBrokerLegal = Math.max(0, totalAcq - mansionTotal);

  // Maintenance
  const maint = p.units * (MAINT_PCT * p.timelineYears / 10 * p.pricePerUnit);

  // Total spend before sale
  const fvB = ((Math.pow(1 + p.appreciation, p.timelineYears) - 1) / p.appreciation);
  const buyTotal = ac * fvB + tp + maint + totalAcq;

  // Sale
  const sale = tp * Math.pow(1 + p.appreciation, p.timelineYears);

  // DISPOSAL: flat 6.5% all-in
  const totalDisp = DISP_PCT * sale;
  // Informational breakdown within the 6.5%
  const dispNYC = nycTax(sale, p.propType);
  const dispNYS = nysTax(sale, p.propType);
  const dispBrokerLegal = Math.max(0, totalDisp - dispNYC - dispNYS);

  const buyNet = buyTotal + totalDisp - sale;
  const terminal = sale - totalDisp;

  // RENT
  const ar = (p.monthlyRent + p.otherCharges + p.rentTaxes) * p.units * 12;
  const brkFee = RENT_BRK_PCT * ar;
  const fvR = ((Math.pow(1 + p.rentGrowth, p.timelineYears) - 1) / p.rentGrowth) * (1 + p.rentGrowth);
  const rentTotal = ar * fvR + brkFee;

  // Year-by-year
  const yd = [];
  let cumBuy = tp + totalAcq, cumRent = 0;
  for (let y = 1; y <= p.timelineYears; y++) {
    const yc = ac * Math.pow(1 + p.appreciation, y - 1);
    const ym = (y % 10 === 0) ? MAINT_PCT * tp : 0;
    cumBuy += yc + ym;
    const yr = ar * Math.pow(1 + p.rentGrowth, y - 1);
    cumRent += yr;
    const pv = tp * Math.pow(1 + p.appreciation, y);
    const yDisp = DISP_PCT * pv;
    const eq = pv - yDisp;
    const nb = cumBuy + yDisp - pv;
    yd.push({ year: y, buyAnnualCost: Math.round(yc), rentAnnualCost: Math.round(yr),
      cumBuySpend: Math.round(cumBuy), cumRentSpend: Math.round(cumRent),
      propertyValue: Math.round(pv), equity: Math.round(eq),
      netBuyCost: Math.round(nb), netRentCost: Math.round(cumRent),
      advantage: Math.round(cumRent - nb) });
  }

  return {
    propType: p.propType, tp, totalAcq, acqBrokerLegal, mansionPerUnit, mansionTotal,
    maint, buyTotal, sale, totalDisp, dispBrokerLegal, dispNYC, dispNYS,
    buyNet, terminal, ac, ar, brkFee, rentTotal,
    buyMo: buyNet / mo, rentMo: rentTotal / mo,
    savings: rentTotal - buyNet, buyWins: buyNet < rentTotal,
    breakeven: yd.find(d => d.advantage > 0)?.year || null, yd,
  };
}

/* ═══ FORMATTING ═══ */
const $f = n => { const r = Math.round(n), a = Math.abs(r).toLocaleString("en-US"); return r < 0 ? `-$${a}` : `$${a}`; };
const $s = n => { if (Math.abs(n) >= 1e6) { const m = n / 1e6; return `$${m.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`; } return $f(n); };
const fmtIn = n => Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("en-US") : String(n);

/* ═══ COMPONENTS ═══ */
function useReveal() {
  const ref = useRef(null), [v, setV] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.unobserve(el); } }, { threshold: 0.1 }); o.observe(el); return () => o.disconnect(); }, []);
  return [ref, v];
}
function R({ children, delay = 0 }) {
  const [ref, v] = useReveal();
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(24px)", transition: `all 0.6s cubic-bezier(.4,0,.2,1) ${delay}s` }}>{children}</div>;
}

function InfoTip({ definition, formula }) {
  const [show, setShow] = useState(false), [pos, setPos] = useState({ top: 0, left: 0 }), ref = useRef(null);
  const enter = () => { if (ref.current) { const r = ref.current.getBoundingClientRect(); setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(r.left - 120, window.innerWidth - 316)) }); } setShow(true); };
  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", marginLeft: 6, cursor: "help" }} onMouseEnter={enter} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 15, height: 15, borderRadius: "50%", border: `1px solid ${C.warm}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: C.warm, fontFamily: F.b, fontStyle: "italic", opacity: 0.6 }}>i</span>
      {show && <div style={{ position: "fixed", top: pos.top, left: pos.left, width: 300, background: C.primary, color: C.canvas, fontFamily: F.b, zIndex: 10000, boxShadow: `0 12px 40px ${C.primary}70`, border: `1px solid ${C.accent}40`, pointerEvents: "none" }}>
        <div style={{ padding: "14px 16px", fontSize: 12, lineHeight: 1.6 }}>{definition}</div>
        {formula && <div style={{ padding: "12px 16px", fontSize: 11, lineHeight: 1.55, color: C.warm, borderTop: `1px solid ${C.accent}30`, background: `${C.secondary}80` }}>
          <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, fontWeight: 600, display: "block", marginBottom: 4 }}>Calculation</span>{formula}
        </div>}
      </div>}
    </span>
  );
}

function DollarInput({ label, value, onChange, hint }) {
  const [focused, setFocused] = useState(false), [display, setDisplay] = useState(fmtIn(value));
  useEffect(() => { if (!focused) setDisplay(fmtIn(value)); }, [value, focused]);
  return (
    <div style={{ flex: "1 1 180px", minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, opacity: 0.45, marginBottom: 6, fontWeight: 600, fontFamily: F.b }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${focused ? C.accent : C.mid}`, background: C.canvas, transition: "border-color 0.25s", overflow: "hidden" }}>
        <span style={{ padding: "12px 0 12px 14px", fontSize: 14, color: C.warm, fontFamily: F.b }}>$</span>
        <input type="text" inputMode="decimal" value={display}
          onChange={e => { setDisplay(e.target.value); const n = parseFloat(e.target.value.replace(/,/g, "")); if (!isNaN(n)) onChange(n); }}
          onFocus={() => { setFocused(true); setDisplay(String(value)); }} onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", outline: "none", padding: "12px 14px 12px 4px", fontSize: 14, fontFamily: F.b, color: C.text, background: "transparent", width: "100%" }} />
      </div>
      {hint && <div style={{ fontSize: 10, color: C.warm, marginTop: 4, opacity: 0.6 }}>{hint}</div>}
    </div>
  );
}

function NumInput({ label, value, onChange, suffix, min, max, step, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ flex: "1 1 180px", minWidth: 140 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, opacity: 0.45, marginBottom: 6, fontWeight: 600, fontFamily: F.b }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${focused ? C.accent : C.mid}`, background: C.canvas, transition: "border-color 0.25s", overflow: "hidden" }}>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", outline: "none", padding: "12px 14px", fontSize: 14, fontFamily: F.b, color: C.text, background: "transparent", width: "100%" }} />
        {suffix && <span style={{ padding: "12px 14px 12px 0", fontSize: 13, color: C.warm, fontFamily: F.b }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: C.warm, marginTop: 4, opacity: 0.6 }}>{hint}</div>}
    </div>
  );
}

function MetricCard({ label, value, sub, accent, definition, formula }) {
  return (
    <div style={{ padding: "24px 20px", background: accent ? C.primary : C.light, flex: "1 1 200px", minWidth: 180 }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: accent ? C.accent : C.warm, marginBottom: 8, fontWeight: 600, fontFamily: F.b }}>
        {label}{definition && <InfoTip definition={definition} formula={formula} />}
      </div>
      <div style={{ fontFamily: F.h, fontSize: 24, fontWeight: 700, color: accent ? C.canvas : C.primary, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: accent ? C.warm : C.text, opacity: 0.5, marginTop: 6, fontFamily: F.b }}>{sub}</div>}
    </div>
  );
}

function makeTooltip(data, fields) {
  return function Tip({ active, label }) {
    if (!active || label == null) return null;
    const row = data.find(d => d.year === label);
    if (!row) return null;
    return (
      <div style={{ background: C.primary, padding: "16px 20px", border: `1px solid ${C.accent}33`, minWidth: 220, boxShadow: `0 8px 32px ${C.primary}40` }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, marginBottom: 10, fontWeight: 600, fontFamily: F.b }}>Year {label}</div>
        {fields.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "4px 0", fontSize: 13, fontFamily: F.b }}>
            <span style={{ color: C.warm, opacity: 0.7 }}>{f.label}</span>
            <span style={{ color: f.color || C.canvas, fontWeight: 600 }}>{$f(row[f.key])}</span>
          </div>
        ))}
      </div>
    );
  };
}

/* Section divider label */
const SectionLabel = ({ children, color = C.accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color, fontWeight: 700, fontFamily: F.b, whiteSpace: "nowrap" }}>{children}</div>
    <div style={{ flex: 1, height: 1, background: C.mid }} />
  </div>
);

/* ═══════════════════════ MAIN ═══════════════════════ */
export default function AaboBuyVsRent() {
  const [units, setUnits] = useState(9);
  const [pricePerUnit, setPricePerUnit] = useState(2000000);
  const [commonCharges, setCommonCharges] = useState(1200);
  const [propertyTaxes, setPropertyTaxes] = useState(1000);
  const [singleUnitType, setSingleUnitType] = useState("residential");
  const [monthlyRent, setMonthlyRent] = useState(8000);
  const [otherCharges, setOtherCharges] = useState(0);
  const [rentTaxes, setRentTaxes] = useState(0);
  const [timelineYears, setTimelineYears] = useState(16);
  const [appreciation, setAppreciation] = useState(2.5);
  const [rentGrowth, setRentGrowth] = useState(2.75);
  const [activeView, setActiveView] = useState("summary");

  useEffect(() => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap"; document.head.appendChild(l); }, []);

  const propType = units >= 2 ? "commercial" : singleUnitType;
  const propTypeLabel = propType === "residential" ? "Condos, Co-ops & 1–3 Family Houses" : "Commercial & All Other Property";

  const r = useMemo(() => calc({
    units, pricePerUnit, commonCharges, propertyTaxes, monthlyRent, otherCharges, rentTaxes,
    timelineYears, appreciation: appreciation / 100, rentGrowth: rentGrowth / 100, propType,
  }), [units, pricePerUnit, commonCharges, propertyTaxes, monthlyRent, otherCharges, rentTaxes, timelineYears, appreciation, rentGrowth, propType]);

  const ST = useMemo(() => makeTooltip(r.yd, [{ key: "netBuyCost", label: "Net Buy Cost", color: C.canvas }, { key: "netRentCost", label: "Rent Cost", color: C.accent }, { key: "advantage", label: "Buy Advantage", color: C.green }]), [r.yd]);
  const ET = useMemo(() => makeTooltip(r.yd, [{ key: "equity", label: "Net Equity", color: C.green }, { key: "cumRentSpend", label: "Cumulative Rent", color: C.red }]), [r.yd]);
  const AT = useMemo(() => makeTooltip(r.yd, [{ key: "buyAnnualCost", label: "Buy Annual Cost", color: C.canvas }, { key: "rentAnnualCost", label: "Rent Annual Cost", color: C.accent }]), [r.yd]);
  const CT = useMemo(() => makeTooltip(r.yd, [{ key: "cumBuySpend", label: "Cumulative Buy", color: C.canvas }, { key: "cumRentSpend", label: "Cumulative Rent", color: C.accent }, { key: "propertyValue", label: "Property Value", color: C.green }]), [r.yd]);
  const DT = useMemo(() => makeTooltip(r.yd, [{ key: "advantage", label: "Buy Advantage", color: C.accent }, { key: "netBuyCost", label: "Net Buy Cost", color: C.canvas }, { key: "netRentCost", label: "Rent Cost", color: C.warm }]), [r.yd]);

  const tabs = [{ id: "summary", l: "Summary" }, { id: "annual", l: "Annual Costs" }, { id: "cumulative", l: "Cumulative" }, { id: "advantage", l: "Net Advantage" }, { id: "taxes", l: "Tax Detail" }];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: C.canvas, fontFamily: F.b, color: C.text }}>

      {/* HEADER */}
      <div style={{ background: C.primary, padding: "0 48px", borderBottom: `1px solid ${C.accent}25` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: F.h, fontSize: 16, fontWeight: 700, color: C.canvas, letterSpacing: "0.08em" }}>AABO</span>
            <div style={{ width: 1, height: 20, background: `${C.accent}40` }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent, fontWeight: 500 }}>Buy vs. Rent Calculator</span>
          </div>
          <div style={{ fontSize: 10, color: C.warm, opacity: 0.4, letterSpacing: "0.08em" }}>Strategic Housing Advisory</div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>

        {/* TITLE */}
        <R><div style={{ padding: "48px 0 12px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Strategic Housing Advisory · Calculator</div>
          <h1 style={{ fontFamily: F.h, fontSize: 40, fontWeight: 700, color: C.primary, margin: "0 0 12px", lineHeight: 1.15 }}>Buy vs. Rent Analysis</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text, opacity: 0.55, maxWidth: 580, margin: 0 }}>A multi-decade cost comparison incorporating NYC & NYS transfer taxes, mansion tax, transaction costs, and long-term asset appreciation.</p>
        </div></R>
        <div style={{ width: 48, height: 2, background: C.accent, marginBottom: 40 }} />

        {/* ═══ SCENARIO INPUTS ═══ */}
        <R delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 40, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.accent, fontWeight: 700, fontFamily: F.h }}>B</div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: F.h }}>Purchase Scenario</div><div style={{ fontSize: 11, color: C.warm, opacity: 0.6 }}>Acquisition, carrying, and disposal</div></div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <NumInput label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} />
              <DollarInput label="Price per Unit" value={pricePerUnit} onChange={setPricePerUnit} />
              <DollarInput label="Common Charges /mo" value={commonCharges} onChange={setCommonCharges} />
              <DollarInput label="Property Taxes /mo" value={propertyTaxes} onChange={setPropertyTaxes} />
              {/* Property classification: dropdown for 1 unit, auto for 2+ */}
              <div style={{ flex: "1 1 180px", minWidth: 160 }}>
                <label style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, opacity: 0.45, marginBottom: 6, fontWeight: 600, fontFamily: F.b }}>
                  Property Classification
                  <InfoTip definition="New York classifies any transaction involving 2 or more units as commercial. For single-unit purchases, select whether the property is residential or commercial." formula="1 unit = select Residential or Commercial. 2+ units = automatically classified as Commercial & All Other Property." />
                </label>
                {units >= 2 ? (
                  <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", border: `1px solid ${C.mid}`, background: `${C.light}80`, fontSize: 13, fontFamily: F.b, color: C.primary, fontWeight: 600, minHeight: 19 }}>
                    {propTypeLabel}
                  </div>
                ) : (
                  <select value={singleUnitType} onChange={e => setSingleUnitType(e.target.value)}
                    style={{ width: "100%", border: `1px solid ${C.mid}`, background: C.canvas, padding: "12px 14px", fontSize: 13, fontFamily: F.b, color: C.primary, fontWeight: 600, outline: "none", cursor: "pointer", appearance: "auto" }}>
                    <option value="residential">Condos, Co-ops & 1–3 Family</option>
                    <option value="commercial">Commercial & All Other</option>
                  </select>
                )}
              </div>
            </div>
          </div>
          <div style={{ background: C.mid, width: 1 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, background: C.canvas, border: `1.5px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.primary, fontWeight: 700, fontFamily: F.h }}>R</div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: F.h }}>Rental Scenario</div><div style={{ fontSize: 11, color: C.warm, opacity: 0.6 }}>Monthly obligations over time</div></div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <NumInput label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} />
              <DollarInput label="Monthly Rent /unit" value={monthlyRent} onChange={setMonthlyRent} />
              <DollarInput label="Other Charges /mo" value={otherCharges} onChange={setOtherCharges} />
              <DollarInput label="Taxes /mo /unit" value={rentTaxes} onChange={setRentTaxes} />
            </div>
          </div>
        </div></R>

        {/* ═══ TIMELINE — split buy/rent ═══ */}
        <R delay={0.15}><div style={{ background: C.light, padding: "28px 32px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>Timeline & Growth Assumptions</div>
            <div style={{ flex: 1, height: 1, background: C.mid }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 32, alignItems: "start" }}>
            <div>
              <SectionLabel color={C.primary}>Buy Assumptions</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <NumInput label="Hold Period (Years)" value={timelineYears} onChange={setTimelineYears} suffix="yrs" min={1} max={30} step={1} />
                <NumInput label="Annual Appreciation" value={appreciation} onChange={setAppreciation} suffix="%" min={-5} max={15} step={0.25} hint="Property value growth" />
              </div>
            </div>
            <div style={{ background: C.mid, width: 1, alignSelf: "stretch" }} />
            <div>
              <SectionLabel color={C.text}>Rent Assumptions</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <NumInput label="Hold Period (Years)" value={timelineYears} onChange={setTimelineYears} suffix="yrs" min={1} max={30} step={1} />
                <NumInput label="Annual Rent Growth" value={rentGrowth} onChange={setRentGrowth} suffix="%" min={0} max={15} step={0.25} hint="Market rent escalation" />
              </div>
            </div>
          </div>
        </div></R>

        {/* ═══ PRESET TRANSACTION COSTS (info display) ═══ */}
        <R delay={0.18}><div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 40 }}>
          <div style={{ flex: "1 1 200px", padding: "16px 20px", background: C.light, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.warm, fontWeight: 600, fontFamily: F.b }}>
              Acquisition Cost
              <InfoTip definition="All-in buyer cost at purchase, including broker fee (~2.5%), mansion tax (rate varies by unit price), and legal & other fees (~0.75%). This is an average and may vary by deal." formula="4.5% × Total Purchase Price" />
            </div>
            <div style={{ fontFamily: F.h, fontSize: 18, fontWeight: 700, color: C.primary }}>4.50%</div>
          </div>
          <div style={{ flex: "1 1 200px", padding: "16px 20px", background: C.light, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.warm, fontWeight: 600, fontFamily: F.b }}>
              Disposal Cost
              <InfoTip definition="All-in seller cost at sale, including broker commission (~6%), NYC transfer tax, NYS transfer tax, and legal fees. Transfer tax rates vary by property classification and sale price." formula="6.5% × Sale Value at Year of Sale" />
            </div>
            <div style={{ fontFamily: F.h, fontSize: 18, fontWeight: 700, color: C.primary }}>6.50%</div>
          </div>
          <div style={{ flex: "1 1 200px", padding: "16px 20px", background: C.light, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.warm, fontWeight: 600, fontFamily: F.b }}>
              Maintenance Cost
              <InfoTip definition="Capital expenditure reserve for major repairs and renovations, prorated over the hold period." formula="5% of purchase price per 10-year cycle, prorated" />
            </div>
            <div style={{ fontFamily: F.h, fontSize: 18, fontWeight: 700, color: C.primary }}>5.00%</div>
          </div>
          <div style={{ flex: "1 1 200px", padding: "16px 20px", background: C.light, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.warm, fontWeight: 600, fontFamily: F.b }}>
              Rent Broker Fee
              <InfoTip definition="One-time broker fee paid when signing the lease, based on the first year's annual rent." formula="7.5% × Annual Rent" />
            </div>
            <div style={{ fontFamily: F.h, fontSize: 18, fontWeight: 700, color: C.primary }}>7.50%</div>
          </div>
        </div></R>

        {/* ═══ VERDICT ═══ */}
        <R delay={0.2}><div style={{ background: r.buyWins ? C.primary : C.light, padding: "36px 40px", marginBottom: 32, borderLeft: `4px solid ${C.accent}`, position: "relative" }}>
          {r.buyWins && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 20%, ${C.secondary}88 0%, transparent 60%)`, pointerEvents: "none" }} />}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 8, fontWeight: 600 }}>{timelineYears}-Year Verdict</div>
              <div style={{ fontFamily: F.h, fontSize: 28, fontWeight: 700, color: r.buyWins ? C.canvas : C.primary, lineHeight: 1.2 }}>
                {r.buyWins ? "Ownership creates a sovereign advantage." : "Renting is more cost-effective in this scenario."}
              </div>
              <div style={{ fontSize: 14, color: r.buyWins ? C.warm : C.text, opacity: 0.6, marginTop: 8 }}>
                Net savings of {$f(Math.abs(Math.round(r.savings)))} over {timelineYears} years by {r.buyWins ? "buying" : "renting"}.
                {r.breakeven && ` Breakeven at year ${r.breakeven}.`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 4, fontWeight: 600 }}>
                Total Savings<InfoTip definition="The total money saved over the hold period by choosing the cheaper option." formula="Total Cost of Renting − Net Cost of Buying" />
              </div>
              <div style={{ fontFamily: F.h, fontSize: 36, fontWeight: 700, color: C.accent }}>{$s(Math.abs(r.savings))}</div>
            </div>
          </div>
        </div></R>

        {/* ═══ METRICS ═══ */}
        <R delay={0.25}><div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 40 }}>
          <MetricCard label="Total Purchase Price" value={$f(r.tp)} sub={`${units} units × ${$f(pricePerUnit)}`}
            definition="Combined purchase price of all units." formula="Price per Unit × Number of Units" />
          <MetricCard label={`Property Value Yr ${timelineYears}`} value={$f(Math.round(r.sale))} sub={`${appreciation}% annual growth`}
            definition="Projected market value at end of hold period with compound appreciation." formula="Total Purchase Price × (1 + Appreciation)^Years" />
          <MetricCard label="Net Cost of Buying" value={$f(Math.round(r.buyNet))} accent sub={`${$f(Math.round(r.buyMo))}/mo effective`}
            definition="Total ownership costs minus sale proceeds. Negative = net gain." formula="Total Spend + Disposal Costs − Sale Value" />
          <MetricCard label="Total Cost of Renting" value={$f(Math.round(r.rentTotal))} sub={`${$f(Math.round(r.rentMo))}/mo effective`}
            definition="Total rent paid over the hold period with annual escalation, plus broker fee. No asset recovered." formula="FV of Annual Rent (annuity due) + Broker Fee" />
          <MetricCard label="Terminal Equity" value={$f(Math.round(r.terminal))} accent sub="After disposal costs"
            definition="Net equity after selling and paying all disposal costs including transfer taxes." formula="Sale Value − (Broker Fees + NYC Tax + NYS Tax)" />
        </div></R>

        {/* ═══ TABS ═══ */}
        <R delay={0.28}><div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.mid}`, marginBottom: 32 }}>
          {tabs.map(t => <button key={t.id} onClick={() => setActiveView(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "14px 20px", fontSize: 12, fontFamily: F.b, fontWeight: activeView === t.id ? 700 : 400, color: activeView === t.id ? C.primary : `${C.text}66`, borderBottom: activeView === t.id ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1, transition: "all 0.25s", letterSpacing: "0.04em" }}>{t.l}</button>)}
        </div></R>

        {/* ═══ CHARTS ═══ */}
        <R delay={0.3}><div style={{ marginBottom: 56 }}>

          {activeView === "summary" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Cumulative Cost Comparison</div>
              <div style={{ height: 340 }}><ResponsiveContainer><AreaChart data={r.yd} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.primary} stopOpacity={0.2} /><stop offset="100%" stopColor={C.primary} stopOpacity={0.02} /></linearGradient><linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.15} /><stop offset="100%" stopColor={C.accent} stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={$s} width={60} />
                <Tooltip content={<ST />} /><Area type="monotone" dataKey="netBuyCost" stroke={C.primary} fill="url(#bg)" strokeWidth={2} dot={false} /><Area type="monotone" dataKey="netRentCost" stroke={C.accent} fill="url(#rg2)" strokeWidth={2} dot={false} />
                {r.breakeven && <ReferenceLine x={r.breakeven} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} />}
              </AreaChart></ResponsiveContainer></div>
              <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center", fontSize: 11 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, opacity: 0.5 }}><span style={{ width: 16, height: 2, background: C.primary, display: "inline-block" }} /> Net Buy Cost</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, opacity: 0.5 }}><span style={{ width: 16, height: 2, background: C.accent, display: "inline-block" }} /> Rent Cost</span>
                {r.breakeven && <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.green }}><span style={{ width: 16, height: 2, background: C.green, display: "inline-block" }} /> Breakeven</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Equity Growth vs. Rent Expenditure</div>
              <div style={{ height: 340 }}><ResponsiveContainer><AreaChart data={r.yd} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.2} /><stop offset="100%" stopColor={C.green} stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={$s} width={60} />
                <Tooltip content={<ET />} /><Area type="monotone" dataKey="equity" stroke={C.green} fill="url(#eg)" strokeWidth={2} dot={false} /><Area type="monotone" dataKey="cumRentSpend" stroke={C.red} fill="none" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </AreaChart></ResponsiveContainer></div>
              <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center", fontSize: 11 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.green }}><span style={{ width: 16, height: 2, background: C.green, display: "inline-block" }} /> Net Equity</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.red }}><span style={{ width: 16, height: 2, background: C.red, display: "inline-block" }} /> Cumulative Rent</span>
              </div>
            </div>
          </div>}

          {activeView === "annual" && <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Year-over-Year Carrying Cost vs. Rent</div>
            <div style={{ height: 400 }}><ResponsiveContainer><BarChart data={r.yd} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={$s} width={60} />
              <Tooltip content={<AT />} /><Bar dataKey="buyAnnualCost" fill={C.primary} radius={[2,2,0,0]} /><Bar dataKey="rentAnnualCost" fill={C.accent} radius={[2,2,0,0]} />
            </BarChart></ResponsiveContainer></div>
            <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center", fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, opacity: 0.5 }}><span style={{ width: 12, height: 12, background: C.primary, borderRadius: 2, display: "inline-block" }} /> Buy (Carrying)</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, opacity: 0.5 }}><span style={{ width: 12, height: 12, background: C.accent, borderRadius: 2, display: "inline-block" }} /> Rent</span>
            </div>
          </div>}

          {activeView === "cumulative" && <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Cumulative Spend (Before Asset Recovery)</div>
            <div style={{ height: 400 }}><ResponsiveContainer><LineChart data={r.yd} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={$s} width={60} />
              <Tooltip content={<CT />} /><Line type="monotone" dataKey="cumBuySpend" stroke={C.primary} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="cumRentSpend" stroke={C.accent} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="propertyValue" stroke={C.green} strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </LineChart></ResponsiveContainer></div>
            <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center", fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, opacity: 0.5 }}><span style={{ width: 16, height: 2, background: C.primary, display: "inline-block" }} /> Buy Spend</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, opacity: 0.5 }}><span style={{ width: 16, height: 2, background: C.accent, display: "inline-block" }} /> Rent Spend</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.green }}><span style={{ width: 16, height: 2, background: C.green, display: "inline-block" }} /> Property Value</span>
            </div>
          </div>}

          {activeView === "advantage" && <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Net Advantage of Buying (Positive = Buy Wins)</div>
            <div style={{ height: 400 }}><ResponsiveContainer><BarChart data={r.yd} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.mid} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={$s} width={70} />
              <Tooltip content={<DT />} /><ReferenceLine y={0} stroke={C.text} strokeOpacity={0.3} />
              <Bar dataKey="advantage" radius={[2,2,0,0]}>{r.yd.map((e,i) => <Cell key={i} fill={e.advantage >= 0 ? C.green : C.red} />)}</Bar>
            </BarChart></ResponsiveContainer></div>
            <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center", fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.green }}><span style={{ width: 12, height: 12, background: C.green, borderRadius: 2, display: "inline-block" }} /> Buying saves money</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.red }}><span style={{ width: 12, height: 12, background: C.red, borderRadius: 2, display: "inline-block" }} /> Renting saves money</span>
            </div>
          </div>}

          {activeView === "taxes" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "stretch" }}>
            {/* LEFT: Acquisition + Rent Costs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: C.light, padding: "24px", borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 4, fontWeight: 600, fontFamily: F.b }}>
                  Acquisition Cost Breakdown
                  <InfoTip definition="Costs paid by the buyer at time of purchase: broker fee, legal fees, and mansion tax calculated per-unit." formula="(Broker % + Legal %) × Total Price + Mansion Tax per unit × Units" />
                </div>
                <div style={{ fontSize: 11, color: C.text, opacity: 0.35, marginBottom: 14 }}>Buyer-side costs at purchase</div>
                {[
                  { l: "Broker & Legal (est.)", v: r.acqBrokerLegal },
                  { l: `Mansion Tax (${units} × ${$f(r.mansionPerUnit)})`, v: r.mansionTotal, hl: r.mansionTotal > 0 },
                ].map((x, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 1 ? `1px solid ${C.mid}` : "none", fontSize: 13, fontFamily: F.b }}>
                    <span style={{ color: C.text, opacity: 0.6 }}>{x.l}</span>
                    <span style={{ color: x.hl ? C.accent : C.primary, fontWeight: x.hl ? 700 : 600 }}>{$f(x.v)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 4, borderTop: `2px solid ${C.accent}`, fontSize: 14, fontWeight: 700 }}>
                  <span style={{ color: C.primary }}>Total Acquisition</span><span style={{ color: C.primary }}>{$f(r.totalAcq)}</span>
                </div>
              </div>

              <div style={{ background: C.light, padding: "24px", borderLeft: `3px solid ${C.primary}` }}>
                <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.primary, marginBottom: 4, fontWeight: 600, opacity: 0.6 }}>
                  Disposal Cost Breakdown
                  <InfoTip definition="Costs at time of sale: broker/legal fees plus NYC and NYS transfer taxes on the sale value." formula="Broker % × Sale Value + NYC Transfer Tax + NYS Transfer Tax" />
                </div>
                <div style={{ fontSize: 11, color: C.text, opacity: 0.35, marginBottom: 14 }}>Seller-side costs at year {timelineYears} sale</div>
                {[
                  { l: "Broker & Legal (est.)", v: r.dispBrokerLegal },
                  { l: "NYC Transfer Tax", v: r.dispNYC },
                  { l: "NYS Transfer Tax", v: r.dispNYS },
                ].map((x, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.mid}` : "none", fontSize: 13, fontFamily: F.b }}>
                    <span style={{ color: C.text, opacity: 0.6 }}>{x.l}</span>
                    <span style={{ color: C.primary, fontWeight: 600 }}>{$f(Math.round(x.v))}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 4, borderTop: `2px solid ${C.primary}`, fontSize: 14, fontWeight: 700 }}>
                  <span style={{ color: C.primary }}>Total Disposal</span><span style={{ color: C.primary }}>{$f(Math.round(r.totalDisp))}</span>
                </div>
              </div>

              <div style={{ background: C.light, padding: "24px", borderLeft: `3px solid ${C.green}`, marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.green, marginBottom: 16, fontWeight: 600 }}>
                  Rent Transaction Costs
                  <InfoTip definition="One-time broker fee paid when signing the lease." formula="Rent Broker Rate × Annual Rent" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, fontFamily: F.b }}>
                  <span style={{ color: C.text, opacity: 0.6 }}>Broker Fee (7.5% of {$f(Math.round(r.ar))}/yr)</span>
                  <span style={{ color: C.primary, fontWeight: 600 }}>{$f(Math.round(r.brkFee))}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Mansion Tax Schedule + Transfer Rates */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: C.primary, padding: "28px 24px", flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 8, fontWeight: 600 }}>NYC Mansion Tax Schedule</div>
                <div style={{ fontSize: 11, color: C.warm, opacity: 0.5, marginBottom: 16 }}>Applied per unit at {$f(pricePerUnit)}/unit × {units} units</div>
                {[
                  { range: "$1,000,000 – $1,999,999", rate: "1.00%", lo: 1e6, hi: 2e6 },
                  { range: "$2,000,000 – $2,999,999", rate: "1.25%", lo: 2e6, hi: 3e6 },
                  { range: "$3,000,000 – $4,999,999", rate: "1.50%", lo: 3e6, hi: 5e6 },
                  { range: "$5,000,000 – $9,999,999", rate: "2.25%", lo: 5e6, hi: 10e6 },
                  { range: "$10,000,000 – $14,999,999", rate: "3.25%", lo: 10e6, hi: 15e6 },
                  { range: "$15,000,000 – $19,999,999", rate: "3.50%", lo: 15e6, hi: 20e6 },
                  { range: "$20,000,000 – $24,999,999", rate: "3.75%", lo: 20e6, hi: 25e6 },
                  { range: "$25,000,000+", rate: "3.90%", lo: 25e6, hi: Infinity },
                ].map((x, i) => {
                  const act = pricePerUnit >= x.lo && pricePerUnit < x.hi;
                  return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: act ? `${C.accent}18` : "transparent", borderLeft: act ? `3px solid ${C.accent}` : "3px solid transparent", marginBottom: 2, fontSize: 12, fontFamily: F.b, transition: "all 0.25s" }}>
                    <span style={{ color: act ? C.canvas : C.warm, opacity: act ? 1 : 0.5 }}>{x.range}</span>
                    <span style={{ color: act ? C.accent : C.warm, fontWeight: act ? 700 : 400, opacity: act ? 1 : 0.5 }}>{x.rate}</span>
                  </div>;
                })}
                {r.mansionTotal > 0 && <div style={{ marginTop: 16, padding: "12px", background: `${C.accent}12`, borderTop: `1px solid ${C.accent}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: C.accent }}>Your Mansion Tax ({units} units)</span><span style={{ color: C.accent }}>{$f(Math.round(r.mansionTotal))}</span>
                  </div>
                </div>}
              </div>
              <div style={{ background: C.light, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 12, fontWeight: 600 }}>
                  Transfer Tax Rates (Disposal)
                  <InfoTip definition="NYC and NYS transfer taxes are paid by the seller at time of sale. Rates vary by sale price and property classification." />
                </div>
                <div style={{ fontSize: 12, color: C.text, opacity: 0.55, lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 4, fontSize: 11, color: C.accent, fontWeight: 600, opacity: 0.7 }}>{propTypeLabel}</div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: C.primary }}>NYC:</strong>{" "}
                    {propType === "residential"
                      ? r.sale <= 500000 ? "1.00% (≤ $500,000)" : "1.425% (> $500,000)"
                      : r.sale <= 500000 ? "1.425% (≤ $500,000)" : "2.625% (> $500,000)"}
                  </div>
                  <div>
                    <strong style={{ color: C.primary }}>NYS:</strong>{" "}
                    {propType === "residential"
                      ? r.sale < 3000000 ? "0.40% (< $3,000,000)" : "0.65% (≥ $3,000,000)"
                      : r.sale < 2000000 ? "0.40% (< $2,000,000)" : "0.65% (≥ $2,000,000)"}
                  </div>
                </div>
              </div>
            </div>
          </div>}

        </div></R>

        {/* ═══ TABLE ═══ */}
        <R delay={0.32}><div style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>Year-by-Year Projection</div>
            <div style={{ flex: 1, height: 1, background: C.mid }} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: F.b }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.accent}` }}>
                {["Year","Buy Annual","Rent Annual","Cum. Buy","Cum. Rent","Property Value","Net Equity","Advantage"].map((h,i) =>
                  <th key={i} style={{ padding: "10px 12px", textAlign: i===0?"center":"right", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}
              </tr></thead>
              <tbody>{r.yd.map((d,i) =>
                <tr key={d.year} style={{ borderBottom: `1px solid ${C.mid}`, background: i%2===0?"transparent":`${C.light}66` }}>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: C.primary, fontFamily: F.h }}>{d.year}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.text, opacity: 0.7 }}>{$f(d.buyAnnualCost)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.text, opacity: 0.7 }}>{$f(d.rentAnnualCost)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.primary, fontWeight: 600 }}>{$f(d.cumBuySpend)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.accent, fontWeight: 600 }}>{$f(d.cumRentSpend)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.text, opacity: 0.6 }}>{$f(d.propertyValue)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.green, fontWeight: 600 }}>{$f(d.equity)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: d.advantage>=0?C.green:C.red }}>{d.advantage>=0?"+":""}{$f(d.advantage)}</td>
                </tr>
              )}</tbody>
            </table>
          </div>
        </div></R>

        {/* DISCLAIMER */}
        <R delay={0.35}><div style={{ padding: "32px 0 56px", borderTop: `1px solid ${C.mid}` }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 12, fontWeight: 600 }}>Disclaimer</div>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: C.text, opacity: 0.4, maxWidth: 700, margin: 0 }}>This calculator provides estimates for illustrative purposes only and does not constitute financial, tax, or legal advice. Actual costs will vary based on specific property characteristics, market conditions, financing terms, and individual circumstances. NYC transfer taxes, NYS transfer taxes, and mansion tax rates are based on current published schedules and may change. Consult qualified professionals before making real estate decisions.</p>
        </div></R>
      </div>

      {/* FOOTER */}
      <div style={{ background: C.primary, padding: "32px 48px", borderTop: `1px solid ${C.accent}15` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: F.h, fontSize: 14, fontWeight: 700, color: C.canvas, letterSpacing: "0.08em" }}>AABO</span>
            <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Advisory</span>
          </div>
          <div style={{ fontSize: 11, color: C.warm, opacity: 0.3 }}>Sovereign-grade real estate advisory for diplomatic missions in global capitals.</div>
        </div>
      </div>
    </div>
  );
}

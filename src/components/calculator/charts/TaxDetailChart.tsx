import type { CalcResult } from "../engine";
import { fmtFull } from "../formatters";
import TaxBreakdown from "../results/TaxBreakdown";
import InfoTip from "../results/InfoTip";

interface Props {
  result: CalcResult;
  pricePerUnit: number;
  units: number;
  propType: string;
  timelineYears: number;
  acqPct: number;
  dispPct: number;
  rentBrkPct: number;
}

const MANSION_SCHEDULE = [
  { range: "$1,000,000 – $1,999,999", rate: "1.00%", lo: 1e6, hi: 2e6 },
  { range: "$2,000,000 – $2,999,999", rate: "1.25%", lo: 2e6, hi: 3e6 },
  { range: "$3,000,000 – $4,999,999", rate: "1.50%", lo: 3e6, hi: 5e6 },
  { range: "$5,000,000 – $9,999,999", rate: "2.25%", lo: 5e6, hi: 10e6 },
  { range: "$10,000,000 – $14,999,999", rate: "3.25%", lo: 10e6, hi: 15e6 },
  { range: "$15,000,000 – $19,999,999", rate: "3.50%", lo: 15e6, hi: 20e6 },
  { range: "$20,000,000 – $24,999,999", rate: "3.75%", lo: 20e6, hi: 25e6 },
  { range: "$25,000,000+", rate: "3.90%", lo: 25e6, hi: Infinity },
];

export default function TaxDetailChart({ result, pricePerUnit, units, propType, timelineYears, acqPct, dispPct, rentBrkPct }: Props) {
  const propTypeLabel = propType === "residential"
    ? "Condos, Co-ops & 1\u20133 Family Houses"
    : "Commercial & All Other Property";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        <TaxBreakdown result={result} units={units} acqPct={acqPct} />

        {/* Disposal Cost Breakdown */}
        <div className="bg-light p-6 border-l-[3px] border-primary">
          <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-primary/60 mb-1 font-semibold">
            Disposal Cost Breakdown
            <InfoTip
              definition="Seller-side costs when you sell the property, including broker/legal fees and NYC/NYS transfer taxes."
              formula={`Total Disposal = ${dispPct.toFixed(2)}% \u00d7 Projected Sale Value`}
            />
          </div>
          <div className="text-[11px] text-text/35 mb-3.5 font-body">
            Seller-side costs at year {timelineYears} sale
          </div>
          {[
            { label: "Broker & Legal (est.)", value: result.dispBrokerLegal },
            { label: "NYC Transfer Tax", value: result.dispNYC },
            { label: "NYS Transfer Tax", value: result.dispNYS },
          ].map((r, i, arr) => (
            <div
              key={i}
              className={`flex justify-between py-2 text-[13px] font-body ${i < arr.length - 1 ? "border-b border-mid" : ""}`}
            >
              <span className="text-text/60">{r.label}</span>
              <span className="text-primary font-semibold">{fmtFull(Math.round(r.value))}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-1 border-t-2 border-primary text-sm font-body font-bold">
            <span className="text-primary">Total Disposal</span>
            <span className="text-primary">{fmtFull(Math.round(result.totalDisp))}</span>
          </div>
        </div>

        {/* Rent Broker */}
        <div className="bg-light p-6 border-l-[3px] border-green mt-auto">
          <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-green mb-4 font-semibold">
            Rent Transaction Costs
            <InfoTip definition="One-time broker fee paid when signing the lease, based on the first year's annual rent." formula={`${rentBrkPct.toFixed(1)}% \u00d7 Annual Rent`} />
          </div>
          <div className="flex justify-between py-2 text-[13px] font-body">
            <span className="text-text/60">Broker Fee ({rentBrkPct.toFixed(1)}% of {fmtFull(Math.round(result.annualRentCost))}/yr)</span>
            <span className="text-primary font-semibold">{fmtFull(Math.round(result.rentBrokerFee))}</span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <div className="bg-primary p-6 sm:p-7 flex-1">
          <div className="text-[10px] tracking-[0.15em] uppercase text-accent mb-1 font-semibold">NYC Mansion Tax Schedule</div>
          <div className="text-[11px] text-warm/50 mb-4">
            Applied per unit at {fmtFull(pricePerUnit)}/unit \u00d7 {units} units
          </div>
          {MANSION_SCHEDULE.map((r, i) => {
            const act = pricePerUnit >= r.lo && pricePerUnit < r.hi;
            return (
              <div
                key={i}
                className={`flex justify-between py-2 px-3 mb-0.5 text-xs font-body transition-all duration-[250ms] ${act ? "bg-accent/10 border-l-[3px] border-accent" : "border-l-[3px] border-transparent"}`}
              >
                <span className={act ? "text-canvas" : "text-warm/50"}>{r.range}</span>
                <span className={act ? "text-accent font-bold" : "text-warm/50"}>{r.rate}</span>
              </div>
            );
          })}
          {result.mansionTotal > 0 && (
            <div className="mt-4 p-3 bg-accent/[0.07] border-t border-accent/20">
              <div className="flex justify-between text-[13px] font-bold">
                <span className="text-accent">Your Mansion Tax ({units} units)</span>
                <span className="text-accent">{fmtFull(Math.round(result.mansionTotal))}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-light p-5 sm:p-6 mt-auto">
          <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-accent mb-1 font-semibold">
            Transfer Tax Rates (Disposal)
            <InfoTip
              definition="NYC and NYS transfer taxes are paid by the seller at the time of sale. Rates depend on property classification and sale price."
              formula="Applied to projected sale value at disposal"
            />
          </div>
          <div className="text-[11px] text-text/35 mb-3 font-body">{propTypeLabel}</div>
          <div className="text-xs text-text/55 leading-[1.7]">
            <div className="mb-2">
              <strong className="text-primary">NYC:</strong>{" "}
              {propType === "residential"
                ? result.saleValue <= 500000 ? "1.00% (Residential \u2264 $500,000)" : "1.425% (Residential > $500,000)"
                : result.saleValue <= 500000 ? "1.425% (Commercial \u2264 $500,000)" : "2.625% (Commercial > $500,000)"}
            </div>
            <div>
              <strong className="text-primary">NYS:</strong>{" "}
              {propType === "residential"
                ? result.saleValue < 3000000 ? "0.40% (Residential < $3,000,000)" : "0.65% (Residential \u2265 $3,000,000)"
                : result.saleValue < 2000000 ? "0.40% (Commercial < $2,000,000)" : "0.65% (Commercial \u2265 $2,000,000)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { CalcResult } from "../engine";
import { fmtFull } from "../formatters";
import TaxBreakdown from "../results/TaxBreakdown";
import InfoTip from "../results/InfoTip";

interface Props {
  result: CalcResult;
  pricePerUnit: number;
  units: number;
  propertyType: string;
  disposalCostPct: number;
  rentBrokerPct: number;
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

export default function TaxDetailChart({ result, pricePerUnit, units, propertyType, disposalCostPct, rentBrokerPct }: Props) {
  const tp = pricePerUnit * units;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        <TaxBreakdown result={result} />

        <div className="bg-light p-6 border-l-[3px] border-primary">
          <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-primary/60 mb-4 font-semibold">
            Estimated Disposal Costs at Sale
            <InfoTip definition="Estimated broker and legal fees at the time you sell the property." formula="Disposal Rate × Projected Sale Value" />
          </div>
          <div className="flex justify-between py-2 border-b border-mid text-[13px] font-body">
            <span className="text-text/60">Disposal ({disposalCostPct}% of sale value)</span>
            <span className="text-primary font-semibold">{fmtFull(Math.round(result.totalDisposalCosts))}</span>
          </div>
          <div className="flex justify-between pt-3 mt-1 border-t-2 border-primary text-sm font-body font-bold">
            <span className="text-primary">Total Disposal</span>
            <span className="text-primary">{fmtFull(Math.round(result.totalDisposalCosts))}</span>
          </div>
        </div>

        <div className="bg-light p-6 border-l-[3px] border-green mt-auto">
          <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-green mb-4 font-semibold">
            Rent Transaction Costs
            <InfoTip definition="One-time broker fee paid when signing the lease, based on the first year's annual rent." formula="Rent Broker Rate × Annual Rent" />
          </div>
          <div className="flex justify-between py-2 text-[13px] font-body">
            <span className="text-text/60">Broker Fee ({rentBrokerPct}% of annual rent)</span>
            <span className="text-primary font-semibold">{fmtFull(Math.round(result.rentBrokerFee))}</span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <div className="bg-primary p-6 sm:p-7 flex-1">
          <div className="text-[10px] tracking-[0.15em] uppercase text-accent mb-5 font-semibold">NYC Mansion Tax Schedule</div>
          <div className="text-[11px] text-warm/50 mb-4">Applies to purchases of $1,000,000 and above</div>
          {MANSION_SCHEDULE.map((r, i) => {
            const act = tp >= r.lo && tp < r.hi;
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
          {result.mansionTax > 0 && (
            <div className="mt-4 p-3 bg-accent/[0.07] border-t border-accent/20">
              <div className="flex justify-between text-[13px] font-bold">
                <span className="text-accent">Your Mansion Tax</span>
                <span className="text-accent">{fmtFull(Math.round(result.mansionTax))}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-light p-5 sm:p-6 mt-auto">
          <div className="text-[10px] tracking-[0.15em] uppercase text-accent mb-3 font-semibold">Transfer Tax Rates Applied</div>
          <div className="text-xs text-text/55 leading-[1.7]">
            <div className="mb-2">
              <strong className="text-primary">NYC:</strong>{" "}
              {propertyType === "condo"
                ? tp <= 500000 ? "1.00% (Condo ≤ $500,000)" : "1.425% (Condo > $500,000)"
                : tp <= 500000 ? "1.425% (Other ≤ $500,000)" : "2.625% (Other > $500,000)"}
            </div>
            <div>
              <strong className="text-primary">NYS:</strong>{" "}
              {propertyType === "condo"
                ? tp < 3000000 ? "0.40% (Condo < $3,000,000)" : "0.65% (Condo ≥ $3,000,000)"
                : tp < 2000000 ? "0.40% (Other < $2,000,000)" : "0.65% (Other ≥ $2,000,000)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

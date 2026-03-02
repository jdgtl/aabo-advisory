import type { CalcResult } from "../engine";
import { fmtFull } from "../formatters";
import InfoTip from "./InfoTip";

interface Props {
  result: CalcResult;
  units: number;
}

export default function TaxBreakdown({ result, units }: Props) {
  const rows = [
    { label: "Broker & Legal (est.)", value: result.acqBrokerLegal, highlight: false },
    {
      label: `Mansion Tax (${units} \u00d7 ${fmtFull(result.mansionPerUnit)})`,
      value: result.mansionTotal,
      highlight: result.mansionTotal > 0,
    },
  ];

  return (
    <div className="bg-light p-6 border-l-[3px] border-accent">
      <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-accent mb-1 font-semibold font-body">
        Acquisition Cost Breakdown
        <InfoTip
          definition="Buyer-side costs at purchase, including estimated broker/legal fees and NYC mansion tax applied per unit (per deed)."
          formula="Total Acquisition = 4.50% × Total Purchase Price"
        />
      </div>
      <div className="text-[11px] text-text/35 mb-3.5 font-body">
        Buyer-side costs at purchase
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex justify-between py-2 text-[13px] font-body ${i < rows.length - 1 ? "border-b border-mid" : ""}`}
        >
          <span className="text-text/60">{r.label}</span>
          <span className={r.highlight ? "text-accent font-bold" : "text-primary font-semibold"}>
            {fmtFull(r.value)}
          </span>
        </div>
      ))}
      <div className="flex justify-between pt-3 mt-1 border-t-2 border-accent text-sm font-body font-bold">
        <span className="text-primary">Total Acquisition</span>
        <span className="text-primary">{fmtFull(result.totalAcq)}</span>
      </div>
    </div>
  );
}

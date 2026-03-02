import type { CalcResult } from "../engine";
import { fmtFull } from "../formatters";
import InfoTip from "./InfoTip";

interface Props {
  result: CalcResult;
}

export default function TaxBreakdown({ result }: Props) {
  const rows = [
    { label: "NYC Transfer Tax", value: result.nycTransferTax, highlight: false },
    { label: "NYS Transfer Tax", value: result.nysTransferTax, highlight: false },
    { label: "Mansion Tax", value: result.mansionTax, highlight: result.mansionTax > 0 },
    { label: "Broker & Legal (est.)", value: result.closingCosts, highlight: false },
  ];

  return (
    <div className="bg-light p-6 border-l-[3px] border-accent">
      <div className="flex items-center text-[10px] tracking-[0.15em] uppercase text-accent mb-1 font-semibold font-body">
        Acquisition Cost Breakdown
        <InfoTip
          definition="Estimated split of your all-in acquisition rate between statutory taxes and broker/legal fees."
          formula="Total Acquisition = Acquisition Rate × Total Purchase Price"
        />
      </div>
      <div className="text-[11px] text-text/35 mb-3.5 font-body">
        Components within the all-in acquisition rate
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
        <span className="text-primary">{fmtFull(result.totalAcquisitionCosts)}</span>
      </div>
    </div>
  );
}

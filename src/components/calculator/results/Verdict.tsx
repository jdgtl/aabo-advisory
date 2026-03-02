import type { CalcResult } from "../engine";
import { fmt, fmtFull } from "../formatters";
import InfoTip from "./InfoTip";

interface Props {
  result: CalcResult;
  timelineYears: number;
}

export default function Verdict({ result, timelineYears }: Props) {
  return (
    <div
      className={`relative p-7 sm:px-10 mb-8 border-l-4 border-accent ${result.buyWins ? "bg-primary" : "bg-light"}`}
    >
      {result.buyWins && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,#1A2D4788_0%,transparent_60%)] pointer-events-none" />
      )}
      <div className="relative z-[1] flex items-center justify-between flex-wrap gap-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
            {timelineYears}-Year Verdict
          </div>
          <div
            className={`font-heading text-xl sm:text-[28px] font-bold leading-[1.2] ${result.buyWins ? "text-canvas" : "text-primary"}`}
          >
            {result.buyWins
              ? "Ownership creates a sovereign advantage."
              : "Renting is more cost-effective in this scenario."}
          </div>
          <div
            className={`text-sm mt-2 opacity-60 ${result.buyWins ? "text-warm" : "text-text"}`}
          >
            Net savings of {fmtFull(Math.abs(Math.round(result.savings)))} over {timelineYears} years
            by {result.buyWins ? "buying" : "renting"}.
            {result.breakeven != null && ` Breakeven at year ${result.breakeven}.`}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end text-[10px] tracking-[0.12em] uppercase text-accent mb-1 font-semibold">
            Total Savings
            <InfoTip
              definition="The total money saved over the hold period by choosing the cheaper option."
              formula="Total Cost of Renting − Net Cost of Buying"
            />
          </div>
          <div className="font-heading text-4xl font-bold text-accent">
            {fmt(Math.abs(result.savings))}
          </div>
        </div>
      </div>
    </div>
  );
}

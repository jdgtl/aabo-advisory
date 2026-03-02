import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { CalcResult } from "../engine";
import { fmt } from "../formatters";
import { makeTooltip } from "./ChartTooltip";

const C = { primary: "#0F1B2D", accent: "#B8965A", warm: "#C8B89A", mid: "#E8DFD0", green: "#4A7C59" };

interface Props {
  result: CalcResult;
}

export default function CumulativeChart({ result }: Props) {
  const CumulativeTip = useMemo(
    () => makeTooltip(result.yearlyData, [
      { key: "cumBuySpend", label: "Cumulative Buy", color: "#FAF8F5" },
      { key: "cumRentSpend", label: "Cumulative Rent", color: C.accent },
      { key: "propertyValue", label: "Property Value", color: C.green },
    ]),
    [result.yearlyData],
  );

  return (
    <div>
      <div className="text-[11px] tracking-[0.12em] uppercase text-accent mb-4 font-semibold">
        Cumulative Spend (Before Asset Recovery)
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer>
          <LineChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.mid} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
            <Tooltip content={<CumulativeTip />} />
            <Line type="monotone" dataKey="cumBuySpend" stroke={C.primary} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="cumRentSpend" stroke={C.accent} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="propertyValue" stroke={C.green} strokeWidth={2} strokeDasharray="6 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-text/50"><div className="w-4 h-0.5 bg-primary" /> Buy Spend</div>
        <div className="flex items-center gap-1.5 text-[11px] text-text/50"><div className="w-4 h-0.5 bg-accent" /> Rent Spend</div>
        <div className="flex items-center gap-1.5 text-[11px] text-green"><div className="w-4 h-0.5 bg-green" /> Property Value</div>
      </div>
    </div>
  );
}

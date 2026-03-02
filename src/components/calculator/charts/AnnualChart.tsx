import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { CalcResult } from "../engine";
import { fmt } from "../formatters";
import { makeTooltip } from "./ChartTooltip";

const C = { primary: "#0F1B2D", accent: "#B8965A", warm: "#C8B89A", mid: "#E8DFD0" };

interface Props {
  result: CalcResult;
}

export default function AnnualChart({ result }: Props) {
  const AnnualTip = useMemo(
    () => makeTooltip(result.yearlyData, [
      { key: "buyAnnualCost", label: "Buy Annual Cost", color: "#FAF8F5" },
      { key: "rentAnnualCost", label: "Rent Annual Cost", color: C.accent },
    ]),
    [result.yearlyData],
  );

  return (
    <div>
      <div className="text-[11px] tracking-[0.12em] uppercase text-accent mb-4 font-semibold">
        Year-over-Year Carrying Cost vs. Rent
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer>
          <BarChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.mid} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
            <Tooltip content={<AnnualTip />} />
            <Bar dataKey="buyAnnualCost" fill={C.primary} radius={[2, 2, 0, 0]} />
            <Bar dataKey="rentAnnualCost" fill={C.accent} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-text/50">
          <div className="w-3 h-3 bg-primary rounded-sm" /> Buy (Carrying)
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text/50">
          <div className="w-3 h-3 bg-accent rounded-sm" /> Rent
        </div>
      </div>
    </div>
  );
}

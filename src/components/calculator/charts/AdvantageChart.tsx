import { useMemo } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { CalcResult } from "../engine";
import { fmt } from "../formatters";
import { makeTooltip } from "./ChartTooltip";

const C = { primary: "#0F1B2D", accent: "#B8965A", warm: "#C8B89A", mid: "#E8DFD0", green: "#4A7C59", red: "#8B3A3A" };

interface Props {
  result: CalcResult;
}

export default function AdvantageChart({ result }: Props) {
  const AdvantageTip = useMemo(
    () => makeTooltip(result.yearlyData, [
      { key: "advantage", label: "Buy Advantage", color: C.accent },
      { key: "netBuyCost", label: "Net Buy Cost", color: "#FAF8F5" },
      { key: "netRentCost", label: "Rent Cost", color: C.warm },
    ]),
    [result.yearlyData],
  );

  return (
    <div>
      <div className="text-[11px] tracking-[0.12em] uppercase text-accent mb-4 font-semibold">
        Net Advantage of Buying (Positive = Buy Wins)
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer>
          <BarChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.mid} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={70} />
            <Tooltip content={<AdvantageTip />} />
            <ReferenceLine y={0} stroke={C.primary} strokeOpacity={0.3} />
            <Bar dataKey="advantage" radius={[2, 2, 0, 0]}>
              {result.yearlyData.map((e, i) => (
                <Cell key={i} fill={e.advantage >= 0 ? C.green : C.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-green">
          <div className="w-3 h-3 bg-green rounded-sm" /> Buying saves money
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-red">
          <div className="w-3 h-3 bg-red rounded-sm" /> Renting saves money
        </div>
      </div>
    </div>
  );
}

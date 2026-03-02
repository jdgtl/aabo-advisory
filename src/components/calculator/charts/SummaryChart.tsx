import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { CalcResult } from "../engine";
import { fmt } from "../formatters";
import { makeTooltip } from "./ChartTooltip";

const C = { primary: "#0F1B2D", accent: "#B8965A", warm: "#C8B89A", mid: "#E8DFD0", green: "#4A7C59", red: "#8B3A3A", canvas: "#FAF8F5" };

interface Props {
  result: CalcResult;
}

export default function SummaryChart({ result }: Props) {
  const SummaryTip = useMemo(
    () => makeTooltip(result.yearlyData, [
      { key: "netBuyCost", label: "Net Buy Cost", color: C.canvas },
      { key: "netRentCost", label: "Rent Cost", color: C.accent },
      { key: "advantage", label: "Buy Advantage", color: C.green },
    ]),
    [result.yearlyData],
  );
  const EquityTip = useMemo(
    () => makeTooltip(result.yearlyData, [
      { key: "equity", label: "Net Equity", color: C.green },
      { key: "cumRentSpend", label: "Cumulative Rent", color: C.red },
    ]),
    [result.yearlyData],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Cost Comparison */}
      <div>
        <div className="text-[11px] tracking-[0.12em] uppercase text-accent mb-4 font-semibold">
          Cumulative Cost Comparison
        </div>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <AreaChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.primary} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.primary} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.mid} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
              <Tooltip content={<SummaryTip />} />
              <Area type="monotone" dataKey="netBuyCost" stroke={C.primary} fill="url(#bg)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="netRentCost" stroke={C.accent} fill="url(#rg)" strokeWidth={2} dot={false} />
              {result.breakeven && (
                <ReferenceLine x={result.breakeven} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-[11px] text-text/50"><div className="w-4 h-0.5 bg-primary" /> Net Buy Cost</div>
          <div className="flex items-center gap-1.5 text-[11px] text-text/50"><div className="w-4 h-0.5 bg-accent" /> Rent Cost</div>
          {result.breakeven && (
            <div className="flex items-center gap-1.5 text-[11px] text-green"><div className="w-4 h-0.5 bg-green" /> Breakeven</div>
          )}
        </div>
      </div>

      {/* Equity Growth */}
      <div>
        <div className="text-[11px] tracking-[0.12em] uppercase text-accent mb-4 font-semibold">
          Equity Growth vs. Rent Expenditure
        </div>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <AreaChart data={result.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.mid} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.warm }} axisLine={{ stroke: C.mid }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.warm }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
              <Tooltip content={<EquityTip />} />
              <Area type="monotone" dataKey="equity" stroke={C.green} fill="url(#eg)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cumRentSpend" stroke={C.red} fill="none" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-[11px] text-green"><div className="w-4 h-0.5 bg-green" /> Net Equity</div>
          <div className="flex items-center gap-1.5 text-[11px] text-red"><div className="w-4 h-0.5 bg-red" /> Cumulative Rent</div>
        </div>
      </div>
    </div>
  );
}

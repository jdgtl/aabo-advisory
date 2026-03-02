import type { YearlyRow } from "../engine";
import { fmtFull } from "../formatters";

interface TooltipField {
  key: keyof YearlyRow;
  label: string;
  color?: string;
}

interface TooltipProps {
  active?: boolean;
  label?: number;
  dataSource: YearlyRow[];
  fields: TooltipField[];
}

export default function ChartTooltip({ active, label, dataSource, fields }: TooltipProps) {
  if (!active || label == null) return null;
  const row = dataSource.find((d) => d.year === label);
  if (!row) return null;

  return (
    <div className="bg-primary p-4 px-5 border border-accent/20 min-w-[220px] shadow-[0_8px_32px_rgba(15,27,45,0.4)]">
      <div className="text-[11px] tracking-[0.1em] uppercase text-accent mb-2.5 font-semibold font-body">
        Year {label}
      </div>
      {fields.map((f, i) => (
        <div key={i} className="flex justify-between gap-6 py-1 text-[13px] font-body">
          <span className="text-warm/70">{f.label}</span>
          <span className="font-semibold" style={{ color: f.color ?? "#FAF8F5" }}>
            {fmtFull(row[f.key] as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Factory to create a bound tooltip component for a specific dataset and field list */
export function makeTooltip(dataSource: YearlyRow[], fields: TooltipField[]) {
  return function BoundTooltip({ active, label }: { active?: boolean; label?: number }) {
    return <ChartTooltip active={active} label={label} dataSource={dataSource} fields={fields} />;
  };
}

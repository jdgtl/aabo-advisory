import InfoTip from "./InfoTip";

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  definition?: string;
  formula?: string;
}

export default function MetricCard({ label, value, sub, accent, definition, formula }: Props) {
  return (
    <div className={`p-5 flex-[1_1_200px] min-w-[180px] ${accent ? "bg-primary" : "bg-light"}`}>
      <div
        className={`flex items-center text-[10px] tracking-[0.12em] uppercase mb-2 font-semibold font-body ${accent ? "text-accent" : "text-warm"}`}
      >
        {label}
        {definition && <InfoTip definition={definition} formula={formula} />}
      </div>
      <div
        className={`font-heading text-2xl font-bold leading-tight ${accent ? "text-canvas" : "text-primary"}`}
      >
        {value}
      </div>
      {sub && (
        <div className={`text-xs mt-1.5 font-body opacity-50 ${accent ? "text-warm" : "text-text"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

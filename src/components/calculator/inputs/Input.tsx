import { useState } from "react";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

export default function Input({ label, value, onChange, prefix, suffix, min, max, step, hint }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex-[1_1_180px] min-w-[160px]">
      <label className="block text-[10px] tracking-[0.1em] uppercase text-text/45 mb-1.5 font-semibold font-body">
        {label}
      </label>
      <div
        className={`flex items-center border bg-canvas overflow-hidden transition-colors duration-[250ms] ${focused ? "border-accent" : "border-mid"}`}
      >
        {prefix && (
          <span className="pl-3.5 py-3 text-sm text-warm font-body select-none">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`flex-1 border-none outline-none py-3 text-sm font-body text-text bg-transparent w-full ${prefix ? "pr-3.5 pl-1" : "px-3.5"}`}
        />
        {suffix && (
          <span className="pr-3.5 py-3 text-[13px] text-warm font-body select-none">{suffix}</span>
        )}
      </div>
      {hint && <div className="text-[10px] text-warm mt-1 opacity-60">{hint}</div>}
    </div>
  );
}

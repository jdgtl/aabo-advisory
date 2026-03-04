import { useState, useEffect, useId } from "react";
import type { ReactNode } from "react";

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
  placeholder?: string;
  tooltip?: ReactNode;
}

export default function Input({ label, value, onChange, prefix, suffix, min, max, step, hint, placeholder, tooltip }: Props) {
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState(value === 0 ? "" : String(value));
  const id = useId();

  useEffect(() => {
    if (!focused) setDisplay(value === 0 ? "" : String(value));
  }, [value, focused]);

  return (
    <div className="flex-[1_1_180px] min-w-[160px]">
      <label htmlFor={id} className="flex items-center text-[10px] tracking-[0.1em] uppercase text-text/45 mb-1.5 font-semibold font-body">
        {label}
        {tooltip}
      </label>
      <div
        className={`flex items-center border bg-canvas overflow-hidden transition-colors duration-[250ms] ${focused ? "border-accent" : "border-mid"}`}
      >
        {prefix && (
          <span className="pl-3.5 py-3 text-sm text-warm font-body select-none">{prefix}</span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setDisplay(e.target.value);
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onChange(Math.min(Math.max(num, min ?? -Infinity), max ?? Infinity));
            else if (e.target.value === "") onChange(0);
          }}
          onFocus={() => {
            setFocused(true);
            if (value === 0) setDisplay("");
          }}
          onBlur={() => {
            setFocused(false);
            setDisplay(value === 0 ? "" : String(value));
          }}
          className={`flex-1 border-none outline-none py-3 text-sm font-body text-text bg-transparent w-full placeholder:text-text/25 ${prefix ? "pr-3.5 pl-1" : "px-3.5"}`}
        />
        {suffix && (
          <span className="pr-3.5 py-3 text-[13px] text-warm font-body select-none">{suffix}</span>
        )}
      </div>
      {hint && <div className="text-[10px] text-text/50 mt-1">{hint}</div>}
    </div>
  );
}

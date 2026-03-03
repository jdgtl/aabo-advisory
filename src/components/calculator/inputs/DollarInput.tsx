import { useState, useEffect, useId } from "react";
import { fmtInput } from "../formatters";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  placeholder?: string;
}

export default function DollarInput({ label, value, onChange, hint, placeholder }: Props) {
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState(value === 0 ? "" : fmtInput(value));
  const id = useId();

  useEffect(() => {
    if (!focused) setDisplay(value === 0 ? "" : fmtInput(value));
  }, [value, focused]);

  const handleFocus = () => {
    setFocused(true);
    setDisplay(value === 0 ? "" : String(value));
  };
  const handleBlur = () => {
    setFocused(false);
    setDisplay(value === 0 ? "" : fmtInput(value));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    setDisplay(e.target.value);
    const num = parseFloat(raw);
    if (!isNaN(num)) onChange(num);
  };

  return (
    <div className="flex-[1_1_180px] min-w-[160px]">
      <label htmlFor={id} className="block text-[10px] tracking-[0.1em] uppercase text-text/45 mb-1.5 font-semibold font-body">
        {label}
      </label>
      <div
        className={`flex items-center border bg-canvas overflow-hidden transition-colors duration-[250ms] ${focused ? "border-accent" : "border-mid"}`}
      >
        <span className="pl-3.5 py-3 text-sm text-warm font-body select-none">$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 border-none outline-none py-3 pr-3.5 pl-1 text-sm font-body text-text bg-transparent w-full placeholder:text-text/25"
        />
      </div>
      {hint && <div className="text-[10px] text-warm mt-1 opacity-60">{hint}</div>}
    </div>
  );
}

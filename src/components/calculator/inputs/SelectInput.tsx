import { useState, useId } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}

export default function SelectInput({ label, value, onChange, options }: Props) {
  const [focused, setFocused] = useState(false);
  const id = useId();

  return (
    <div className="flex-[1_1_180px] min-w-[160px]">
      {label && (
        <label htmlFor={id} className="block text-[10px] tracking-[0.1em] uppercase text-text/45 mb-1.5 font-semibold font-body">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full border bg-canvas py-3 px-3.5 text-sm font-body text-text outline-none cursor-pointer appearance-auto transition-colors duration-[250ms] ${focused ? "border-accent" : "border-mid"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

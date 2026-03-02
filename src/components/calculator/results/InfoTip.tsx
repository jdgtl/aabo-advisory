import { useState, useRef } from "react";

interface Props {
  definition: string;
  formula?: string;
}

export default function InfoTip({ definition, formula }: Props) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 8, left: Math.min(r.left, window.innerWidth - 320) });
    }
    setShow(true);
  };

  return (
    <span
      ref={ref}
      className="relative inline-flex ml-1.5 cursor-help"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      <span className="w-[15px] h-[15px] rounded-full border border-warm inline-flex items-center justify-center text-[9px] font-bold text-warm font-body italic opacity-60">
        i
      </span>
      {show && (
        <div
          className="fixed w-[300px] bg-primary text-canvas font-body font-normal z-[10000] shadow-[0_12px_40px_rgba(15,27,45,0.7)] border border-accent/25 pointer-events-none"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="p-3.5 text-xs leading-relaxed text-canvas">{definition}</div>
          {formula && (
            <div className="px-3.5 py-3 text-[11px] leading-[1.55] text-warm border-t border-accent/20 bg-secondary/50">
              <span className="text-[9px] tracking-[0.1em] uppercase text-accent font-semibold block mb-1">
                Calculation
              </span>
              {formula}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

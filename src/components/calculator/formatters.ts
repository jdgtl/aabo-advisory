/** Full dollar format with commas, e.g. "$1,234,567" */
export function fmtFull(n: number): string {
  const r = Math.round(n);
  const a = Math.abs(r).toLocaleString("en-US");
  return r < 0 ? `-$${a}` : `$${a}`;
}

/** Short dollar format — "$1.23M" for millions, otherwise full */
export function fmt(n: number): string {
  if (Math.abs(n) >= 1e6) {
    const m = n / 1e6;
    return `$${m.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  }
  return fmtFull(n);
}

/** Format for input display with comma grouping */
export function fmtInput(n: number): string {
  return Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("en-US") : String(n);
}

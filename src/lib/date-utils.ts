/** Format YYYY-MM-DD → "Mar 24, 2026" (day-precision for newsletters) */
export function formatFullDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return date;
}

/** "0m", "45m", "1h", "2h 20m" from a minute count. */
export function formatMinutes(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

/** Paise → "₹1,234.00". */
export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Map a 0–100 exam-pressure score to a semantic bar/badge tone. */
export function pressureTone(p: number): 'success' | 'warn' | 'danger' {
  if (p >= 70) return 'danger';
  if (p >= 40) return 'warn';
  return 'success';
}

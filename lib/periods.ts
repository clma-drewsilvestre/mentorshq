// Local-date period helpers (avoid UTC drift for PH time).

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function localDateISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the current week, as YYYY-MM-DD. */
export function weekStartISO(d = new Date()): string {
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return localDateISO(monday);
}

/** Current PH semi-monthly slice (1st–15th or 16th–end of month), spec §L. */
export function currentSemiMonthlyPeriod(d = new Date()): { start: string; end: string } {
  const day = d.getDate();
  if (day <= 15) {
    return { start: localDateISO(new Date(d.getFullYear(), d.getMonth(), 1)), end: localDateISO(new Date(d.getFullYear(), d.getMonth(), 15)) };
  }
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return { start: localDateISO(new Date(d.getFullYear(), d.getMonth(), 16)), end: localDateISO(new Date(d.getFullYear(), d.getMonth(), lastDay)) };
}

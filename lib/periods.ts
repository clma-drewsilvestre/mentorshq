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

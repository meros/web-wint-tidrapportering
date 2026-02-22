/** Get ISO week number for a date */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get Monday and Sunday for a week offset from current week */
export function getWeekDates(weekOffset: number): { monday: Date; sunday: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

/** Format as "V.8 · 17–23 feb 2026" */
export function formatWeekLabel(monday: Date): string {
  const week = getISOWeek(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const monDay = monday.getDate();
  const sunDay = sunday.getDate();
  const monMonth = months[monday.getMonth()]!;
  const sunMonth = months[sunday.getMonth()]!;
  const year = sunday.getFullYear();

  if (monday.getMonth() === sunday.getMonth()) {
    return `V.${week} · ${monDay}–${sunDay} ${sunMonth} ${year}`;
  }
  return `V.${week} · ${monDay} ${monMonth}–${sunDay} ${sunMonth} ${year}`;
}

/** Format date as ISO string for API (YYYY-MM-DDT00:00:00.000) */
export function toApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00.000`;
}

/** Format date as short day name */
export function getDayName(date: Date): string {
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  return days[date.getDay()]!;
}

/** Format date as "17/2" */
export function formatShortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

/** Check if date is today */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Check if date is weekend */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Get array of 7 dates starting from Monday */
export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

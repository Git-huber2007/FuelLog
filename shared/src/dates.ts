// Dates are plain YYYY-MM-DD strings in the user's local calendar. Arithmetic is done in UTC so DST never shifts a day.

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export const utcTodayISO = () => new Date().toISOString().slice(0, 10);

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export function addDays(iso: string, n: number): string {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (positive when b is later). */
export const daysBetween = (a: string, b: string) => Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000);

/** 0 = Sunday … 6 = Saturday. */
export const weekdayOf = (iso: string) => utc(iso).getUTCDay();

export function formatDayLabel(iso: string, today: string): string {
  if (iso === today) return 'Today';
  if (iso === addDays(today, -1)) return 'Yesterday';
  return utc(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function defaultMeal(now: Date): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 11 * 60) return 'breakfast';
  if (minutes < 16 * 60) return 'lunch';
  if (minutes < 21 * 60 + 30) return 'dinner';
  return 'snack';
}

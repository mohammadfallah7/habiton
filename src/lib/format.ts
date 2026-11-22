const numbers = new Intl.NumberFormat("fa-IR");
const dates = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Persian digits. */
export function faNum(value: number): string {
  return numbers.format(value);
}

/** Jalali date for a YYYY-MM-DD key, without shifting the calendar day. */
export function faDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return dates.format(new Date(y, m - 1, d));
}

function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const monthName = new Intl.DateTimeFormat("fa-IR", { month: "long" });
const weekdayNarrow = new Intl.DateTimeFormat("fa-IR", { weekday: "narrow" });
const weekdayLong = new Intl.DateTimeFormat("fa-IR", { weekday: "long" });
const dayOfMonth = new Intl.DateTimeFormat("fa-IR", { day: "numeric" });
const longDate = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Jalali month name, e.g. "آذر". */
export const faMonth = (iso: string) => monthName.format(toDate(iso));
/** One-letter weekday, e.g. "ی". */
export const faWeekdayNarrow = (iso: string) => weekdayNarrow.format(toDate(iso));
/** Full weekday name, e.g. "یکشنبه". */
export const faWeekday = (iso: string) => weekdayLong.format(toDate(iso));
/** Jalali day of the month in Persian digits. */
export const faDayOfMonth = (iso: string) => dayOfMonth.format(toDate(iso));
/** "یکشنبه ۱ آذر" */
export const faLongDate = (iso: string) => longDate.format(toDate(iso));

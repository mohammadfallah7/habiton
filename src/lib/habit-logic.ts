// Pure habit rules: no React, no database. Everything here is unit-tested.

export type Frequency = "DAILY" | "WEEKLY";

export interface HabitRule {
  target: number;
  frequency: Frequency;
}

/** First day of the week: 0 = Sunday ... 6 = Saturday. Saturday matches the Persian week. */
export const WEEK_START = 6;

const DAY_MS = 86_400_000;

/** YYYY-MM-DD for a local Date. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(key: string, n: number): string {
  return fmt(new Date(parseDay(key).getTime() + n * DAY_MS));
}

/** First day of the week containing `key`. */
export function weekStartOf(key: string): string {
  const dow = parseDay(key).getUTCDay();
  const back = (dow - WEEK_START + 7) % 7;
  return addDays(key, -back);
}

export type Logs = Record<string, number>; // day -> value

/** Is a single day a success? Only meaningful for DAILY habits. */
export function isDayDone(rule: HabitRule, value: number): boolean {
  return value >= Math.max(rule.target, 1);
}

/** Heat level 0-4 by share of the daily goal reached. */
export function heatLevel(rule: HabitRule, value: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0) return 0;
  const share = value / Math.max(rule.target, 1);
  if (share >= 1) return 4;
  if (share >= 0.66) return 3;
  if (share >= 0.33) return 2;
  return 1;
}

/** Progress shown on the row: today's value (DAILY) or check-in days this week (WEEKLY). */
export function currentProgress(rule: HabitRule, logs: Logs, today: string) {
  if (rule.frequency === "DAILY") {
    const done = logs[today] ?? 0;
    return { done, required: Math.max(rule.target, 1) };
  }
  const start = weekStartOf(today);
  let days = 0;
  for (let i = 0; i < 7; i++) if ((logs[addDays(start, i)] ?? 0) > 0) days++;
  return { done: days, required: Math.max(rule.target, 1) };
}

export function isCurrentDone(rule: HabitRule, logs: Logs, today: string): boolean {
  const p = currentProgress(rule, logs, today);
  return p.done >= p.required;
}

export interface Stats {
  current: number;
  best: number;
  successfulPeriods: number;
}

/**
 * Streaks count whole periods: days for DAILY habits, weeks for WEEKLY ones.
 * The period that contains `today` never breaks a streak while it is still
 * unfinished; it only adds to it once completed.
 */
export function computeStats(rule: HabitRule, logs: Logs, today: string): Stats {
  const days = Object.keys(logs)
    .filter((d) => logs[d] > 0)
    .sort();
  if (days.length === 0) return { current: 0, best: 0, successfulPeriods: 0 };

  const periodDone = new Map<string, boolean>(); // period start -> done
  const step = rule.frequency === "DAILY" ? 1 : 7;
  const startOf = (d: string) => (rule.frequency === "DAILY" ? d : weekStartOf(d));

  const first = startOf(days[0]);
  const last = startOf(today);
  for (let p = first; p <= last; p = addDays(p, step)) {
    if (rule.frequency === "DAILY") {
      periodDone.set(p, isDayDone(rule, logs[p] ?? 0));
    } else {
      let n = 0;
      for (let i = 0; i < 7; i++) if ((logs[addDays(p, i)] ?? 0) > 0) n++;
      periodDone.set(p, n >= Math.max(rule.target, 1));
    }
  }

  let best = 0;
  let run = 0;
  let successful = 0;
  for (let p = first; p <= last; p = addDays(p, step)) {
    if (periodDone.get(p)) {
      run++;
      successful++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  // Current streak: walk back from the newest period, forgiving an unfinished one.
  let current = 0;
  let p = last;
  if (!periodDone.get(p)) p = addDays(p, -step);
  while (p >= first && periodDone.get(p)) {
    current++;
    p = addDays(p, -step);
  }
  return { current, best, successfulPeriods: successful };
}

export interface HeatCell {
  day: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

/** `weeks` columns of 7 cells ending with the week that contains `today`. */
export function heatmap(rule: HabitRule, logs: Logs, today: string, weeks = 26): HeatCell[][] {
  const thisWeek = weekStartOf(today);
  const out: HeatCell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = addDays(thisWeek, -7 * w);
    const col: HeatCell[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const value = logs[day] ?? 0;
      col.push({
        day,
        value,
        level: heatLevel(rule, value),
        future: day > today,
      });
    }
    out.push(col);
  }
  return out;
}

/** The seven days of the week that contains `today`, first day first. */
export function weekDays(today: string): string[] {
  const start = weekStartOf(today);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export interface DayHabit extends HabitRule {
  logs: Logs;
  /** First day the habit existed (YYYY-MM-DD). Earlier days don't count against it. */
  startDay?: string;
}

/**
 * How many daily habits were completed on `day`, out of those that applied.
 * Weekly habits are left out: they have no per-day success.
 */
export function dayCompletion(habits: DayHabit[], day: string): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const h of habits) {
    if (h.frequency !== "DAILY") continue;
    const value = h.logs[day] ?? 0;
    if (h.startDay && day < h.startDay && value === 0) continue;
    total++;
    if (isDayDone(h, value)) done++;
  }
  return { done, total };
}

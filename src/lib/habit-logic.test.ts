import { describe, expect, it } from "vitest";
import {
  addDays,
  clampLogValue,
  computeStats,
  currentProgress,
  dayCompletion,
  heatLevel,
  heatmap,
  isCurrentDone,
  markLevel,
  toggleDayDelta,
  weekDays,
  weekStartOf,
} from "./habit-logic";

const daily = { target: 1, frequency: "DAILY" as const };
const glasses = { target: 8, frequency: "DAILY" as const };
const weekly = { target: 3, frequency: "WEEKLY" as const };

describe("dates", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("finds the Saturday of a week", () => {
    expect(weekStartOf("2026-11-19")).toBe("2026-11-14"); // Thursday
    expect(weekStartOf("2026-11-14")).toBe("2026-11-14");
    expect(weekStartOf("2026-11-22")).toBe("2026-11-21"); // Sunday
  });
});

describe("daily streaks", () => {
  const today = "2026-11-19";
  it("is zero with no logs", () => {
    expect(computeStats(daily, {}, today)).toEqual({ current: 0, best: 0, successfulPeriods: 0 });
  });
  it("counts a run ending today", () => {
    const logs = { "2026-11-17": 1, "2026-11-18": 1, "2026-11-19": 1 };
    expect(computeStats(daily, logs, today).current).toBe(3);
  });
  it("does not break the streak while today is still open", () => {
    const logs = { "2026-11-17": 1, "2026-11-18": 1 };
    expect(computeStats(daily, logs, today).current).toBe(2);
  });
  it("breaks after a missed day and remembers the best run", () => {
    const logs = { "2026-11-10": 1, "2026-11-11": 1, "2026-11-12": 1, "2026-11-15": 1 };
    const s = computeStats(daily, logs, today);
    expect(s.current).toBe(0);
    expect(s.best).toBe(3);
    expect(s.successfulPeriods).toBe(4);
  });
  it("requires the full target for goal habits", () => {
    const logs = { "2026-11-18": 7, "2026-11-19": 8 };
    const s = computeStats(glasses, logs, today);
    expect(s.current).toBe(1);
    expect(s.successfulPeriods).toBe(1);
  });
});

describe("weekly habits", () => {
  const today = "2026-11-19"; // Thursday; week starts Sat 2026-11-14
  it("counts check-in days in the current week", () => {
    const logs = { "2026-11-16": 1, "2026-11-18": 1 };
    expect(currentProgress(weekly, logs, today)).toEqual({ done: 2, required: 3 });
    expect(isCurrentDone(weekly, logs, today)).toBe(false);
  });
  it("counts weeks in a row, forgiving the open week", () => {
    const logs = {
      "2026-11-02": 1, "2026-11-03": 1, "2026-11-04": 1, // week 1: done
      "2026-11-09": 1, "2026-11-10": 1, "2026-11-11": 1, // week 2: done
      "2026-11-16": 1, // this week: open
    };
    const s = computeStats(weekly, logs, today);
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });
});

describe("heatmap", () => {
  it("returns whole weeks ending in this week and flags future days", () => {
    const grid = heatmap(daily, { "2026-11-19": 1 }, "2026-11-19", 4);
    expect(grid).toHaveLength(4);
    expect(grid.every((c) => c.length === 7)).toBe(true);
    const last = grid[3];
    expect(last[0].day).toBe("2026-11-14");
    expect(last[5].level).toBe(4);
    expect(last[6].future).toBe(true);
    expect(last[5].future).toBe(false);
  });
  it("scales levels by share of goal", () => {
    expect(heatLevel(glasses, 0)).toBe(0);
    expect(heatLevel(glasses, 1)).toBe(1);
    expect(heatLevel(glasses, 3)).toBe(2);
    expect(heatLevel(glasses, 6)).toBe(3);
    expect(heatLevel(glasses, 8)).toBe(4);
  });
  it("paints a weekly check-in as a full day, not a fraction of the weekly target", () => {
    const grid = heatmap(weekly, { "2026-11-16": 1 }, "2026-11-19", 1);
    const monday = grid[0].find((cell) => cell.day === "2026-11-16");
    const empty = grid[0].find((cell) => cell.day === "2026-11-15");
    expect(markLevel(weekly, 1)).toBe(4);
    expect(markLevel(weekly, 0)).toBe(0);
    expect(monday?.level).toBe(4);
    expect(empty?.level).toBe(0);
  });
});

describe("logging a day", () => {
  it("fills a daily goal in one step, and clears it once met", () => {
    expect(toggleDayDelta(glasses, 0)).toBe(8);
    expect(toggleDayDelta(glasses, 3)).toBe(5);
    expect(toggleDayDelta(glasses, 8)).toBe(-8);
    expect(toggleDayDelta(glasses, 9)).toBe(-9);
  });
  it("toggles a single check-in", () => {
    expect(toggleDayDelta(daily, 0)).toBe(1);
    expect(toggleDayDelta(daily, 1)).toBe(-1);
    expect(toggleDayDelta(weekly, 0)).toBe(1);
    expect(toggleDayDelta(weekly, 2)).toBe(-2);
  });
  it("keeps a log value inside the allowed range", () => {
    expect(clampLogValue(-3)).toBe(0);
    expect(clampLogValue(4)).toBe(4);
    expect(clampLogValue(99_999)).toBe(10_000);
  });
});

describe("week and day completion", () => {
  it("lists seven days from the week start", () => {
    const days = weekDays("2026-11-19");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe(weekStartOf("2026-11-19"));
    expect(days[6]).toBe(addDays(days[0], 6));
  });

  it("counts only daily habits and ignores weekly ones", () => {
    const habits = [
      { ...daily, logs: { "2026-11-18": 1 } },
      { ...glasses, logs: { "2026-11-18": 5 } },
      { ...weekly, logs: { "2026-11-18": 1 } },
    ];
    expect(dayCompletion(habits, "2026-11-18")).toEqual({ done: 1, total: 2 });
  });

  it("does not count a day before the habit existed", () => {
    const habits = [{ ...daily, logs: {}, startDay: "2026-11-18" }];
    expect(dayCompletion(habits, "2026-11-17")).toEqual({ done: 0, total: 0 });
    expect(dayCompletion(habits, "2026-11-18")).toEqual({ done: 0, total: 1 });
  });

  it("still counts an earlier day that has a log", () => {
    const habits = [{ ...daily, logs: { "2026-11-17": 1 }, startDay: "2026-11-18" }];
    expect(dayCompletion(habits, "2026-11-17")).toEqual({ done: 1, total: 1 });
  });
});

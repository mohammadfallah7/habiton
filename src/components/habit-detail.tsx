"use client";

import { useState } from "react";
import { ArchiveIcon, FlameIcon, TrophyIcon, CalendarCheckIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { faDay, faMonth, faNum, faWeekdayNarrow } from "@/lib/format";
import { computeStats, heatmap, weekDays, type HeatCell } from "@/lib/habit-logic";
import type { HabitView } from "./habit-board";

const LEVEL_BG = [
  "var(--muted)",
  "color-mix(in srgb, var(--c) 32%, var(--muted))",
  "color-mix(in srgb, var(--c) 55%, var(--muted))",
  "color-mix(in srgb, var(--c) 78%, var(--muted))",
  "var(--c)",
];

function cellLabel(cell: HeatCell, unit: string) {
  return cell.future
    ? faDay(cell.day)
    : cell.value > 0
      ? `${faDay(cell.day)}: ${faNum(cell.value)} ${unit}`
      : `${faDay(cell.day)}: ثبت نشده`;
}

export function HabitDetail({
  habit,
  today,
  open,
  onOpenChange,
  onArchive,
  onDelete,
}: {
  habit: HabitView;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const stats = computeStats(habit, habit.logs, today);
  const grid = heatmap(habit, habit.logs, today, 26);
  const weekly = habit.frequency === "WEEKLY";
  const period = weekly ? "هفته" : "روز";
  const unit = weekly ? "روز" : habit.unit;
  const goal = weekly
    ? `${faNum(habit.target)} روز در هفته`
    : `${faNum(habit.target)} ${habit.unit} در روز`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirming(false);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto sm:max-w-lg" style={{ ["--c" as string]: habit.color }}>
        <DialogHeader className="pe-8">
          <div className="flex items-center gap-3 text-start">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl"
              style={{ background: "color-mix(in srgb, var(--c) 18%, var(--card))" }}
            >
              {habit.emoji}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-bold">{habit.title}</DialogTitle>
              <DialogDescription>{goal}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<FlameIcon className="text-orange-500" />} value={stats.current} label={`زنجیره فعلی (${period})`} />
          <Stat icon={<TrophyIcon className="text-amber-500" />} value={stats.best} label="بهترین زنجیره" />
          <Stat icon={<CalendarCheckIcon className="text-emerald-500" />} value={stats.successfulPeriods} label={weekly ? "هفته‌های موفق" : "روزهای موفق"} />
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-semibold">۶ ماه اخیر</p>
          <div className="overflow-x-auto pb-1" onMouseLeave={() => setHover(null)}>
            <div className="flex w-max gap-2">
              <div className="flex flex-col gap-[3px] pt-5">
                {weekDays(today).map((d) => (
                  <span key={d} className="grid h-3 place-items-center text-[10px] leading-none text-muted-foreground">
                    {faWeekdayNarrow(d)}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                {grid.map((col, i) => {
                  const month = faMonth(col[0].day);
                  const showMonth = i === 0 || month !== faMonth(grid[i - 1][0].day);
                  return (
                    <div key={i} className="flex flex-col gap-[3px]">
                      <span className="relative h-4 w-3 text-[10px] leading-4 whitespace-nowrap text-muted-foreground">
                        {showMonth && <span className="absolute start-0">{month}</span>}
                      </span>
                      {col.map((c) => (
                        <button
                          key={c.day}
                          type="button"
                          tabIndex={-1}
                          title={cellLabel(c, unit)}
                          aria-label={cellLabel(c, unit)}
                          onMouseEnter={() => setHover(cellLabel(c, unit))}
                          onClick={() => setHover(cellLabel(c, unit))}
                          className="size-3 rounded-[4px] transition-transform hover:scale-125"
                          style={{ background: LEVEL_BG[c.level], opacity: c.future ? 0.3 : 1 }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex min-h-5 items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{hover ?? "روی یک خانه بزن تا جزئیات روز را ببینی"}</span>
            <span className="flex shrink-0 items-center gap-1" aria-hidden>
              کمتر
              {LEVEL_BG.map((bg, i) => (
                <span key={i} className="size-2.5 rounded-[3px]" style={{ background: bg }} />
              ))}
              بیشتر
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {confirming ? (
            <>
              <p className="text-sm sm:flex-1">این عادت و تمام تاریخچه‌اش حذف شود؟</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirming(false)}>
                  انصراف
                </Button>
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2Icon />
                  حذف
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                <Trash2Icon />
                حذف
              </Button>
              <Button variant="outline" onClick={onArchive}>
                <ArchiveIcon />
                بایگانی
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-muted/70 px-3 py-3">
      <span className="[&_svg]:size-4">{icon}</span>
      <b className="text-2xl leading-none">{faNum(value)}</b>
      <span className="text-[0.7rem] leading-4 text-muted-foreground">{label}</span>
    </div>
  );
}

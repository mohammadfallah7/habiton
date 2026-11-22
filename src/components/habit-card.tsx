import { CheckIcon, FlameIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/progress-ring";
import { faNum, faWeekday } from "@/lib/format";
import { computeStats, currentProgress, heatLevel, weekDays } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";
import type { HabitView } from "./habit-board";

const LEVEL_MIX = [0, 35, 60, 80, 100];

export function HabitCard({
  habit: h,
  today,
  index,
  onLog,
  onOpen,
}: {
  habit: HabitView;
  today: string;
  index: number;
  onLog: (delta: number) => void;
  onOpen: () => void;
}) {
  const weekly = h.frequency === "WEEKLY";
  const p = currentProgress(h, h.logs, today);
  const share = Math.min(p.done / p.required, 1);
  const todayValue = h.logs[today] ?? 0;
  const periodDone = p.done >= p.required;
  const checked = weekly ? todayValue > 0 : periodDone;
  // One-step habits are a checkbox: tapping again undoes.
  const toggle = weekly || h.target === 1;
  const { current } = computeStats(h, h.logs, today);
  const unit = weekly ? "روز این هفته" : h.unit;

  function tap() {
    onLog(toggle && todayValue > 0 ? -todayValue : 1);
  }

  return (
    <Card
      className="group/habit relative animate-rise gap-4 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ ["--c" as string]: h.color, animationDelay: `${120 + index * 55}ms` }}
    >
      <div
        className="pointer-events-none absolute -top-16 -end-16 size-44 rounded-full opacity-[0.14] blur-3xl transition-opacity group-hover/habit:opacity-25"
        style={{ background: "var(--c)" }}
      />

      <div className="relative flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`جزئیات ${h.title}`}
        >
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl"
            style={{ background: "color-mix(in srgb, var(--c) 18%, var(--card))" }}
          >
            {h.emoji}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold">{h.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {weekly ? "هفتگی" : "روزانه"}
              <span aria-hidden>·</span>
              {faNum(p.done)} از {faNum(p.required)} {unit}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={tap}
          aria-pressed={toggle ? checked : undefined}
          aria-label={toggle ? (todayValue > 0 ? `برگرداندن ${h.title}` : `ثبت ${h.title}`) : `یکی اضافه کن: ${h.title}`}
          className="shrink-0 rounded-full outline-none transition-transform active:scale-90 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ProgressRing value={share} size={52} stroke={5} color="var(--c)" track="color-mix(in srgb, var(--c) 18%, var(--border))">
            <span
              key={String(checked)}
              className={cn(
                "grid size-9 place-items-center rounded-full transition-colors",
                checked ? "animate-pop text-white" : "text-[var(--c)]",
              )}
              style={checked ? { background: "var(--c)" } : undefined}
            >
              {checked ? <CheckIcon className="size-5" strokeWidth={3} /> : <PlusIcon className="size-5" strokeWidth={2.5} />}
            </span>
          </ProgressRing>
        </button>
      </div>

      <div
        className="relative h-1.5 overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--c) 14%, var(--muted))" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={p.required}
        aria-valuenow={Math.min(p.done, p.required)}
        aria-label={`پیشرفت ${h.title}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${share * 100}%`, background: "var(--c)" }}
        />
      </div>

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {current > 0 ? (
            <Badge variant="secondary" className="h-6 gap-1 px-2.5 text-[0.8rem]">
              <FlameIcon className="text-orange-500" />
              {faNum(current)} {weekly ? "هفته" : "روز"}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">زنجیره را شروع کن</span>
          )}
          {!toggle && todayValue > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              aria-label="یکی کمتر"
              onClick={() => onLog(-1)}
            >
              <MinusIcon />
              کمتر
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1" aria-hidden>
          {weekDays(today).map((day) => {
            const value = h.logs[day] ?? 0;
            const level = weekly ? (value > 0 ? 4 : 0) : heatLevel(h, value);
            return (
              <span
                key={day}
                title={faWeekday(day)}
                className={cn("size-2.5 rounded-full", day > today && "opacity-35", day === today && "ring-2 ring-offset-1 ring-offset-card")}
                style={{
                  background:
                    level === 0
                      ? "var(--border)"
                      : `color-mix(in srgb, var(--c) ${LEVEL_MIX[level]}%, var(--border))`,
                  ["--tw-ring-color" as string]: "color-mix(in srgb, var(--c) 45%, transparent)",
                }}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

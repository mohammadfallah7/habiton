"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { archiveHabit, deleteHabit, logProgress } from "@/app/actions";
import { dayKey, type Frequency, type Logs } from "@/lib/habit-logic";
import type { HabitPreset } from "@/lib/habit-presets";
import { EmptyState } from "./empty-state";
import { HabitCard } from "./habit-card";
import { HabitDetail } from "./habit-detail";
import { HabitFormDialog } from "./habit-form";
import { TodayHero } from "./today-hero";
import { WeekStrip } from "./week-strip";
import { Skeleton } from "@/components/ui/skeleton";

export interface HabitView {
  id: string;
  title: string;
  emoji: string;
  color: string;
  target: number;
  unit: string;
  frequency: Frequency;
  logs: Logs;
  /** YYYY-MM-DD the habit was created. */
  startDay: string;
}

type Optimistic = { id: string; day: string; delta: number };

function applyLog(habits: HabitView[], { id, day, delta }: Optimistic): HabitView[] {
  return habits.map((h) => {
    if (h.id !== id) return h;
    const next = Math.max(0, (h.logs[day] ?? 0) + delta);
    const logs = { ...h.logs };
    if (next === 0) delete logs[day];
    else logs[day] = next;
    return { ...h, logs };
  });
}

export function HabitBoard({ habits, userName }: { habits: HabitView[]; userName: string }) {
  // "Today" is the browser's local day, so it is only known after mount.
  const [now, setNow] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [preset, setPreset] = useState<HabitPreset | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(habits, applyLog);

  useEffect(() => {
    setNow(new Date());
    // Roll over at midnight if the tab stays open.
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <BoardSkeleton />;
  const today = dayKey(now);
  const opened = optimistic.find((h) => h.id === openId) ?? null;

  function openForm(p: HabitPreset | null = null) {
    setPreset(p);
    setFormOpen(true);
  }

  function log(id: string, delta: number) {
    startTransition(async () => {
      addOptimistic({ id, day: today, delta });
      const res = await logProgress({ habitId: id, day: today, delta });
      if (!res.ok) toast.error(res.error);
    });
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setDetailOpen(false);
        toast.success(success);
      } else {
        toast.error(res.error ?? "مشکلی پیش آمد");
      }
    });
  }

  return (
    <div className="space-y-5">
      <TodayHero
        name={userName}
        today={today}
        hour={now.getHours()}
        habits={optimistic}
        onAdd={() => openForm()}
      />

      {optimistic.length === 0 ? (
        <EmptyState onPick={(p) => openForm(p)} onCustom={() => openForm()} />
      ) : (
        <>
          <WeekStrip today={today} habits={optimistic} />
          <ul className="grid gap-4 md:grid-cols-2">
            {optimistic.map((h, i) => (
              <li key={h.id}>
                <HabitCard
                  habit={h}
                  today={today}
                  index={i}
                  onLog={(delta) => log(h.id, delta)}
                  onOpen={() => {
                    setOpenId(h.id);
                    setDetailOpen(true);
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} preset={preset} />

      {opened && (
        <HabitDetail
          habit={opened}
          today={today}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onArchive={() => run(() => archiveHabit(opened.id), "عادت بایگانی شد")}
          onDelete={() => run(() => deleteHabit(opened.id), "عادت حذف شد")}
        />
      )}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="در حال بارگذاری">
      <Skeleton className="h-64 rounded-3xl sm:h-72" />
      <Skeleton className="h-24" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArchiveIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { archiveHabit, deleteHabit, logProgress, restoreHabit } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { faNum } from "@/lib/format";
import {
  clampLogValue,
  dayKey,
  toggleDayDelta,
  type Frequency,
  type Logs,
} from "@/lib/habit-logic";
import type { HabitPreset } from "@/lib/habit-presets";
import { EmptyState } from "./empty-state";
import { HabitCard } from "./habit-card";
import { HabitDetail } from "./habit-detail";
import { HabitFormDialog } from "./habit-form";
import { TodayHero } from "./today-hero";
import { WeekStrip } from "./week-strip";

export interface HabitView {
  id: string;
  title: string;
  emoji: string;
  color: string;
  target: number;
  unit: string;
  frequency: Frequency;
  logs: Logs;
  /** ISO time the row was created. The client derives the local start day. */
  createdAt: string;
  /** YYYY-MM-DD the habit was created, in the user's local time zone. */
  startDay: string;
}

export interface ArchivedHabit {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

type Inflight = { value: number; pending: number };

function logKey(id: string, day: string) {
  return `${id}|${day}`;
}

function splitLogKey(key: string) {
  const bar = key.indexOf("|");
  return { id: key.slice(0, bar), day: key.slice(bar + 1) };
}

export function HabitBoard({
  habits,
  archived,
  userName,
}: {
  habits: HabitView[];
  archived: ArchivedHabit[];
  userName: string;
}) {
  // "Today" is the browser's local day, so it is only known after mount.
  const [now, setNow] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [preset, setPreset] = useState<HabitPreset | null>(null);
  const [editing, setEditing] = useState<HabitView | null>(null);
  const [formNonce, setFormNonce] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [inflight, setInflight] = useState<Record<string, Inflight>>({});
  const [, startTransition] = useTransition();

  const habitsRef = useRef(habits);
  habitsRef.current = habits;
  // Latest value we have asked the server to store, so a second tap in the
  // same frame stacks on the first instead of reading a stale render.
  const valuesRef = useRef(new Map<string, number>());
  const chainRef = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    setNow(new Date());
    // Roll over at midnight if the tab stays open.
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Drop an override once the refreshed server row matches it.
  useEffect(() => {
    setInflight((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, entry] of Object.entries(prev)) {
        if (entry.pending > 0) continue;
        const { id, day } = splitLogKey(key);
        const server = habits.find((h) => h.id === id)?.logs[day] ?? 0;
        if (server === entry.value) {
          delete next[key];
          valuesRef.current.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [habits, inflight]);

  const view = useMemo(() => {
    return habits.map((habit) => {
      const startDay = dayKey(new Date(habit.createdAt));
      const prefix = `${habit.id}|`;
      let logs: Logs | null = null;
      for (const [key, entry] of Object.entries(inflight)) {
        if (!key.startsWith(prefix)) continue;
        logs ??= { ...habit.logs };
        const day = key.slice(prefix.length);
        if (entry.value <= 0) delete logs[day];
        else logs[day] = entry.value;
      }
      return { ...habit, startDay, logs: logs ?? habit.logs };
    });
  }, [habits, inflight]);

  if (!now) return <BoardSkeleton />;
  const today = dayKey(now);
  const opened = view.find((h) => h.id === openId) ?? null;

  function valueOf(id: string, day: string) {
    const known = valuesRef.current.get(logKey(id, day));
    if (known !== undefined) return known;
    return habitsRef.current.find((h) => h.id === id)?.logs[day] ?? 0;
  }

  function pushLog(id: string, day: string, delta: number) {
    const key = logKey(id, day);
    const next = clampLogValue(valueOf(id, day) + delta);
    const applied = next - valueOf(id, day);
    if (applied === 0) return;
    valuesRef.current.set(key, next);
    setInflight((prev) => ({
      ...prev,
      [key]: {
        value: valuesRef.current.get(key) ?? next,
        pending: (prev[key]?.pending ?? 0) + 1,
      },
    }));

    const task = async () => {
      let ok = false;
      try {
        const res = await logProgress({ habitId: id, day, delta: applied });
        ok = res.ok;
        if (!res.ok) {
          valuesRef.current.set(key, clampLogValue((valuesRef.current.get(key) ?? next) - applied));
          toast.error(res.error);
        }
      } catch {
        valuesRef.current.set(key, clampLogValue((valuesRef.current.get(key) ?? next) - applied));
        toast.error("اتصال برقرار نشد. دوباره تلاش کن.");
      }
      setInflight((prev) => {
        const entry = prev[key];
        if (!entry) return prev;
        const pending = entry.pending - 1;
        if (pending <= 0 && !ok) {
          const copy = { ...prev };
          delete copy[key];
          valuesRef.current.delete(key);
          return copy;
        }
        return {
          ...prev,
          [key]: {
            value: valuesRef.current.get(key) ?? entry.value,
            pending: Math.max(pending, 0),
          },
        };
      });
    };

    const previous = chainRef.current.get(id) ?? Promise.resolve();
    const job = previous.then(task, task);
    chainRef.current.set(id, job);
  }

  function logToggle(id: string, day: string) {
    const habit = habitsRef.current.find((h) => h.id === id);
    if (!habit || day > today) return;
    pushLog(id, day, toggleDayDelta(habit, valueOf(id, day)));
  }

  function openForm(p: HabitPreset | null = null) {
    setEditing(null);
    setPreset(p);
    setFormNonce((n) => n + 1);
    setFormOpen(true);
  }

  function openEdit(habit: HabitView) {
    setDetailOpen(false);
    setPreset(null);
    setEditing(habit);
    setFormNonce((n) => n + 1);
    setFormOpen(true);
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
        habits={view}
        onAdd={() => openForm()}
      />

      {view.length === 0 ? (
        <EmptyState onPick={(p) => openForm(p)} onCustom={() => openForm()} />
      ) : (
        <>
          <WeekStrip today={today} habits={view} />
          <ul className="grid gap-4 md:grid-cols-2">
            {view.map((h, i) => (
              <li key={h.id}>
                <HabitCard
                  habit={h}
                  today={today}
                  index={i}
                  onLog={(delta) => pushLog(h.id, today, delta)}
                  onToggle={() => logToggle(h.id, today)}
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

      <ArchivedList
        items={archived}
        onRestore={(id) => run(() => restoreHabit(id), "عادت برگردانده شد")}
      />

      <HabitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        preset={preset}
        habit={editing}
        formKey={formNonce}
      />

      {opened && (
        <HabitDetail
          key={opened.id}
          habit={opened}
          today={today}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onLogDay={(day) => logToggle(opened.id, day)}
          onEdit={() => openEdit(opened)}
          onArchive={() => run(() => archiveHabit(opened.id), "عادت بایگانی شد")}
          onDelete={() => run(() => deleteHabit(opened.id), "عادت حذف شد")}
        />
      )}
    </div>
  );
}

function ArchivedList({
  items,
  onRestore,
}: {
  items: ArchivedHabit[];
  onRestore: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <Card className="gap-0 p-2 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-center gap-2 font-semibold">
          <ArchiveIcon className="size-4 text-muted-foreground" />
          بایگانی
        </span>
        <span className="text-sm text-muted-foreground">{faNum(items.length)}</span>
      </button>
      {open && (
        <ul className="divide-y divide-border px-1">
          {items.map((habit) => (
            <li key={habit.id} className="flex items-center gap-3 py-2.5 ps-2 pe-1">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl text-xl"
                style={{ background: `color-mix(in srgb, ${habit.color} 18%, var(--card))` }}
              >
                {habit.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{habit.title}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => onRestore(habit.id)}>
                <RotateCcwIcon />
                برگرداندن
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
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

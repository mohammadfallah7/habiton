"use client";

import { useState, useTransition } from "react";
import { CheckIcon, LoaderCircleIcon, MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createHabit } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { faNum } from "@/lib/format";
import type { Frequency } from "@/lib/habit-logic";
import { COLORS, EMOJIS, TEMPLATES, UNITS, type HabitPreset } from "@/lib/habit-presets";
import { cn } from "@/lib/utils";

export function HabitFormDialog({
  open,
  onOpenChange,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: HabitPreset | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto sm:max-w-md">
        <FormBody preset={preset} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FormBody({ preset, onDone }: { preset: HabitPreset | null; onDone: () => void }) {
  const [title, setTitle] = useState(preset?.title ?? "");
  const [emoji, setEmoji] = useState(preset?.emoji ?? EMOJIS[0]);
  const [color, setColor] = useState(preset?.color ?? COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>(preset?.frequency ?? "DAILY");
  const [target, setTarget] = useState(preset?.target ?? 1);
  const [unit, setUnit] = useState(preset?.unit ?? UNITS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const weekly = frequency === "WEEKLY";
  const maxTarget = weekly ? 7 : 1000;

  function applyPreset(t: HabitPreset) {
    setTitle(t.title);
    setEmoji(t.emoji);
    setColor(t.color);
    setFrequency(t.frequency);
    setTarget(t.target);
    setUnit(t.unit);
  }

  function setFreq(f: Frequency) {
    setFrequency(f);
    if (f === "WEEKLY") setTarget((t) => Math.min(Math.max(t, 1), 7));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createHabit({
        title,
        emoji,
        color,
        frequency,
        target,
        unit: weekly ? "بار" : unit,
      });
      if (res.ok) {
        toast.success("عادت اضافه شد");
        onDone();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5" style={{ ["--c" as string]: color }}>
      <DialogHeader className="text-start">
        <div className="flex items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl transition-colors"
            style={{ background: "color-mix(in srgb, var(--c) 18%, var(--card))" }}
          >
            {emoji}
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-bold">{title.trim() || "عادت جدید"}</DialogTitle>
            <DialogDescription>
              {weekly ? `${faNum(target)} روز در هفته` : `${faNum(target)} ${unit} در روز`}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid gap-2">
        <Label className="text-xs text-muted-foreground">از یک الگو شروع کن</Label>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => applyPreset(t)}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t.emoji} {t.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="habit-title">نام عادت</Label>
        <Input
          id="habit-title"
          autoFocus
          required
          maxLength={60}
          value={title}
          placeholder="مثلاً نوشیدن آب"
          className="h-10 text-base"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>نماد</Label>
        <div role="radiogroup" aria-label="نماد" className="grid grid-cols-8 gap-1.5">
          {EMOJIS.map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={x === emoji}
              onClick={() => setEmoji(x)}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-xl transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                x === emoji ? "bg-accent ring-2 ring-primary" : "bg-muted/50 hover:bg-accent/60",
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>رنگ</Label>
        <div role="radiogroup" aria-label="رنگ" className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn(
                "grid size-8 place-items-center rounded-full text-white transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                c === color ? "scale-110 ring-2 ring-offset-2 ring-offset-popover" : "hover:scale-105",
              )}
              style={{ background: c, ["--tw-ring-color" as string]: c }}
            >
              {c === color && <CheckIcon className="size-4" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>تکرار</Label>
        <div role="radiogroup" aria-label="تکرار" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["DAILY", "هر روز"],
              ["WEEKLY", "چند روز در هفته"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={frequency === value}
              onClick={() => setFreq(value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                frequency === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="habit-target">{weekly ? "چند روز در هفته؟" : "هدف در هر روز"}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="کمتر"
            disabled={target <= 1}
            onClick={() => setTarget((t) => Math.max(1, t - 1))}
          >
            <MinusIcon />
          </Button>
          <Input
            id="habit-target"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxTarget}
            value={target}
            className="h-9 w-20 text-center text-base"
            onChange={(e) => setTarget(Math.min(maxTarget, Math.max(1, Number(e.target.value) || 1)))}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="بیشتر"
            disabled={target >= maxTarget}
            onClick={() => setTarget((t) => Math.min(maxTarget, t + 1))}
          >
            <PlusIcon />
          </Button>
          {!weekly && (
            <Input
              aria-label="واحد"
              value={unit}
              maxLength={20}
              className="h-9 min-w-0 flex-1"
              onChange={(e) => setUnit(e.target.value)}
            />
          )}
        </div>
        {!weekly && (
          <div className="flex flex-wrap gap-1.5">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  u === unit ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="lg" className="h-10 px-4" onClick={onDone}>
          انصراف
        </Button>
        <Button
          type="submit"
          size="lg"
          className="h-10 px-5"
          disabled={pending || !title.trim() || !unit.trim()}
        >
          {pending && <LoaderCircleIcon className="animate-spin" />}
          افزودن عادت
        </Button>
      </div>
    </form>
  );
}

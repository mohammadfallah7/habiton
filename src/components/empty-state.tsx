import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { faNum } from "@/lib/format";
import { TEMPLATES, type HabitPreset } from "@/lib/habit-presets";

export function EmptyState({
  onPick,
  onCustom,
}: {
  onPick: (preset: HabitPreset) => void;
  onCustom: () => void;
}) {
  return (
    <Card className="animate-rise items-center gap-6 px-6 py-10 text-center shadow-sm">
      <div className="grid size-16 place-items-center rounded-3xl bg-accent text-3xl">🌱</div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">هنوز عادتی نساخته‌ای</h2>
        <p className="mx-auto max-w-sm text-sm leading-7 text-muted-foreground">
          با یک عادت کوچک شروع کن. هر روز که انجامش بدهی، زنجیره‌ات بلندتر می‌شود.
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.title}
            type="button"
            onClick={() => onPick(t)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-start transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl text-2xl"
              style={{ background: `color-mix(in srgb, ${t.color} 20%, var(--card))` }}
            >
              {t.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{t.title}</span>
              <span className="block text-xs text-muted-foreground">
                {t.frequency === "WEEKLY"
                  ? `${faNum(t.target)} روز در هفته`
                  : `${faNum(t.target)} ${t.unit} در روز`}
              </span>
            </span>
          </button>
        ))}
      </div>

      <Button variant="outline" size="lg" className="h-10 px-4" onClick={onCustom}>
        <SparklesIcon />
        ساخت عادت دلخواه
      </Button>
    </Card>
  );
}

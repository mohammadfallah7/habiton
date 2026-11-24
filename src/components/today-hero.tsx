import { FlameIcon, LayersIcon, PlusIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/progress-ring";
import { faLongDate, faNum } from "@/lib/format";
import {
  computeStats,
  dayCompletion,
  isCurrentDone,
  weekDays,
} from "@/lib/habit-logic";
import type { HabitView } from "./habit-board";

function greeting(hour: number) {
  if (hour < 5) return "شب بخیر";
  if (hour < 12) return "صبح بخیر";
  if (hour < 17) return "ظهر بخیر";
  if (hour < 20) return "عصر بخیر";
  return "شب بخیر";
}

export function TodayHero({
  name,
  today,
  hour,
  habits,
  onAdd,
}: {
  name: string;
  today: string;
  hour: number;
  habits: HabitView[];
  onAdd: () => void;
}) {
  const total = habits.length;
  const done = habits.filter((h) => isCurrentDone(h, h.logs, today)).length;
  const remaining = total - done;
  const share = total === 0 ? 0 : done / total;

  // Longest running streak, in the unit of the habit that holds it.
  let bestStreak = 0;
  let streakUnit = "روز";
  for (const h of habits) {
    const { current } = computeStats(h, h.logs, today);
    if (current > bestStreak) {
      bestStreak = current;
      streakUnit = h.frequency === "WEEKLY" ? "هفته" : "روز";
    }
  }

  // Share of daily goals met so far this week.
  let weekDone = 0;
  let weekTotal = 0;
  for (const day of weekDays(today)) {
    if (day > today) continue;
    const c = dayCompletion(habits, day);
    weekDone += c.done;
    weekTotal += c.total;
  }
  const weekRate = weekTotal === 0 ? null : Math.round((weekDone / weekTotal) * 100);

  const message =
    total === 0
      ? "اولین عادتت را بساز و زنجیره را شروع کن."
      : remaining === 0
        ? "همه‌ی کارهای امروز انجام شد. عالی بود! 🎉"
        : `${faNum(remaining)} عادت هنوز به هدفش نرسیده.`;

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-primary/25 sm:p-8">
      <div className="pointer-events-none absolute -top-24 -start-16 -z-10 size-72 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -end-10 -z-10 size-72 rounded-full bg-fuchsia-300/25 blur-3xl" />

      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 space-y-3">
          <p className="text-sm text-white/75">{faLongDate(today)}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting(hour)}، {name.split(" ")[0]} 👋
          </h1>
          <p className="max-w-md text-sm leading-7 text-white/85 sm:text-base">{message}</p>
          {total > 0 && (
            <div className="flex items-center gap-3 sm:hidden" aria-hidden>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-white/22">
                <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${share * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-white/85">
                {faNum(done)} از {faNum(total)}
              </span>
            </div>
          )}
          <Button
            onClick={onAdd}
            size="lg"
            className="mt-1 h-10 rounded-xl bg-white px-4 text-primary shadow-lg shadow-black/10 hover:bg-white/90"
          >
            <PlusIcon />
            عادت جدید
          </Button>
        </div>

        <ProgressRing
          value={share}
          size={132}
          stroke={11}
          color="white"
          track="rgb(255 255 255 / 0.22)"
          className="hidden shrink-0 sm:grid"
        >
          <div className="text-center leading-tight">
            <div className="text-3xl font-extrabold">
              {total === 0 ? (
                "—"
              ) : (
                <>
                  {faNum(done)}
                  <span className="text-lg font-semibold text-white/70">/{faNum(total)}</span>
                </>
              )}
            </div>
            <div className="text-xs text-white/75">امروز</div>
          </div>
        </ProgressRing>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        <Tile icon={<FlameIcon />} label="زنجیره فعلی" value={bestStreak > 0 ? `${faNum(bestStreak)} ${streakUnit}` : "—"} />
        <Tile icon={<TrendingUpIcon />} label="این هفته" value={weekRate === null ? "—" : `٪${faNum(weekRate)}`} />
        <Tile icon={<LayersIcon />} label="عادت فعال" value={faNum(total)} />
      </div>
    </section>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm sm:px-4 sm:py-3">
      <div className="flex items-center gap-1.5 text-xs text-white/75 [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-bold sm:text-lg">{value}</div>
    </div>
  );
}

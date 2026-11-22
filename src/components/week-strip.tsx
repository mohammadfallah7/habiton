import { CheckIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { faDayOfMonth, faNum, faWeekday, faWeekdayNarrow } from "@/lib/format";
import { dayCompletion, weekDays } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";
import type { HabitView } from "./habit-board";

export function WeekStrip({ today, habits }: { today: string; habits: HabitView[] }) {
  const days = weekDays(today);
  return (
    <Card className="animate-rise gap-0 p-3 shadow-sm sm:p-4" style={{ animationDelay: "60ms" }}>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {days.map((day) => {
          const { done, total } = dayCompletion(habits, day);
          const future = day > today;
          const isToday = day === today;
          const full = total > 0 && done === total;
          const partial = total > 0 && done > 0 && !full;
          const label = future
            ? `${faWeekday(day)}: هنوز نرسیده`
            : total === 0
              ? `${faWeekday(day)}: بدون عادت روزانه`
              : `${faWeekday(day)}: ${faNum(done)} از ${faNum(total)}`;
          return (
            <li key={day} className="flex flex-col items-center gap-1.5" title={label} aria-label={label}>
              <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                {faWeekdayNarrow(day)}
              </span>
              <span
                className={cn(
                  "relative grid size-9 place-items-center rounded-full text-xs font-bold transition-colors sm:size-11 sm:text-sm",
                  full && "bg-primary text-primary-foreground shadow-md shadow-primary/30",
                  partial && "bg-primary/20 text-primary",
                  !full && !partial && "bg-muted text-muted-foreground",
                  future && "opacity-45",
                  isToday && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
              >
                {full ? <CheckIcon className="size-4 sm:size-5" strokeWidth={3} /> : faDayOfMonth(day)}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

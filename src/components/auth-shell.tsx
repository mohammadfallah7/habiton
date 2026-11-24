import { CheckIcon, FlameIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const SAMPLE = [
  { emoji: "💧", title: "نوشیدن آب", meta: "۶ از ۸ لیوان", share: 0.75, color: "#38bdf8" },
  { emoji: "📚", title: "مطالعه", meta: "۲۰ از ۲۰ صفحه", share: 1, color: "#a78bfa" },
  { emoji: "🏃", title: "ورزش", meta: "۲ از ۳ روز", share: 0.66, color: "#34d399" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="relative flex flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>

      <aside className="relative isolate hidden overflow-hidden bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -end-24 -z-10 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -start-20 -z-10 size-96 rounded-full bg-fuchsia-300/25 blur-3xl" />

        <div className="max-w-md space-y-3">
          <h2 className="text-4xl leading-snug font-extrabold">کارهای کوچک،<br />نتیجه‌های بزرگ.</h2>
          <p className="leading-8 text-white/80">
            هر روز یک قدم. عادت‌هایت را ثبت کن، زنجیره‌ات را نگه دار و پیشرفتت را روی تقویم ببین.
          </p>
        </div>

        <div className="relative mx-auto my-10 w-full max-w-sm space-y-3">
          {SAMPLE.map((h, i) => (
            <div
              key={h.title}
              className="flex items-center gap-3 rounded-2xl bg-white/14 p-3.5 ring-1 ring-white/20 backdrop-blur-md"
              style={{ marginInlineStart: `${i * 1.5}rem`, marginInlineEnd: `${(2 - i) * 1.5}rem` }}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-white/20 text-2xl">{h.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{h.title}</div>
                <div className="text-xs text-white/75">{h.meta}</div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full" style={{ width: `${h.share * 100}%`, background: h.color }} />
                </div>
              </div>
              {h.share === 1 && (
                <span className="grid size-8 place-items-center rounded-full bg-white text-primary">
                  <CheckIcon className="size-4" strokeWidth={3} />
                </span>
              )}
            </div>
          ))}
        </div>

        <div />
      </aside>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-primary/30">
        <FlameIcon className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">ردیاب عادت</span>
    </div>
  );
}

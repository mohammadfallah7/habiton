import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { HabitBoard, type HabitView } from "@/components/habit-board";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  // The proxy only checks that a cookie exists; this is the real check.
  const session = await getSession();
  if (!session) redirect("/login");

  const habits = await db.habit.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: { logs: { select: { day: true, value: true } } },
  });

  const view: HabitView[] = habits.map((h) => ({
    id: h.id,
    title: h.title,
    emoji: h.emoji,
    color: h.color,
    target: h.target,
    unit: h.unit,
    frequency: h.frequency,
    logs: Object.fromEntries(h.logs.map((l) => [l.day, l.value])),
    startDay: h.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <>
      <AppHeader name={session.user.name} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16">
        <HabitBoard habits={view} userName={session.user.name} />
      </main>
    </>
  );
}

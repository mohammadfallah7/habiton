"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  title: z.string().trim().min(1, "یک نام وارد کنید").max(60),
  emoji: z.string().trim().min(1).max(8).default("✅"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  target: z.coerce.number().int().min(1).max(1000),
  unit: z.string().trim().min(1).max(20).default("بار"),
  frequency: z.enum(["DAILY", "WEEKLY"]),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED: ActionResult = { ok: false, error: "برای ادامه وارد شوید" };

export async function createHabit(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "عادت نامعتبر است" };
  }
  // A weekly habit can't ask for more than 7 check-in days.
  if (parsed.data.frequency === "WEEKLY" && parsed.data.target > 7) {
    return { ok: false, error: "عادت هفتگی حداکثر ۷ روز است" };
  }
  await db.habit.create({ data: { ...parsed.data, userId } });
  revalidatePath("/");
  return { ok: true };
}

const logSchema = z.object({
  habitId: z.string().min(1),
  day: z.string().regex(DAY),
  delta: z.number().int().min(-1000).max(1000),
});

/** Add (or subtract) progress for one day. The client sends its own local day. */
export async function logProgress(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  const parsed = logSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ثبت نامعتبر است" };
  const { habitId, day, delta } = parsed.data;

  // Reject days more than one day ahead of server time (covers every time zone).
  const limit = new Date(Date.now() + 36 * 3600_000).toISOString().slice(0, 10);
  if (day > limit) return { ok: false, error: "نمی‌توان روزهای آینده را ثبت کرد" };

  const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return { ok: false, error: "عادت پیدا نشد" };

  await db.$transaction(async (tx) => {
    const existing = await tx.habitLog.findUnique({
      where: { habitId_day: { habitId, day } },
    });
    const value = Math.max(0, (existing?.value ?? 0) + delta);
    if (value === 0) {
      if (existing) await tx.habitLog.delete({ where: { id: existing.id } });
    } else {
      await tx.habitLog.upsert({
        where: { habitId_day: { habitId, day } },
        create: { habitId, day, value },
        update: { value },
      });
    }
  });
  revalidatePath("/");
  return { ok: true };
}

export async function archiveHabit(habitId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  const res = await db.habit.updateMany({
    where: { id: habitId, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (res.count === 0) return { ok: false, error: "عادت پیدا نشد" };
  revalidatePath("/");
  return { ok: true };
}

export async function deleteHabit(habitId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  const res = await db.habit.deleteMany({ where: { id: habitId, userId } });
  if (res.count === 0) return { ok: false, error: "عادت پیدا نشد" };
  revalidatePath("/");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { MAX_LOG_VALUE } from "@/lib/habit-logic";
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

function parseHabit(
  input: unknown,
): { ok: true; data: z.infer<typeof createSchema> } | { ok: false; error: string } {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "عادت نامعتبر است" };
  }
  // A weekly habit can't ask for more than 7 check-in days.
  if (parsed.data.frequency === "WEEKLY" && parsed.data.target > 7) {
    return { ok: false, error: "عادت هفتگی حداکثر ۷ روز است" };
  }
  return { ok: true, data: parsed.data };
}

export async function createHabit(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  const parsed = parseHabit(input);
  if (!parsed.ok) return parsed;
  await db.habit.create({ data: { ...parsed.data, userId } });
  revalidatePath("/");
  return { ok: true };
}

export async function updateHabit(habitId: string, input: unknown): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  if (!habitId) return { ok: false, error: "عادت پیدا نشد" };
  const parsed = parseHabit(input);
  if (!parsed.ok) return parsed;
  const res = await db.habit.updateMany({
    where: { id: habitId, userId, archivedAt: null },
    data: parsed.data,
  });
  if (res.count === 0) return { ok: false, error: "عادت پیدا نشد" };
  revalidatePath("/");
  return { ok: true };
}

const logSchema = z.object({
  habitId: z.string().min(1),
  day: z.string().regex(DAY),
  delta: z.number().int().min(-MAX_LOG_VALUE).max(MAX_LOG_VALUE),
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
  if (delta === 0) return { ok: true };

  await applyLogDelta(habitId, day, delta);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Apply a delta without losing updates when two taps arrive together.
 * The increment itself is one SQL statement. A conflicting insert is retried
 * outside the aborted transaction (Postgres rejects the rest of a failed one).
 */
async function applyLogDelta(habitId: string, day: string, delta: number) {
  try {
    await db.$transaction(async (tx) => {
      const updated = await tx.habitLog.updateMany({
        where: { habitId, day },
        data: { value: { increment: delta } },
      });
      if (updated.count === 0) {
        if (delta <= 0) return;
        await tx.habitLog.create({
          data: { habitId, day, value: Math.min(delta, MAX_LOG_VALUE) },
        });
        return;
      }
      await clampStoredLog(tx, habitId, day);
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    await db.$transaction(async (tx) => {
      await tx.habitLog.update({
        where: { habitId_day: { habitId, day } },
        data: { value: { increment: delta } },
      });
      await clampStoredLog(tx, habitId, day);
    });
  }
}

async function clampStoredLog(tx: Prisma.TransactionClient, habitId: string, day: string) {
  await tx.habitLog.updateMany({
    where: { habitId, day, value: { gt: MAX_LOG_VALUE } },
    data: { value: MAX_LOG_VALUE },
  });
  await tx.habitLog.deleteMany({ where: { habitId, day, value: { lte: 0 } } });
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

export async function restoreHabit(habitId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED;
  const res = await db.habit.updateMany({
    where: { id: habitId, userId, archivedAt: { not: null } },
    data: { archivedAt: null },
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

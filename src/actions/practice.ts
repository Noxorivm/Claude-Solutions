"use server";

import { and, eq, gte, lt, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  activityDays,
  lessons,
  practiceSessions,
  techniques,
  user,
  userTechniques,
  xpEvents,
} from "@/db/schema";
import { checkAndGrantAchievements } from "@/actions/achievements";
import type { AchievementGrant } from "@/lib/achievements";
import { requireUser } from "@/lib/guards";
import { scheduleAfterPractice } from "@/lib/spaced-repetition";
import { madridDayRange, toMadridDay } from "@/lib/streak";
import { strings } from "@/lib/strings";
import { practiceXp } from "@/lib/xp";

const t = strings.practice;

const sessionSchema = z
  .object({
    durationSec: z.number().int().min(60),
    techniqueId: z.string().uuid().nullish(),
    lessonId: z.string().uuid().nullish(),
    selfRating: z.number().int().min(1).max(5).nullish(),
    notes: z.string().max(5000).nullish(),
    performedAt: z.coerce.date(),
  })
  .refine((data) => data.techniqueId || data.lessonId, {
    message: "target",
  });

export type PracticeActionResult =
  | {
      ok: true;
      xpAwarded: number;
      capped: boolean;
      retro: boolean;
      /** ISO del próximo repaso de la técnica practicada, si la hay. */
      nextReviewAt: string | null;
      newAchievements: AchievementGrant[];
    }
  | { ok: false; error: string };

type PracticeTxResult =
  | {
      ok: true;
      xpAwarded: number;
      capped: boolean;
      retro: boolean;
      nextReviewAt: string | null;
    }
  | { ok: false; error: string };

// Registrar práctica (docs/05 §Reglas de integridad 2): UNA transacción
// con insert de sesión + upsert de activity_days del día Madrid de
// performedAt + XP de práctica con tope diario (docs/03 §G1, solo si la
// sesión es de hoy) + last_practiced_at y reprogramación del repaso
// (lib/spaced-repetition, docs/03 §E4) de la técnica. mastery solo se
// edita a mano (F3-T2).
export async function recordPracticeSession(
  input: unknown,
): Promise<PracticeActionResult> {
  const session = await requireUser();
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    const targetIssue = parsed.error.issues.some(
      (issue) => issue.message === "target",
    );
    return {
      ok: false,
      error: targetIssue ? t.needTarget : strings.common.genericError,
    };
  }
  const data = parsed.data;
  const userId = session.user.id;

  const now = new Date();
  // Margen de 2 min por desfase de reloj del cliente.
  if (data.performedAt.getTime() > now.getTime() + 2 * 60 * 1000) {
    return { ok: false, error: t.futureError };
  }

  if (data.techniqueId) {
    const exists = await db
      .select({ id: techniques.id })
      .from(techniques)
      .where(eq(techniques.id, data.techniqueId))
      .limit(1);
    if (exists.length === 0) {
      return { ok: false, error: strings.common.genericError };
    }
  }
  if (data.lessonId) {
    const exists = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.id, data.lessonId))
      .limit(1);
    if (exists.length === 0) {
      return { ok: false, error: strings.common.genericError };
    }
  }

  const sessionDay = toMadridDay(data.performedAt);
  const today = toMadridDay(now);
  const retro = sessionDay !== today;

  const result = await db.transaction(async (tx): Promise<PracticeTxResult> => {
    await tx.insert(practiceSessions).values({
      userId,
      techniqueId: data.techniqueId ?? null,
      lessonId: data.lessonId ?? null,
      durationSec: data.durationSec,
      selfRating: data.selfRating ?? null,
      notes: data.notes ?? null,
      performedAt: data.performedAt,
    });

    let xpAwarded = 0;
    let capped = false;
    if (!retro) {
      const { start, end } = madridDayRange(now);
      const [{ earned }] = await tx
        .select({ earned: sum(xpEvents.amount) })
        .from(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, userId),
            eq(xpEvents.reason, "practice"),
            gte(xpEvents.createdAt, start),
            lt(xpEvents.createdAt, end),
          ),
        );
      const alreadyEarnedToday = Number(earned ?? 0);
      xpAwarded = practiceXp(data.durationSec, alreadyEarnedToday);
      capped = xpAwarded < Math.floor(data.durationSec / 60);

      if (xpAwarded > 0) {
        await tx.insert(xpEvents).values({
          userId,
          amount: xpAwarded,
          reason: "practice",
          lessonId: null,
        });
        await tx
          .update(user)
          .set({ xp: sql`${user.xp} + ${xpAwarded}` })
          .where(eq(user.id, userId));
      }
    }

    await tx
      .insert(activityDays)
      .values({
        userId,
        day: sessionDay,
        lessonsCompleted: 0,
        practiceSec: data.durationSec,
        xp: xpAwarded,
      })
      .onConflictDoUpdate({
        target: [activityDays.userId, activityDays.day],
        set: {
          practiceSec: sql`${activityDays.practiceSec} + ${data.durationSec}`,
          xp: sql`${activityDays.xp} + ${xpAwarded}`,
        },
      });

    let nextReviewAtIso: string | null = null;
    if (data.techniqueId) {
      // Reprogramación del repaso (docs/03 §E4) en la MISMA transacción.
      // mastery NO se toca nunca aquí (solo la edición manual de F3-T2).
      const currentRows = await tx
        .select({
          intervalDays: userTechniques.intervalDays,
          nextReviewAt: userTechniques.nextReviewAt,
        })
        .from(userTechniques)
        .where(
          and(
            eq(userTechniques.userId, userId),
            eq(userTechniques.techniqueId, data.techniqueId),
          ),
        )
        .limit(1);
      const current = currentRows[0];
      const schedule = scheduleAfterPractice({
        intervalDays: current?.intervalDays ?? 1,
        nextReviewAt: current?.nextReviewAt ?? null,
        selfRating: data.selfRating,
        practicedAt: data.performedAt,
      });
      nextReviewAtIso = schedule.nextReviewAt?.toISOString() ?? null;

      await tx
        .insert(userTechniques)
        .values({
          userId,
          techniqueId: data.techniqueId,
          mastery: 0,
          lastPracticedAt: data.performedAt,
          intervalDays: schedule.intervalDays,
          nextReviewAt: schedule.nextReviewAt,
        })
        .onConflictDoUpdate({
          target: [userTechniques.userId, userTechniques.techniqueId],
          set: {
            lastPracticedAt: sql`greatest(${userTechniques.lastPracticedAt}, excluded.last_practiced_at)`,
            intervalDays: schedule.intervalDays,
            nextReviewAt: schedule.nextReviewAt,
          },
        });
    }

    return {
      ok: true,
      xpAwarded,
      capped,
      retro,
      nextReviewAt: nextReviewAtIso,
    };
  });

  if (!result.ok) {
    return result;
  }

  // Logros POST-transacción: un fallo aquí se loguea y no revierte nada.
  let newAchievements: AchievementGrant[] = [];
  try {
    newAchievements = await checkAndGrantAchievements(userId);
  } catch (error) {
    console.error("[achievements] evaluación fallida", error);
  }

  revalidatePath("/app/practica");
  revalidatePath("/app");
  return { ...result, newAchievements };
}

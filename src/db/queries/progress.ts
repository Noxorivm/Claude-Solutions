import { and, eq, gte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { activityDays, practiceSessions, techniques } from "@/db/schema";
import {
  HEATMAP_WEEKS,
  weekStartMonday,
  type ActivityDayInput,
} from "@/lib/progress";
import { previousDay, toMadridDay } from "@/lib/streak";

export interface CategorySeconds {
  category: string;
  seconds: number;
}

export interface ProgressData {
  /** Días de actividad dentro del rango del heatmap. */
  activityDays: ActivityDayInput[];
  /** Segundos de práctica por categoría (solo sesiones con técnica). */
  categorySeconds: CategorySeconds[];
  /** Segundos totales de práctica, incluidas sesiones sin técnica. */
  totalSeconds: number;
}

export async function getProgressData(userId: string): Promise<ProgressData> {
  const today = toMadridDay(new Date());
  let firstMonday = weekStartMonday(today);
  for (let i = 0; i < (HEATMAP_WEEKS - 1) * 7; i += 1) {
    firstMonday = previousDay(firstMonday);
  }

  const dayRows = await db
    .select({
      day: activityDays.day,
      lessonsCompleted: activityDays.lessonsCompleted,
      practiceSec: activityDays.practiceSec,
    })
    .from(activityDays)
    .where(
      and(eq(activityDays.userId, userId), gte(activityDays.day, firstMonday)),
    );

  const categoryRows = await db
    .select({
      category: techniques.category,
      seconds: sum(practiceSessions.durationSec),
    })
    .from(practiceSessions)
    .innerJoin(techniques, eq(practiceSessions.techniqueId, techniques.id))
    .where(eq(practiceSessions.userId, userId))
    .groupBy(techniques.category)
    .orderBy(sql`sum(${practiceSessions.durationSec}) desc`);

  const [{ total }] = await db
    .select({ total: sum(practiceSessions.durationSec) })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId));

  return {
    activityDays: dayRows,
    categorySeconds: categoryRows.map((row) => ({
      category: row.category,
      seconds: Number(row.seconds ?? 0),
    })),
    totalSeconds: Number(total ?? 0),
  };
}

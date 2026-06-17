// Servicio de logros (sin "use server": helper de servidor que las
// actions invocan TRAS su transacción). Otorgar una sola vez lo
// garantiza la PK (user_id, achievement_id) + onConflictDoNothing.
import { and, count, eq, notExists, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  achievements,
  activityDays,
  lessonProgress,
  lessons,
  practiceSessions,
  userAchievements,
} from "@/db/schema";
import {
  evaluateCriteria,
  type AchievementGrant,
  type AchievementSnapshot,
} from "@/lib/achievements";
import { getRouteMapData } from "@/db/queries/route-map";
import { currentStreak, toMadridDay } from "@/lib/streak";
import { computeRouteState } from "@/lib/unlock";

async function buildSnapshot(userId: string): Promise<AchievementSnapshot> {
  const [lessonCounts] = await db
    .select({
      total: count(),
      milestones:
        sql<number>`count(*) filter (where ${lessons.type} = 'milestone')`.mapWith(
          Number,
        ),
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.status, "completed"),
      ),
    );

  const activeDayRows = await db
    .select({ day: activityDays.day })
    .from(activityDays)
    .where(
      and(
        eq(activityDays.userId, userId),
        sql`(${activityDays.lessonsCompleted} >= 1 or ${activityDays.practiceSec} >= 600)`,
      ),
    );

  const [practice] = await db
    .select({ total: sum(practiceSessions.durationSec) })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId));

  // Nivel completado = todos sus cursos obligatorios publicados al 100%
  // (la misma condición que desbloquea el siguiente nivel).
  const routeData = await getRouteMapData(userId);
  const states = computeRouteState(
    routeData.levels.map((level) => ({
      id: level.id,
      courses: routeData.courses
        .filter((course) => course.levelId === level.id)
        .map((course) => ({
          id: course.id,
          isRequired: course.isRequired,
          publishedLessons: course.publishedLessons,
          completedLessons: course.completedLessons,
        })),
    })),
    { freeRoam: false },
  );
  const completedLevels = states
    .filter(
      (state) =>
        state.requiredPublishedCourses > 0 &&
        state.requiredCompletedCourses === state.requiredPublishedCourses,
    )
    .map((state) => state.id);

  return {
    lessonsCompleted: lessonCounts?.total ?? 0,
    milestonesCompleted: lessonCounts?.milestones ?? 0,
    currentStreak: currentStreak(
      activeDayRows.map((row) => row.day),
      toMadridDay(new Date()),
    ),
    practiceSeconds: Number(practice?.total ?? 0),
    completedLevels,
  };
}

export async function checkAndGrantAchievements(
  userId: string,
): Promise<AchievementGrant[]> {
  const pending = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      name: achievements.name,
      criteria: achievements.criteria,
    })
    .from(achievements)
    .where(
      notExists(
        db
          .select({ one: sql`1` })
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.achievementId, achievements.id),
              eq(userAchievements.userId, userId),
            ),
          ),
      ),
    );
  if (pending.length === 0) {
    return [];
  }

  const snapshot = await buildSnapshot(userId);
  const earned = pending.filter((achievement) =>
    evaluateCriteria(achievement.criteria, snapshot),
  );
  if (earned.length === 0) {
    return [];
  }

  await db
    .insert(userAchievements)
    .values(
      earned.map((achievement) => ({
        userId,
        achievementId: achievement.id,
        earnedAt: new Date(),
      })),
    )
    .onConflictDoNothing();

  revalidatePath("/app/perfil");
  revalidatePath("/app");
  return earned.map(({ slug, name }) => ({ slug, name }));
}

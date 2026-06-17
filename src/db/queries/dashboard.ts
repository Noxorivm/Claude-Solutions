import { and, eq, gte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  activityDays,
  courses,
  lessonProgress,
  lessons,
  modules,
  user,
} from "@/db/schema";
import { getCourseDetail } from "@/db/queries/course-detail";
import { getRouteMapData } from "@/db/queries/route-map";
import { computeLessonFlow } from "@/lib/lesson-flow";
import { weekStartMonday } from "@/lib/progress";
import { toMadridDay } from "@/lib/streak";
import { computeRouteState } from "@/lib/unlock";

export interface ContinueTarget {
  courseSlug: string;
  courseTitle: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonType: "article" | "video" | "practice" | "quiz" | "milestone";
  durationMin: number | null;
  /** true si el usuario aún no tiene ningún progreso. */
  isNew: boolean;
}

export interface DashboardData {
  continueTarget: ContinueTarget | null;
  /** Días "YYYY-MM-DD" (Madrid) que cuentan para la racha (docs/03-4). */
  activeDays: string[];
  /** Actividad de la semana en curso para la mini-gráfica. */
  weekActivity: Array<{
    day: string;
    lessonsCompleted: number;
    practiceSec: number;
  }>;
  xp: number;
}

export async function getDashboardData(
  userId: string,
  freeRoam: boolean,
): Promise<DashboardData> {
  const [userRow] = await db
    .select({ xp: user.xp })
    .from(user)
    .where(eq(user.id, userId));
  const xp = userRow?.xp ?? 0;

  // Regla docs/03-4: el día cuenta con lección completada O >= 10 min.
  const dayRows = await db
    .select({ day: activityDays.day })
    .from(activityDays)
    .where(
      and(
        eq(activityDays.userId, userId),
        or(
          gte(activityDays.lessonsCompleted, 1),
          gte(activityDays.practiceSec, 600),
        ),
      ),
    );
  const activeDays = dayRows.map((row) => row.day);

  const weekActivity = await db
    .select({
      day: activityDays.day,
      lessonsCompleted: activityDays.lessonsCompleted,
      practiceSec: activityDays.practiceSec,
    })
    .from(activityDays)
    .where(
      and(
        eq(activityDays.userId, userId),
        gte(activityDays.day, weekStartMonday(toMadridDay(new Date()))),
      ),
    );

  // Curso candidato: el del progreso más reciente y, si no tiene
  // pendientes (o no hay progreso), el primer curso desbloqueado con
  // pendientes en orden de ruta.
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
    { freeRoam },
  );
  const statusByCourseId = new Map(
    states.flatMap((level) =>
      level.courses.map((course) => [course.id, course.status] as const),
    ),
  );

  const recentRows = await db
    .select({ courseSlug: courses.slug })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessons.status, "published"),
        eq(courses.status, "published"),
      ),
    )
    .orderBy(sql`${lessonProgress.completedAt} desc nulls last`)
    .limit(1);
  const isNew = recentRows.length === 0;

  const navigable = (courseId: string): boolean => {
    const status = statusByCourseId.get(courseId);
    return status === "available" || status === "in_progress";
  };

  const candidateSlugs: string[] = [];
  const recentSlug = recentRows[0]?.courseSlug;
  if (recentSlug) {
    const recentCourse = routeData.courses.find(
      (course) => course.slug === recentSlug,
    );
    if (recentCourse && navigable(recentCourse.id)) {
      candidateSlugs.push(recentSlug);
    }
  }
  for (const course of routeData.courses) {
    if (
      navigable(course.id) &&
      course.publishedLessons > 0 &&
      course.completedLessons < course.publishedLessons
    ) {
      candidateSlugs.push(course.slug);
    }
  }

  for (const slug of [...new Set(candidateSlugs)]) {
    const detail = await getCourseDetail(slug, userId);
    if (!detail) {
      continue;
    }
    const flow = computeLessonFlow(
      detail.modules.map((mod) => ({
        order: mod.order,
        lessons: mod.lessons.map((lesson) => ({
          slug: lesson.slug,
          order: lesson.order,
          completed: lesson.completed,
        })),
      })),
      { freeRoam },
    );
    if (!flow.nextPendingSlug) {
      continue;
    }
    const lesson = detail.modules
      .flatMap((mod) => mod.lessons)
      .find((candidate) => candidate.slug === flow.nextPendingSlug);
    if (!lesson) {
      continue;
    }
    return {
      xp,
      activeDays,
      weekActivity,
      continueTarget: {
        courseSlug: detail.slug,
        courseTitle: detail.title,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        lessonType: lesson.type,
        durationMin: lesson.durationMin,
        isNew,
      },
    };
  }

  return { xp, activeDays, weekActivity, continueTarget: null };
}

import { and, asc, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import {
  courses,
  lessons,
  modules,
  practiceSessions,
  techniques,
  userTechniques,
} from "@/db/schema";
import { weekStartMonday } from "@/lib/progress";
import { madridDayRange, madridMidnightUtc, toMadridDay } from "@/lib/streak";

export interface PracticeTechniqueOption {
  id: string;
  name: string;
  category: string;
}

export interface PracticeLessonOption {
  id: string;
  title: string;
  courseTitle: string;
}

export interface PracticeFormOptions {
  techniques: PracticeTechniqueOption[];
  lessons: PracticeLessonOption[];
  /** Ids de técnicas con repaso vencido (grupo "Para repasar hoy"). */
  dueTechniqueIds: string[];
}

export async function getPracticeFormOptions(
  userId: string,
): Promise<PracticeFormOptions> {
  const techniqueRows = await db
    .select({
      id: techniques.id,
      name: techniques.name,
      category: techniques.category,
    })
    .from(techniques)
    .orderBy(asc(techniques.category), asc(techniques.name));

  const due = await getDueTechniques(userId);
  const dueTechniqueIds = due.map((row) => row.id);

  const lessonRows = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      courseTitle: courses.title,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(
      and(eq(lessons.status, "published"), eq(courses.status, "published")),
    )
    .orderBy(
      asc(courses.levelId),
      asc(courses.orderInLevel),
      asc(modules.order),
      asc(lessons.order),
    );

  return { techniques: techniqueRows, lessons: lessonRows, dueTechniqueIds };
}

export interface DueTechniqueRow {
  id: string;
  slug: string;
  name: string;
  nextReviewAt: Date;
  /** Días naturales (Madrid) de retraso; 0 si vence hoy. */
  daysOverdue: number;
}

/** Técnicas con repaso vencido a fin de hoy (Madrid), las más atrasadas
 *  primero (docs/03 §E4). */
export async function getDueTechniques(
  userId: string,
): Promise<DueTechniqueRow[]> {
  const now = new Date();
  const { end } = madridDayRange(now);
  const rows = await db
    .select({
      id: techniques.id,
      slug: techniques.slug,
      name: techniques.name,
      nextReviewAt: userTechniques.nextReviewAt,
    })
    .from(userTechniques)
    .innerJoin(techniques, eq(userTechniques.techniqueId, techniques.id))
    .where(
      and(
        eq(userTechniques.userId, userId),
        lt(userTechniques.nextReviewAt, end),
      ),
    )
    .orderBy(asc(userTechniques.nextReviewAt));

  const today = toMadridDay(now);
  return rows
    .filter(
      (row): row is typeof row & { nextReviewAt: Date } =>
        row.nextReviewAt !== null,
    )
    .map((row) => {
      const dueDay = toMadridDay(row.nextReviewAt);
      const diff = Math.max(
        0,
        Math.round(
          (Date.UTC(
            Number(today.slice(0, 4)),
            Number(today.slice(5, 7)) - 1,
            Number(today.slice(8, 10)),
          ) -
            Date.UTC(
              Number(dueDay.slice(0, 4)),
              Number(dueDay.slice(5, 7)) - 1,
              Number(dueDay.slice(8, 10)),
            )) /
            86_400_000,
        ),
      );
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        nextReviewAt: row.nextReviewAt,
        daysOverdue: diff,
      };
    });
}

export interface PracticeHistoryRow {
  id: string;
  performedAt: Date;
  durationSec: number;
  selfRating: number | null;
  techniqueName: string | null;
  lessonTitle: string | null;
}

export interface PracticeHistory {
  todaySessions: PracticeHistoryRow[];
  weekSessions: PracticeHistoryRow[];
  todaySec: number;
  weekSec: number;
}

export async function getPracticeHistory(
  userId: string,
): Promise<PracticeHistory> {
  const today = toMadridDay(new Date());
  const weekStartUtc = madridMidnightUtc(weekStartMonday(today));

  const rows = await db
    .select({
      id: practiceSessions.id,
      performedAt: practiceSessions.performedAt,
      durationSec: practiceSessions.durationSec,
      selfRating: practiceSessions.selfRating,
      techniqueName: techniques.name,
      lessonTitle: lessons.title,
    })
    .from(practiceSessions)
    .leftJoin(techniques, eq(practiceSessions.techniqueId, techniques.id))
    .leftJoin(lessons, eq(practiceSessions.lessonId, lessons.id))
    .where(
      and(
        eq(practiceSessions.userId, userId),
        gte(practiceSessions.performedAt, weekStartUtc),
      ),
    )
    .orderBy(desc(practiceSessions.performedAt));

  const todaySessions = rows.filter(
    (row) => toMadridDay(row.performedAt) === today,
  );
  const weekSessions = rows.filter(
    (row) => toMadridDay(row.performedAt) !== today,
  );
  const sumSec = (list: PracticeHistoryRow[]) =>
    list.reduce((acc, row) => acc + row.durationSec, 0);

  return {
    todaySessions,
    weekSessions,
    todaySec: sumSec(todaySessions),
    weekSec: sumSec(rows),
  };
}

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  courses,
  lessonProgress,
  lessons,
  lessonTechniques,
  levels,
  modules,
  practiceSessions,
  techniques,
  userTechniques,
} from "@/db/schema";

export interface TechniqueListRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  levelNumber: number;
  mastery: number | null;
  lastPracticedAt: Date | null;
  nextReviewAt: Date | null;
}

export async function getTechniquesList(
  userId: string,
): Promise<TechniqueListRow[]> {
  return db
    .select({
      id: techniques.id,
      slug: techniques.slug,
      name: techniques.name,
      category: techniques.category,
      levelNumber: techniques.levelNumber,
      mastery: userTechniques.mastery,
      lastPracticedAt: userTechniques.lastPracticedAt,
      nextReviewAt: userTechniques.nextReviewAt,
    })
    .from(techniques)
    .leftJoin(
      userTechniques,
      and(
        eq(userTechniques.techniqueId, techniques.id),
        eq(userTechniques.userId, userId),
      ),
    )
    .orderBy(asc(techniques.category), asc(techniques.name));
}

export interface TechniqueLessonRow {
  slug: string;
  title: string;
  completed: boolean;
}

export interface TechniqueSessionRow {
  id: string;
  performedAt: Date;
  durationSec: number;
  selfRating: number | null;
  notes: string | null;
}

export interface TechniqueDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  levelNumber: number;
  levelName: string;
  descriptionMd: string | null;
  mastery: number;
  lastPracticedAt: Date | null;
  nextReviewAt: Date | null;
  lessons: TechniqueLessonRow[];
  sessions: TechniqueSessionRow[];
}

export async function getTechniqueDetail(
  slug: string,
  userId: string,
): Promise<TechniqueDetail | null> {
  const rows = await db
    .select({
      id: techniques.id,
      slug: techniques.slug,
      name: techniques.name,
      category: techniques.category,
      levelNumber: techniques.levelNumber,
      levelName: levels.name,
      descriptionMd: techniques.descriptionMd,
      mastery: userTechniques.mastery,
      lastPracticedAt: userTechniques.lastPracticedAt,
      nextReviewAt: userTechniques.nextReviewAt,
    })
    .from(techniques)
    .innerJoin(levels, eq(techniques.levelNumber, levels.id))
    .leftJoin(
      userTechniques,
      and(
        eq(userTechniques.techniqueId, techniques.id),
        eq(userTechniques.userId, userId),
      ),
    )
    .where(eq(techniques.slug, slug))
    .limit(1);
  const technique = rows[0];
  if (!technique) {
    return null;
  }

  const lessonRows = await db
    .select({
      slug: lessons.slug,
      title: lessons.title,
      progressStatus: lessonProgress.status,
    })
    .from(lessonTechniques)
    .innerJoin(lessons, eq(lessonTechniques.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(
      and(
        eq(lessonTechniques.techniqueId, technique.id),
        eq(lessons.status, "published"),
        eq(courses.status, "published"),
      ),
    )
    .orderBy(
      asc(courses.levelId),
      asc(courses.orderInLevel),
      asc(lessons.order),
    );

  const sessionRows = await db
    .select({
      id: practiceSessions.id,
      performedAt: practiceSessions.performedAt,
      durationSec: practiceSessions.durationSec,
      selfRating: practiceSessions.selfRating,
      notes: practiceSessions.notes,
    })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.techniqueId, technique.id),
      ),
    )
    .orderBy(desc(practiceSessions.performedAt))
    .limit(20);

  return {
    id: technique.id,
    slug: technique.slug,
    name: technique.name,
    category: technique.category,
    levelNumber: technique.levelNumber,
    levelName: technique.levelName,
    descriptionMd: technique.descriptionMd,
    mastery: technique.mastery ?? 0,
    lastPracticedAt: technique.lastPracticedAt,
    nextReviewAt: technique.nextReviewAt,
    lessons: lessonRows.map((row) => ({
      slug: row.slug,
      title: row.title,
      completed: row.progressStatus === "completed",
    })),
    sessions: sessionRows,
  };
}

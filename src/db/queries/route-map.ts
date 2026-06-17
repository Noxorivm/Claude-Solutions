import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { courses, lessonProgress, lessons, levels, modules } from "@/db/schema";

export interface RouteMapLevelRow {
  id: number;
  name: string;
  tagline: string;
  descriptionMd: string | null;
}

export interface RouteMapCourseRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  levelId: number;
  isRequired: boolean;
  orderInLevel: number;
  publishedLessons: number;
  completedLessons: number;
}

/**
 * Datos del mapa de ruta: los 6 niveles y, por curso published, los counts
 * de lecciones published y completadas por el usuario. Solo contenido
 * published cuenta (docs/05). La lógica de desbloqueo vive en lib/unlock.
 */
export async function getRouteMapData(userId: string): Promise<{
  levels: RouteMapLevelRow[];
  courses: RouteMapCourseRow[];
}> {
  const levelRows = await db
    .select({
      id: levels.id,
      name: levels.name,
      tagline: levels.tagline,
      descriptionMd: levels.descriptionMd,
    })
    .from(levels)
    .orderBy(asc(levels.id));

  const courseRows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      summary: courses.summary,
      levelId: courses.levelId,
      isRequired: courses.isRequired,
      orderInLevel: courses.orderInLevel,
      publishedLessons:
        sql<number>`count(${lessons.id}) filter (where ${lessons.status} = 'published')`.mapWith(
          Number,
        ),
      completedLessons:
        sql<number>`count(${lessonProgress.lessonId}) filter (where ${lessons.status} = 'published' and ${lessonProgress.status} = 'completed')`.mapWith(
          Number,
        ),
    })
    .from(courses)
    .leftJoin(modules, eq(modules.courseId, courses.id))
    .leftJoin(lessons, eq(lessons.moduleId, modules.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(eq(courses.status, "published"))
    .groupBy(courses.id)
    .orderBy(asc(courses.levelId), asc(courses.orderInLevel));

  return { levels: levelRows, courses: courseRows };
}

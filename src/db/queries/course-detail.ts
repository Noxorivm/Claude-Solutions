import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { courses, lessonProgress, lessons, modules } from "@/db/schema";

export interface CourseDetailLesson {
  id: string;
  slug: string;
  title: string;
  type: "article" | "video" | "practice" | "quiz" | "milestone";
  durationMin: number | null;
  order: number;
  completed: boolean;
}

export interface CourseDetailModule {
  id: string;
  title: string;
  order: number;
  lessons: CourseDetailLesson[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  estHours: string | null;
  levelId: number;
  modules: CourseDetailModule[];
}

/**
 * Curso published por slug con módulos y lecciones published en orden,
 * más el progreso del usuario. Draft o inexistente → null (la página
 * hace notFound()). La secuencialidad vive en lib/lesson-flow.
 */
export async function getCourseDetail(
  slug: string,
  userId: string,
): Promise<CourseDetail | null> {
  const courseRows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      summary: courses.summary,
      estHours: courses.estHours,
      levelId: courses.levelId,
    })
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.status, "published")))
    .limit(1);

  const course = courseRows[0];
  if (!course) {
    return null;
  }

  const rows = await db
    .select({
      moduleId: modules.id,
      moduleTitle: modules.title,
      moduleOrder: modules.order,
      lessonId: lessons.id,
      lessonSlug: lessons.slug,
      lessonTitle: lessons.title,
      lessonType: lessons.type,
      durationMin: lessons.durationMin,
      lessonOrder: lessons.order,
      progressStatus: lessonProgress.status,
    })
    .from(modules)
    .leftJoin(
      lessons,
      and(eq(lessons.moduleId, modules.id), eq(lessons.status, "published")),
    )
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(eq(modules.courseId, course.id))
    .orderBy(asc(modules.order), asc(lessons.order));

  const moduleMap = new Map<string, CourseDetailModule>();
  for (const row of rows) {
    let mod = moduleMap.get(row.moduleId);
    if (!mod) {
      mod = {
        id: row.moduleId,
        title: row.moduleTitle,
        order: row.moduleOrder,
        lessons: [],
      };
      moduleMap.set(row.moduleId, mod);
    }
    if (row.lessonId && row.lessonSlug && row.lessonTitle && row.lessonType) {
      mod.lessons.push({
        id: row.lessonId,
        slug: row.lessonSlug,
        title: row.lessonTitle,
        type: row.lessonType,
        durationMin: row.durationMin,
        order: row.lessonOrder ?? 0,
        completed: row.progressStatus === "completed",
      });
    }
  }

  return { ...course, modules: [...moduleMap.values()] };
}

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  checklistProgress,
  courses,
  lessonChecklistItems,
  lessonResources,
  lessons,
  modules,
  notes,
} from "@/db/schema";
import { getCourseDetail, type CourseDetail } from "@/db/queries/course-detail";

export interface LessonResourceRow {
  id: string;
  kind: "pdf" | "image" | "link" | "file";
  title: string;
  url: string;
}

export interface LessonChecklistRow {
  id: string;
  text: string;
  checked: boolean;
}

export interface LessonDetail {
  lesson: {
    id: string;
    slug: string;
    title: string;
    type: "article" | "video" | "practice" | "quiz" | "milestone";
    contentMd: string | null;
    videoUrl: string | null;
    durationMin: number | null;
  };
  moduleTitle: string;
  /** Curso completo con progreso del usuario (alimenta lesson-flow). */
  course: CourseDetail;
  resources: LessonResourceRow[];
  /** Criterios de la checklist con el estado del usuario, en orden. */
  checklist: LessonChecklistRow[];
  /** Nota privada del usuario para esta lección. */
  noteContent: string | null;
}

/**
 * Lección published por slug (de un curso published) con su módulo, el
 * curso completo con progreso y los recursos ordenados. Draft o
 * inexistente → null (la página hace notFound()).
 */
export async function getLessonDetail(
  slug: string,
  userId: string,
): Promise<LessonDetail | null> {
  const rows = await db
    .select({
      id: lessons.id,
      slug: lessons.slug,
      title: lessons.title,
      type: lessons.type,
      contentMd: lessons.contentMd,
      videoUrl: lessons.videoUrl,
      durationMin: lessons.durationMin,
      moduleTitle: modules.title,
      courseSlug: courses.slug,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(
      and(
        eq(lessons.slug, slug),
        eq(lessons.status, "published"),
        eq(courses.status, "published"),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const course = await getCourseDetail(row.courseSlug, userId);
  if (!course) {
    return null;
  }

  const resources = await db
    .select({
      id: lessonResources.id,
      kind: lessonResources.kind,
      title: lessonResources.title,
      url: lessonResources.url,
    })
    .from(lessonResources)
    .where(eq(lessonResources.lessonId, row.id))
    .orderBy(asc(lessonResources.order));

  const checklist = await db
    .select({
      id: lessonChecklistItems.id,
      text: lessonChecklistItems.text,
      checkedAt: checklistProgress.checkedAt,
    })
    .from(lessonChecklistItems)
    .leftJoin(
      checklistProgress,
      and(
        eq(checklistProgress.itemId, lessonChecklistItems.id),
        eq(checklistProgress.userId, userId),
      ),
    )
    .where(eq(lessonChecklistItems.lessonId, row.id))
    .orderBy(asc(lessonChecklistItems.order));

  const noteRows = await db
    .select({ contentMd: notes.contentMd })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, row.id)))
    .limit(1);

  return {
    lesson: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      type: row.type,
      contentMd: row.contentMd,
      videoUrl: row.videoUrl,
      durationMin: row.durationMin,
    },
    moduleTitle: row.moduleTitle,
    course,
    resources,
    checklist: checklist.map((item) => ({
      id: item.id,
      text: item.text,
      checked: item.checkedAt !== null,
    })),
    noteContent: noteRows[0]?.contentMd ?? null,
  };
}

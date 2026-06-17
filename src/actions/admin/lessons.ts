"use server";

import { and, asc, desc, eq, gt, inArray, lt, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  flattenErrors,
  lessonsHaveProgress,
  uniqueViolationMessage,
  type AdminDeleteResult,
  type AdminMutationResult,
} from "@/actions/admin/shared";
import { db } from "@/db";
import {
  checklistProgress,
  courses,
  lessonChecklistItems,
  lessonResources,
  lessons,
  lessonTechniques,
  milestoneSubmissions,
  modules,
  quizAttempts,
  quizQuestions,
  quizzes,
  techniques,
} from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";
import { parseVideoUrl } from "@/lib/video";
import {
  checklistItemSchema,
  lessonSchema,
  resourceSchema,
} from "@/lib/validators/content";

const t = strings.admin;

const LESSON_UNIQUE_MESSAGES = {
  module_order: t.lessonOrderTaken,
  slug: t.lessonSlugTaken,
};

/** Revalida las vistas afectadas por una lección (admin + alumno). */
function revalidateLesson(lessonSlug: string, courseSlug: string): void {
  revalidatePath("/admin/lecciones");
  revalidatePath(`/admin/lecciones/${lessonSlug}`);
  revalidatePath(`/app/leccion/${lessonSlug}`);
  revalidatePath(`/app/cursos/${courseSlug}`);
  revalidatePath("/app/ruta");
  revalidatePath("/app");
  // Las fichas de técnica listan lecciones asociadas.
  revalidatePath("/app/tecnicas", "layout");
}

async function courseSlugOfModule(moduleId: string): Promise<string | null> {
  const rows = await db
    .select({ slug: courses.slug })
    .from(modules)
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(modules.id, moduleId))
    .limit(1);
  return rows[0]?.slug ?? null;
}

interface LessonRef {
  id: string;
  slug: string;
  moduleId: string;
  type: string;
  courseSlug: string;
}

async function lessonRef(id: string): Promise<LessonRef | null> {
  const rows = await db
    .select({
      id: lessons.id,
      slug: lessons.slug,
      moduleId: lessons.moduleId,
      type: lessons.type,
      courseSlug: courses.slug,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);
  return rows[0] ?? null;
}

async function lessonRefOfItem(itemId: string): Promise<LessonRef | null> {
  const rows = await db
    .select({ lessonId: lessonChecklistItems.lessonId })
    .from(lessonChecklistItems)
    .where(eq(lessonChecklistItems.id, itemId))
    .limit(1);
  return rows[0] ? lessonRef(rows[0].lessonId) : null;
}

async function lessonRefOfResource(
  resourceId: string,
): Promise<LessonRef | null> {
  const rows = await db
    .select({ lessonId: lessonResources.lessonId })
    .from(lessonResources)
    .where(eq(lessonResources.id, resourceId))
    .limit(1);
  return rows[0] ? lessonRef(rows[0].lessonId) : null;
}

/** El cambio de tipo rompería el quiz o las entregas de hito existentes. */
async function typeChangeBlocked(lessonId: string): Promise<boolean> {
  const checks = await Promise.all([
    db
      .select({ one: sql`1` })
      .from(quizQuestions)
      .innerJoin(quizzes, eq(quizQuestions.quizId, quizzes.id))
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(milestoneSubmissions)
      .where(eq(milestoneSubmissions.lessonId, lessonId))
      .limit(1),
  ]);
  return checks.some((rows) => rows.length > 0);
}

function lessonValues(data: z.infer<typeof lessonSchema>) {
  const videoUrl = data.videoUrl?.trim() || null;
  return {
    title: data.title,
    slug: data.slug,
    moduleId: data.moduleId,
    type: data.type,
    contentMd: data.contentMd?.trim() || null,
    videoUrl,
    // SIEMPRE derivado en servidor; nunca se confía del cliente.
    videoProvider: parseVideoUrl(videoUrl)?.provider ?? null,
    durationMin: data.durationMin ?? null,
    xpOverride: data.xpOverride ?? null,
    status: data.status,
  };
}

export async function createLesson(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const courseSlug = await courseSlugOfModule(parsed.data.moduleId);
  if (!courseSlug) {
    return { ok: false, error: strings.common.genericError };
  }

  try {
    await db.transaction(async (tx) => {
      const [{ maxOrder }] = await tx
        .select({ maxOrder: max(lessons.order) })
        .from(lessons)
        .where(eq(lessons.moduleId, parsed.data.moduleId));
      await tx.insert(lessons).values({
        ...lessonValues(parsed.data),
        order: (maxOrder ?? 0) + 1,
      });
    });
  } catch (error) {
    const message = uniqueViolationMessage(error, LESSON_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateLesson(parsed.data.slug, courseSlug);
  return { ok: true, slug: parsed.data.slug };
}

const updateLessonSchema = lessonSchema.extend({ id: z.string().uuid() });

export async function updateLesson(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = updateLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const data = parsed.data;
  const existing = await lessonRef(data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  if (existing.type !== data.type && (await typeChangeBlocked(data.id))) {
    return { ok: false, error: t.lessonTypeLocked };
  }

  const newCourseSlug =
    existing.moduleId === data.moduleId
      ? existing.courseSlug
      : await courseSlugOfModule(data.moduleId);
  if (!newCourseSlug) {
    return { ok: false, error: strings.common.genericError };
  }

  try {
    await db.transaction(async (tx) => {
      const values = lessonValues(data);
      if (existing.moduleId !== data.moduleId) {
        // Cambio de módulo: pasa al final del módulo destino.
        const [{ maxOrder }] = await tx
          .select({ maxOrder: max(lessons.order) })
          .from(lessons)
          .where(eq(lessons.moduleId, data.moduleId));
        await tx
          .update(lessons)
          .set({ ...values, order: (maxOrder ?? 0) + 1 })
          .where(eq(lessons.id, data.id));
      } else {
        await tx.update(lessons).set(values).where(eq(lessons.id, data.id));
      }
    });
  } catch (error) {
    const message = uniqueViolationMessage(error, LESSON_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateLesson(existing.slug, existing.courseSlug);
  if (existing.slug !== data.slug || existing.courseSlug !== newCourseSlug) {
    revalidateLesson(data.slug, newCourseSlug);
  }
  return { ok: true, slug: data.slug };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function setLessonStatus(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRef(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }
  await db
    .update(lessons)
    .set({ status: parsed.data.status })
    .where(eq(lessons.id, parsed.data.id));
  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true, slug: existing.slug };
}

export async function archiveLesson(
  input: unknown,
): Promise<AdminMutationResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  return setLessonStatus({ id: parsed.data.id, status: "archived" });
}

export async function deleteLesson(input: unknown): Promise<AdminDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRef(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  if (await lessonsHaveProgress([parsed.data.id])) {
    return { ok: false, reason: "has_progress" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(lessons).where(eq(lessons.id, parsed.data.id));
  });

  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

// ---------- checklist ----------

const addItemSchema = checklistItemSchema.extend({
  lessonId: z.string().uuid(),
});

export async function addChecklistItem(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const existing = await lessonRef(parsed.data.lessonId);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  await db.transaction(async (tx) => {
    const [{ maxOrder }] = await tx
      .select({ maxOrder: max(lessonChecklistItems.order) })
      .from(lessonChecklistItems)
      .where(eq(lessonChecklistItems.lessonId, parsed.data.lessonId));
    await tx.insert(lessonChecklistItems).values({
      lessonId: parsed.data.lessonId,
      text: parsed.data.text,
      order: (maxOrder ?? 0) + 1,
    });
  });

  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

const updateItemSchema = checklistItemSchema.extend({ id: z.string().uuid() });

export async function updateChecklistItemText(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const existing = await lessonRefOfItem(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }
  await db
    .update(lessonChecklistItems)
    .set({ text: parsed.data.text })
    .where(eq(lessonChecklistItems.id, parsed.data.id));
  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

/** Un item con checks de alumnos —o la rúbrica de un hito con entregas—
 *  no se puede borrar: cambiaría el histórico bajo sus pies. */
async function itemDeleteBlocked(
  itemId: string,
  lesson: LessonRef,
): Promise<boolean> {
  const hasChecks = await db
    .select({ one: sql`1` })
    .from(checklistProgress)
    .where(eq(checklistProgress.itemId, itemId))
    .limit(1);
  if (hasChecks.length > 0) {
    return true;
  }
  if (lesson.type === "milestone") {
    const hasSubmissions = await db
      .select({ one: sql`1` })
      .from(milestoneSubmissions)
      .where(eq(milestoneSubmissions.lessonId, lesson.id))
      .limit(1);
    return hasSubmissions.length > 0;
  }
  return false;
}

export async function deleteChecklistItem(
  input: unknown,
): Promise<AdminDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRefOfItem(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  if (await itemDeleteBlocked(parsed.data.id, existing)) {
    return { ok: false, reason: "has_progress" };
  }

  await db
    .delete(lessonChecklistItems)
    .where(eq(lessonChecklistItems.id, parsed.data.id));
  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

const moveSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export async function moveChecklistItem(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRefOfItem(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  await db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: lessonChecklistItems.id,
        order: lessonChecklistItems.order,
      })
      .from(lessonChecklistItems)
      .where(eq(lessonChecklistItems.id, parsed.data.id))
      .limit(1);
    if (!item) {
      return;
    }
    const neighbor = await tx
      .select({
        id: lessonChecklistItems.id,
        order: lessonChecklistItems.order,
      })
      .from(lessonChecklistItems)
      .where(
        and(
          eq(lessonChecklistItems.lessonId, existing.id),
          parsed.data.direction === "up"
            ? lt(lessonChecklistItems.order, item.order)
            : gt(lessonChecklistItems.order, item.order),
        ),
      )
      .orderBy(
        parsed.data.direction === "up"
          ? desc(lessonChecklistItems.order)
          : asc(lessonChecklistItems.order),
      )
      .limit(1);
    if (!neighbor[0]) {
      return; // ya está en el extremo
    }
    await tx
      .update(lessonChecklistItems)
      .set({ order: neighbor[0].order })
      .where(eq(lessonChecklistItems.id, item.id));
    await tx
      .update(lessonChecklistItems)
      .set({ order: item.order })
      .where(eq(lessonChecklistItems.id, neighbor[0].id));
  });

  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

// ---------- técnicas ----------

const setTechniquesSchema = z.object({
  lessonId: z.string().uuid(),
  techniqueIds: z.array(z.string().uuid()).max(100),
});

export async function setLessonTechniques(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = setTechniquesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRef(parsed.data.lessonId);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }
  if (parsed.data.techniqueIds.length > 0) {
    const valid = await db
      .select({ id: techniques.id })
      .from(techniques)
      .where(inArray(techniques.id, parsed.data.techniqueIds));
    if (valid.length !== parsed.data.techniqueIds.length) {
      return { ok: false, error: strings.common.genericError };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(lessonTechniques)
      .where(eq(lessonTechniques.lessonId, parsed.data.lessonId));
    if (parsed.data.techniqueIds.length > 0) {
      await tx.insert(lessonTechniques).values(
        parsed.data.techniqueIds.map((techniqueId) => ({
          lessonId: parsed.data.lessonId,
          techniqueId,
        })),
      );
    }
  });

  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

// ---------- recursos ----------

const addResourceSchema = resourceSchema.extend({
  lessonId: z.string().uuid(),
});

export async function addResource(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = addResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const existing = await lessonRef(parsed.data.lessonId);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  await db.transaction(async (tx) => {
    const [{ maxOrder }] = await tx
      .select({ maxOrder: max(lessonResources.order) })
      .from(lessonResources)
      .where(eq(lessonResources.lessonId, parsed.data.lessonId));
    await tx.insert(lessonResources).values({
      lessonId: parsed.data.lessonId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      url: parsed.data.url,
      order: (maxOrder ?? 0) + 1,
    });
  });

  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

const updateResourceSchema = resourceSchema.extend({ id: z.string().uuid() });

export async function updateResource(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = updateResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const existing = await lessonRefOfResource(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }
  await db
    .update(lessonResources)
    .set({
      kind: parsed.data.kind,
      title: parsed.data.title,
      url: parsed.data.url,
    })
    .where(eq(lessonResources.id, parsed.data.id));
  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

export async function deleteResource(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRefOfResource(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }
  await db
    .delete(lessonResources)
    .where(eq(lessonResources.id, parsed.data.id));
  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

export async function moveResource(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await lessonRefOfResource(parsed.data.id);
  if (!existing) {
    return { ok: false, error: strings.common.genericError };
  }

  await db.transaction(async (tx) => {
    const [resource] = await tx
      .select({ id: lessonResources.id, order: lessonResources.order })
      .from(lessonResources)
      .where(eq(lessonResources.id, parsed.data.id))
      .limit(1);
    if (!resource) {
      return;
    }
    const neighbor = await tx
      .select({ id: lessonResources.id, order: lessonResources.order })
      .from(lessonResources)
      .where(
        and(
          eq(lessonResources.lessonId, existing.id),
          parsed.data.direction === "up"
            ? lt(lessonResources.order, resource.order)
            : gt(lessonResources.order, resource.order),
        ),
      )
      .orderBy(
        parsed.data.direction === "up"
          ? desc(lessonResources.order)
          : asc(lessonResources.order),
      )
      .limit(1);
    if (!neighbor[0]) {
      return;
    }
    await tx
      .update(lessonResources)
      .set({ order: neighbor[0].order })
      .where(eq(lessonResources.id, resource.id));
    await tx
      .update(lessonResources)
      .set({ order: resource.order })
      .where(eq(lessonResources.id, neighbor[0].id));
  });

  revalidateLesson(existing.slug, existing.courseSlug);
  return { ok: true };
}

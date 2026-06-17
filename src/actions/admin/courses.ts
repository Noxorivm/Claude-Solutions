"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  flattenErrors,
  lessonIdsOfCourse,
  lessonIdsOfModule,
  lessonsHaveProgress,
  uniqueViolationMessage,
  type AdminDeleteResult,
  type AdminMutationResult,
} from "@/actions/admin/shared";
import { db } from "@/db";
import { courses, modules } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";
import { courseSchema, moduleSchema } from "@/lib/validators/content";

const t = strings.admin;

export type {
  AdminDeleteResult,
  AdminMutationResult,
  FieldErrors,
} from "@/actions/admin/shared";

const COURSE_UNIQUE_MESSAGES = {
  level_order: t.courseOrderTaken,
  course_order: t.moduleOrderTaken,
  slug: t.slugTaken,
};

function revalidateCourse(slug: string): void {
  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath("/app/ruta");
  revalidatePath(`/app/cursos/${slug}`);
  revalidatePath("/app");
}

const createCourseSchema = courseSchema.extend({
  orderInLevel: courseSchema.shape.orderInLevel.optional(),
});

export async function createCourse(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      let orderInLevel = data.orderInLevel;
      if (!orderInLevel) {
        // Orden por defecto: el siguiente libre del nivel.
        const [{ maxOrder }] = await tx
          .select({ maxOrder: max(courses.orderInLevel) })
          .from(courses)
          .where(eq(courses.levelId, data.levelId));
        orderInLevel = (maxOrder ?? 0) + 1;
      }
      await tx.insert(courses).values({
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        levelId: data.levelId,
        orderInLevel,
        estHours: data.estHours != null ? String(data.estHours) : null,
        isRequired: data.isRequired,
        status: data.status,
        descriptionMd: data.descriptionMd?.trim() || null,
      });
    });
  } catch (error) {
    const message = uniqueViolationMessage(error, COURSE_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateCourse(parsed.data.slug);
  return { ok: true, slug: parsed.data.slug };
}

const updateCourseSchema = courseSchema.extend({
  id: z.string().uuid(),
});

export async function updateCourse(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const data = parsed.data;

  const existing = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, data.id))
    .limit(1);
  if (!existing[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  try {
    await db
      .update(courses)
      .set({
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        levelId: data.levelId,
        orderInLevel: data.orderInLevel,
        estHours: data.estHours != null ? String(data.estHours) : null,
        isRequired: data.isRequired,
        status: data.status,
        descriptionMd: data.descriptionMd?.trim() || null,
      })
      .where(eq(courses.id, data.id));
  } catch (error) {
    const message = uniqueViolationMessage(error, COURSE_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateCourse(existing[0].slug);
  if (existing[0].slug !== data.slug) {
    revalidateCourse(data.slug);
  }
  return { ok: true, slug: data.slug };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function setCourseStatus(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const rows = await db
    .update(courses)
    .set({ status: parsed.data.status })
    .where(eq(courses.id, parsed.data.id))
    .returning({ slug: courses.slug });
  if (!rows[0]) {
    return { ok: false, error: strings.common.genericError };
  }
  revalidateCourse(rows[0].slug);
  return { ok: true, slug: rows[0].slug };
}

export async function archiveCourse(
  input: unknown,
): Promise<AdminMutationResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  return setCourseStatus({ id: parsed.data.id, status: "archived" });
}

export async function deleteCourse(input: unknown): Promise<AdminDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const rows = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, parsed.data.id))
    .limit(1);
  if (!rows[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  const lessonIds = await lessonIdsOfCourse(parsed.data.id);
  if (await lessonsHaveProgress(lessonIds)) {
    return { ok: false, reason: "has_progress" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(courses).where(eq(courses.id, parsed.data.id));
  });

  revalidateCourse(rows[0].slug);
  return { ok: true };
}

const createModuleSchema = moduleSchema.extend({
  courseId: z.string().uuid(),
  order: moduleSchema.shape.order.optional(),
});

export async function createModule(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = createModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const courseRows = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, parsed.data.courseId))
    .limit(1);
  if (!courseRows[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  try {
    await db.transaction(async (tx) => {
      let order = parsed.data.order;
      if (!order) {
        const [{ maxOrder }] = await tx
          .select({ maxOrder: max(modules.order) })
          .from(modules)
          .where(eq(modules.courseId, parsed.data.courseId));
        order = (maxOrder ?? 0) + 1;
      }
      await tx.insert(modules).values({
        courseId: parsed.data.courseId,
        title: parsed.data.title,
        order,
      });
    });
  } catch (error) {
    const message = uniqueViolationMessage(error, COURSE_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateCourse(courseRows[0].slug);
  return { ok: true };
}

const updateModuleSchema = moduleSchema.extend({
  id: z.string().uuid(),
});

export async function updateModule(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = updateModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const rows = await db
    .select({ slug: courses.slug })
    .from(modules)
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(modules.id, parsed.data.id))
    .limit(1);
  if (!rows[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  try {
    await db
      .update(modules)
      .set({ title: parsed.data.title, order: parsed.data.order })
      .where(eq(modules.id, parsed.data.id));
  } catch (error) {
    const message = uniqueViolationMessage(error, COURSE_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateCourse(rows[0].slug);
  return { ok: true };
}

export async function deleteModule(input: unknown): Promise<AdminDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const rows = await db
    .select({ slug: courses.slug })
    .from(modules)
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(modules.id, parsed.data.id))
    .limit(1);
  if (!rows[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  const lessonIds = await lessonIdsOfModule(parsed.data.id);
  if (await lessonsHaveProgress(lessonIds)) {
    return { ok: false, reason: "has_progress" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(modules).where(eq(modules.id, parsed.data.id));
  });

  revalidateCourse(rows[0].slug);
  return { ok: true };
}

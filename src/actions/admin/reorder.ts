"use server";

import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type AdminMutationResult } from "@/actions/admin/shared";
import { db } from "@/db";
import { courses, lessons, modules } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";

const moveSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

// El swap pasa por un valor centinela (-1, imposible: los órdenes
// empiezan en 1) porque courses/modules/lessons tienen UNIQUE sobre
// (ámbito, orden) y el intercambio directo violaría la constraint a
// mitad de transacción.
const SENTINEL = -1;

export async function moveCourse(input: unknown): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const moved = await db.transaction(async (tx) => {
    const [course] = await tx
      .select({
        id: courses.id,
        levelId: courses.levelId,
        order: courses.orderInLevel,
        slug: courses.slug,
      })
      .from(courses)
      .where(eq(courses.id, parsed.data.id))
      .limit(1);
    if (!course) {
      return null;
    }
    const neighbor = await tx
      .select({
        id: courses.id,
        order: courses.orderInLevel,
        slug: courses.slug,
      })
      .from(courses)
      .where(
        and(
          eq(courses.levelId, course.levelId),
          parsed.data.direction === "up"
            ? lt(courses.orderInLevel, course.order)
            : gt(courses.orderInLevel, course.order),
        ),
      )
      .orderBy(
        parsed.data.direction === "up"
          ? desc(courses.orderInLevel)
          : asc(courses.orderInLevel),
      )
      .limit(1);
    if (!neighbor[0]) {
      return null; // ya está en el extremo de su nivel
    }
    await tx
      .update(courses)
      .set({ orderInLevel: SENTINEL })
      .where(eq(courses.id, course.id));
    await tx
      .update(courses)
      .set({ orderInLevel: course.order })
      .where(eq(courses.id, neighbor[0].id));
    await tx
      .update(courses)
      .set({ orderInLevel: neighbor[0].order })
      .where(eq(courses.id, course.id));
    return [course.slug, neighbor[0].slug];
  });

  if (moved) {
    revalidatePath("/admin/cursos");
    revalidatePath("/app/ruta");
    revalidatePath("/app");
    for (const slug of moved) {
      revalidatePath(`/admin/cursos/${slug}`);
      revalidatePath(`/app/cursos/${slug}`);
    }
  }
  return { ok: true };
}

export async function moveModule(input: unknown): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const courseSlug = await db.transaction(async (tx) => {
    const [mod] = await tx
      .select({
        id: modules.id,
        courseId: modules.courseId,
        order: modules.order,
        slug: courses.slug,
      })
      .from(modules)
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(modules.id, parsed.data.id))
      .limit(1);
    if (!mod) {
      return null;
    }
    const neighbor = await tx
      .select({ id: modules.id, order: modules.order })
      .from(modules)
      .where(
        and(
          eq(modules.courseId, mod.courseId),
          parsed.data.direction === "up"
            ? lt(modules.order, mod.order)
            : gt(modules.order, mod.order),
        ),
      )
      .orderBy(
        parsed.data.direction === "up"
          ? desc(modules.order)
          : asc(modules.order),
      )
      .limit(1);
    if (!neighbor[0]) {
      return null;
    }
    await tx
      .update(modules)
      .set({ order: SENTINEL })
      .where(eq(modules.id, mod.id));
    await tx
      .update(modules)
      .set({ order: mod.order })
      .where(eq(modules.id, neighbor[0].id));
    await tx
      .update(modules)
      .set({ order: neighbor[0].order })
      .where(eq(modules.id, mod.id));
    return mod.slug;
  });

  if (courseSlug) {
    revalidatePath("/admin/cursos");
    revalidatePath(`/admin/cursos/${courseSlug}`);
    revalidatePath(`/app/cursos/${courseSlug}`);
    revalidatePath("/app/ruta");
    revalidatePath("/app");
  }
  return { ok: true };
}

export async function moveLesson(input: unknown): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const moved = await db.transaction(async (tx) => {
    const [lesson] = await tx
      .select({
        id: lessons.id,
        moduleId: lessons.moduleId,
        order: lessons.order,
        slug: lessons.slug,
        courseSlug: courses.slug,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(lessons.id, parsed.data.id))
      .limit(1);
    if (!lesson) {
      return null;
    }
    const neighbor = await tx
      .select({ id: lessons.id, order: lessons.order, slug: lessons.slug })
      .from(lessons)
      .where(
        and(
          eq(lessons.moduleId, lesson.moduleId),
          parsed.data.direction === "up"
            ? lt(lessons.order, lesson.order)
            : gt(lessons.order, lesson.order),
        ),
      )
      .orderBy(
        parsed.data.direction === "up"
          ? desc(lessons.order)
          : asc(lessons.order),
      )
      .limit(1);
    if (!neighbor[0]) {
      return null;
    }
    await tx
      .update(lessons)
      .set({ order: SENTINEL })
      .where(eq(lessons.id, lesson.id));
    await tx
      .update(lessons)
      .set({ order: lesson.order })
      .where(eq(lessons.id, neighbor[0].id));
    await tx
      .update(lessons)
      .set({ order: neighbor[0].order })
      .where(eq(lessons.id, lesson.id));
    return {
      courseSlug: lesson.courseSlug,
      lessonSlugs: [lesson.slug, neighbor[0].slug],
    };
  });

  if (moved) {
    revalidatePath("/admin/cursos");
    revalidatePath(`/admin/cursos/${moved.courseSlug}`);
    revalidatePath("/admin/lecciones");
    revalidatePath(`/app/cursos/${moved.courseSlug}`);
    revalidatePath("/app/ruta");
    revalidatePath("/app");
    for (const slug of moved.lessonSlugs) {
      revalidatePath(`/app/leccion/${slug}`);
    }
  }
  return { ok: true };
}

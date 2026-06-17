"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  courses,
  lessonChecklistItems,
  lessons,
  milestoneSubmissions,
  modules,
} from "@/db/schema";
import { requireUser } from "@/lib/guards";
import { ratingsAverage, validateRatings } from "@/lib/milestone";
import { strings } from "@/lib/strings";

const t = strings.milestone;

const inputSchema = z.object({
  lessonSlug: z.string().min(1).max(200),
  ratings: z.record(z.string().uuid(), z.number().int()),
  reflection: z.string().max(4000).nullish(),
});

export type SubmitMilestoneResult =
  | { ok: true; average: number }
  | { ok: false; error: string };

// Autoevaluación de hito (docs/03 §C5): INSERT siempre nuevo (queda en
// el historial). La validación contra los items reales vive en
// lib/milestone; el XP llega al completar la lección (gate de F2-T4).
export async function submitMilestone(
  input: unknown,
): Promise<SubmitMilestoneResult> {
  const session = await requireUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const lessonRows = await db
    .select({ id: lessons.id, type: lessons.type })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(
      and(
        eq(lessons.slug, parsed.data.lessonSlug),
        eq(lessons.status, "published"),
        eq(courses.status, "published"),
      ),
    )
    .limit(1);
  const lesson = lessonRows[0];
  if (!lesson || lesson.type !== "milestone") {
    return { ok: false, error: strings.lesson.notFound };
  }

  const itemRows = await db
    .select({ id: lessonChecklistItems.id })
    .from(lessonChecklistItems)
    .where(eq(lessonChecklistItems.lessonId, lesson.id))
    .orderBy(asc(lessonChecklistItems.order));
  const itemIds = itemRows.map((row) => row.id);

  const validation = validateRatings(itemIds, parsed.data.ratings);
  if (!validation.ok) {
    return {
      ok: false,
      error:
        validation.reason === "missing"
          ? t.incomplete
          : strings.common.genericError,
    };
  }

  await db.transaction(async (tx) => {
    await tx.insert(milestoneSubmissions).values({
      userId: session.user.id,
      lessonId: lesson.id,
      ratings: parsed.data.ratings,
      reflection: parsed.data.reflection?.trim() || null,
    });
  });

  revalidatePath(`/app/leccion/${parsed.data.lessonSlug}`);
  return { ok: true, average: ratingsAverage(parsed.data.ratings) };
}

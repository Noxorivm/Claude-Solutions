"use server";

import { and, asc, desc, eq, gt, lt, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  flattenErrors,
  type AdminMutationResult,
} from "@/actions/admin/shared";
import { db } from "@/db";
import {
  lessons,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";
import {
  quizPassPctSchema,
  quizQuestionSchema,
} from "@/lib/validators/content";

export type QuizDeleteResult =
  | { ok: true }
  | { ok: false; reason: "has_attempts" }
  | { ok: false; error: string };

function revalidateQuiz(lessonSlug: string): void {
  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${lessonSlug}`);
  revalidatePath(`/admin/lecciones/${lessonSlug}`);
  revalidatePath(`/app/leccion/${lessonSlug}`);
}

async function lessonSlugOfQuiz(quizId: string): Promise<string | null> {
  const rows = await db
    .select({ slug: lessons.slug })
    .from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .where(eq(quizzes.id, quizId))
    .limit(1);
  return rows[0]?.slug ?? null;
}

async function quizHasAttempts(quizId: string): Promise<boolean> {
  const rows = await db
    .select({ one: sql`1` })
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId))
    .limit(1);
  return rows.length > 0;
}

export async function createQuiz(input: unknown): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = z.object({ lessonId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const lessonRows = await db
    .select({ slug: lessons.slug, type: lessons.type })
    .from(lessons)
    .where(eq(lessons.id, parsed.data.lessonId))
    .limit(1);
  if (!lessonRows[0] || lessonRows[0].type !== "quiz") {
    return { ok: false, error: strings.common.genericError };
  }

  await db
    .insert(quizzes)
    .values({ lessonId: parsed.data.lessonId })
    .onConflictDoNothing({ target: quizzes.lessonId });

  revalidateQuiz(lessonRows[0].slug);
  return { ok: true };
}

const passPctInputSchema = quizPassPctSchema.extend({
  quizId: z.string().uuid(),
});

export async function updateQuizPassPct(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = passPctInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const slug = await lessonSlugOfQuiz(parsed.data.quizId);
  if (!slug) {
    return { ok: false, error: strings.common.genericError };
  }
  await db
    .update(quizzes)
    .set({ passPct: parsed.data.passPct })
    .where(eq(quizzes.id, parsed.data.quizId));
  revalidateQuiz(slug);
  return { ok: true };
}

const createQuestionSchema = z.object({ quizId: z.string().uuid() });

export async function createQuestion(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const base = createQuestionSchema.safeParse(input);
  if (!base.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const parsed = quizQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const slug = await lessonSlugOfQuiz(base.data.quizId);
  if (!slug) {
    return { ok: false, error: strings.common.genericError };
  }

  await db.transaction(async (tx) => {
    const [{ maxOrder }] = await tx
      .select({ maxOrder: max(quizQuestions.order) })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, base.data.quizId));
    const [question] = await tx
      .insert(quizQuestions)
      .values({
        quizId: base.data.quizId,
        order: (maxOrder ?? 0) + 1,
        prompt: parsed.data.prompt,
        kind: parsed.data.kind,
        explanation: parsed.data.explanation?.trim() || null,
      })
      .returning({ id: quizQuestions.id });
    await tx.insert(quizOptions).values(
      parsed.data.options.map((option, index) => ({
        questionId: question.id,
        text: option.text,
        isCorrect: option.isCorrect,
        order: index + 1,
      })),
    );
  });

  revalidateQuiz(slug);
  return { ok: true };
}

const updateQuestionSchema = z.object({ id: z.string().uuid() });

export async function updateQuestion(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const base = updateQuestionSchema.safeParse(input);
  if (!base.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const parsed = quizQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const rows = await db
    .select({ quizId: quizQuestions.quizId })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, base.data.id))
    .limit(1);
  if (!rows[0]) {
    return { ok: false, error: strings.common.genericError };
  }
  const slug = await lessonSlugOfQuiz(rows[0].quizId);
  if (!slug) {
    return { ok: false, error: strings.common.genericError };
  }

  // Editar con intentos está permitido (el aviso "las notas pasadas no
  // se recalculan" es visible en el editor); borrar no.
  await db.transaction(async (tx) => {
    await tx
      .update(quizQuestions)
      .set({
        prompt: parsed.data.prompt,
        kind: parsed.data.kind,
        explanation: parsed.data.explanation?.trim() || null,
      })
      .where(eq(quizQuestions.id, base.data.id));
    await tx
      .delete(quizOptions)
      .where(eq(quizOptions.questionId, base.data.id));
    await tx.insert(quizOptions).values(
      parsed.data.options.map((option, index) => ({
        questionId: base.data.id,
        text: option.text,
        isCorrect: option.isCorrect,
        order: index + 1,
      })),
    );
  });

  revalidateQuiz(slug);
  return { ok: true };
}

export async function deleteQuestion(
  input: unknown,
): Promise<QuizDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const rows = await db
    .select({ quizId: quizQuestions.quizId })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, parsed.data.id))
    .limit(1);
  if (!rows[0]) {
    return { ok: false, error: strings.common.genericError };
  }
  const slug = await lessonSlugOfQuiz(rows[0].quizId);
  if (!slug) {
    return { ok: false, error: strings.common.genericError };
  }

  if (await quizHasAttempts(rows[0].quizId)) {
    return { ok: false, reason: "has_attempts" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(quizQuestions).where(eq(quizQuestions.id, parsed.data.id));
  });

  revalidateQuiz(slug);
  return { ok: true };
}

const moveQuestionSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export async function moveQuestion(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = moveQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const slug = await db.transaction(async (tx) => {
    const [question] = await tx
      .select({
        id: quizQuestions.id,
        quizId: quizQuestions.quizId,
        order: quizQuestions.order,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.id, parsed.data.id))
      .limit(1);
    if (!question) {
      return null;
    }
    const neighbor = await tx
      .select({ id: quizQuestions.id, order: quizQuestions.order })
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.quizId, question.quizId),
          parsed.data.direction === "up"
            ? lt(quizQuestions.order, question.order)
            : gt(quizQuestions.order, question.order),
        ),
      )
      .orderBy(
        parsed.data.direction === "up"
          ? desc(quizQuestions.order)
          : asc(quizQuestions.order),
      )
      .limit(1);
    if (!neighbor[0]) {
      return null;
    }
    await tx
      .update(quizQuestions)
      .set({ order: neighbor[0].order })
      .where(eq(quizQuestions.id, question.id));
    await tx
      .update(quizQuestions)
      .set({ order: question.order })
      .where(eq(quizQuestions.id, neighbor[0].id));
    return lessonSlugOfQuiz(question.quizId);
  });

  if (slug) {
    revalidateQuiz(slug);
  }
  return { ok: true };
}

export async function deleteQuiz(input: unknown): Promise<QuizDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ quizId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const slug = await lessonSlugOfQuiz(parsed.data.quizId);
  if (!slug) {
    return { ok: false, error: strings.common.genericError };
  }

  if (await quizHasAttempts(parsed.data.quizId)) {
    return { ok: false, reason: "has_attempts" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(quizzes).where(eq(quizzes.id, parsed.data.quizId));
  });

  revalidateQuiz(slug);
  return { ok: true };
}

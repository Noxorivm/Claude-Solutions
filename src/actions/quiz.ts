"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  courses,
  lessons,
  modules,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "@/db/schema";
import { requireUser } from "@/lib/guards";
import { gradeQuiz } from "@/lib/quiz";
import { strings } from "@/lib/strings";

const inputSchema = z.object({
  lessonSlug: z.string().min(1).max(200),
  answers: z.record(z.string().uuid(), z.string().uuid().nullable()),
});

export interface QuizQuestionFeedback {
  questionId: string;
  correct: boolean;
  selectedOptionId: string | null;
  correctOptionId: string;
  explanation: string | null;
}

export type SubmitQuizResult =
  | {
      ok: true;
      scorePct: number;
      passed: boolean;
      passPct: number;
      perQuestion: QuizQuestionFeedback[];
    }
  | { ok: false; error: string };

// Corrige EN SERVIDOR (las soluciones nunca viajan antes), guarda el
// intento (docs/03 §F1: intentos ilimitados, quedan registrados) y
// devuelve el desglose con explicaciones. El XP no se toca aquí: llega
// al completar la lección vía el gate de F2-T4.
export async function submitQuizAttempt(
  input: unknown,
): Promise<SubmitQuizResult> {
  const session = await requireUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const lessonRows = await db
    .select({ id: lessons.id })
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
  if (!lesson) {
    return { ok: false, error: strings.lesson.notFound };
  }

  const quizRows = await db
    .select({ id: quizzes.id, passPct: quizzes.passPct })
    .from(quizzes)
    .where(eq(quizzes.lessonId, lesson.id))
    .limit(1);
  const quiz = quizRows[0];
  if (!quiz) {
    return { ok: false, error: strings.quiz.noQuestions };
  }

  const solutionRows = await db
    .select({
      questionId: quizQuestions.id,
      explanation: quizQuestions.explanation,
      optionId: quizOptions.id,
      isCorrect: quizOptions.isCorrect,
    })
    .from(quizQuestions)
    .innerJoin(quizOptions, eq(quizOptions.questionId, quizQuestions.id))
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.order));

  const explanationByQuestion = new Map<string, string | null>();
  const correctByQuestion = new Map<string, string>();
  for (const row of solutionRows) {
    if (!explanationByQuestion.has(row.questionId)) {
      explanationByQuestion.set(row.questionId, row.explanation);
    }
    if (row.isCorrect) {
      correctByQuestion.set(row.questionId, row.optionId);
    }
  }
  const questions = [...correctByQuestion.entries()].map(
    ([id, correctOptionId]) => ({ id, correctOptionId }),
  );
  if (questions.length === 0) {
    return { ok: false, error: strings.quiz.noQuestions };
  }

  const grade = gradeQuiz(questions, parsed.data.answers, quiz.passPct);

  await db.transaction(async (tx) => {
    await tx.insert(quizAttempts).values({
      userId: session.user.id,
      quizId: quiz.id,
      scorePct: grade.scorePct,
      passed: grade.passed,
      answers: parsed.data.answers,
    });
  });

  revalidatePath(`/app/leccion/${parsed.data.lessonSlug}`);

  return {
    ok: true,
    scorePct: grade.scorePct,
    passed: grade.passed,
    passPct: quiz.passPct,
    perQuestion: grade.perQuestion.map((entry) => ({
      ...entry,
      explanation: explanationByQuestion.get(entry.questionId) ?? null,
    })),
  };
}

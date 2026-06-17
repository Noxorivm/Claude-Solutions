import { and, asc, count, eq, max } from "drizzle-orm";

import { db } from "@/db";
import { quizAttempts, quizOptions, quizQuestions, quizzes } from "@/db/schema";

export interface QuizOptionRow {
  id: string;
  text: string;
}

export interface QuizQuestionRow {
  id: string;
  prompt: string;
  kind: string;
  options: QuizOptionRow[];
}

export interface QuizForLesson {
  quizId: string;
  passPct: number;
  /** Preguntas y opciones SIN is_correct ni explanation: las soluciones
   *  solo viven en la action de corrección. */
  questions: QuizQuestionRow[];
  bestScorePct: number | null;
  attemptsCount: number;
}

export async function getQuizForLesson(
  lessonId: string,
  userId: string,
): Promise<QuizForLesson | null> {
  const quizRows = await db
    .select({ id: quizzes.id, passPct: quizzes.passPct })
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId))
    .limit(1);
  const quiz = quizRows[0];
  if (!quiz) {
    return null;
  }

  const rows = await db
    .select({
      questionId: quizQuestions.id,
      prompt: quizQuestions.prompt,
      kind: quizQuestions.kind,
      optionId: quizOptions.id,
      optionText: quizOptions.text,
    })
    .from(quizQuestions)
    .innerJoin(quizOptions, eq(quizOptions.questionId, quizQuestions.id))
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.order), asc(quizOptions.order));

  const questionMap = new Map<string, QuizQuestionRow>();
  for (const row of rows) {
    let question = questionMap.get(row.questionId);
    if (!question) {
      question = {
        id: row.questionId,
        prompt: row.prompt,
        kind: row.kind,
        options: [],
      };
      questionMap.set(row.questionId, question);
    }
    question.options.push({ id: row.optionId, text: row.optionText });
  }

  const [attempts] = await db
    .select({ total: count(), best: max(quizAttempts.scorePct) })
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quiz.id)),
    );

  return {
    quizId: quiz.id,
    passPct: quiz.passPct,
    questions: [...questionMap.values()],
    bestScorePct: attempts.best ?? null,
    attemptsCount: attempts.total,
  };
}

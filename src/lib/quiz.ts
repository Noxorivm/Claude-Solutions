// Corrección de quizzes (docs/03 §F1) y barajado determinista. Puro,
// sin IO: la action corrige EN SERVIDOR con las soluciones que nunca
// viajan al cliente antes de corregir.

export interface GradeQuestionInput {
  id: string;
  correctOptionId: string;
}

export interface GradedQuestion {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
}

export interface GradeResult {
  /** 0–100, entero redondeado. */
  scorePct: number;
  passed: boolean;
  perQuestion: GradedQuestion[];
}

/** Las preguntas sin responder cuentan como falladas. */
export function gradeQuiz(
  questions: GradeQuestionInput[],
  answers: Record<string, string | null | undefined>,
  passPct: number,
): GradeResult {
  const perQuestion = questions.map((question) => {
    const selectedOptionId = answers[question.id] ?? null;
    return {
      questionId: question.id,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      correct: selectedOptionId === question.correctOptionId,
    };
  });
  const correctCount = perQuestion.filter((entry) => entry.correct).length;
  const scorePct =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
  return { scorePct, passed: scorePct >= passPct, perQuestion };
}

/** Fisher–Yates con RNG inyectable (determinista en tests). */
export function shuffle<T>(array: readonly T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

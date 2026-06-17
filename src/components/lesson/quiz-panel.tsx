"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { completeLesson } from "@/actions/progress";
import { submitQuizAttempt, type SubmitQuizResult } from "@/actions/quiz";
import { showAchievementToasts } from "@/components/achievement-toasts";
import { Button } from "@/components/ui/button";
import type { QuizQuestionRow } from "@/db/queries/quiz";
import { shuffle } from "@/lib/quiz";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.quiz;

type QuizFeedback = Extract<SubmitQuizResult, { ok: true }>;

function reshuffle(questions: QuizQuestionRow[]): QuizQuestionRow[] {
  return shuffle(questions, Math.random).map((question) => ({
    ...question,
    options:
      question.kind === "single"
        ? shuffle(question.options, Math.random)
        : question.options,
  }));
}

export function QuizPanel({
  lessonSlug,
  lessonCompleted,
  initialQuestions,
}: {
  lessonSlug: string;
  lessonCompleted: boolean;
  /** Preguntas ya barajadas por el servidor (opciones solo en single). */
  initialQuestions: QuizQuestionRow[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizFeedback | null>(null);
  const [pending, startTransition] = useTransition();
  const [completing, startCompleting] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);

  const feedbackByQuestion = new Map(
    (result?.perQuestion ?? []).map((entry) => [entry.questionId, entry]),
  );

  function handleGrade(): void {
    startTransition(async () => {
      const response = await submitQuizAttempt({
        lessonSlug,
        answers: Object.fromEntries(
          questions.map((question) => [
            question.id,
            answers[question.id] ?? null,
          ]),
        ),
      });
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      setResult(response);
      // Foco al resumen del resultado (criterio de accesibilidad).
      requestAnimationFrame(() => summaryRef.current?.focus());
    });
  }

  function handleRetry(): void {
    setResult(null);
    setAnswers({});
    setQuestions(reshuffle(questions));
  }

  function handleComplete(): void {
    startCompleting(async () => {
      const response = await completeLesson(lessonSlug);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      toast.success(
        response.xpAwarded > 0
          ? strings.lesson.completedToast(response.xpAwarded)
          : strings.lesson.completedToastNoXp,
      );
      showAchievementToasts(response.newAchievements);
      router.refresh();
    });
  }

  return (
    <section aria-label="Quiz" className="space-y-5">
      {result ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          className={cn(
            "rounded-xl border bg-card/80 p-4",
            result.passed ? "border-success-ink/50" : "border-destructive/50",
          )}
        >
          <p className="font-mono text-2xl">{t.resultScore(result.scorePct)}</p>
          <p
            className={cn(
              "mt-1 text-[15px] font-bold",
              result.passed ? "text-success-ink" : "text-danger-ink",
            )}
          >
            {result.passed ? t.passed : t.needPct(result.passPct)}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleRetry} className="h-11">
              {t.retry}
            </Button>
            {result.passed && !lessonCompleted ? (
              <Button
                onClick={handleComplete}
                disabled={completing}
                className="h-11"
              >
                {completing ? strings.lesson.completing : t.completeCta}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <ol className="space-y-6">
        {questions.map((question, index) => {
          const feedback = feedbackByQuestion.get(question.id);
          const selected = answers[question.id];
          return (
            <li key={question.id}>
              <fieldset disabled={result !== null}>
                <legend className="text-[15px] font-bold">
                  {index + 1}. {question.prompt}
                </legend>
                <div className="mt-2 space-y-1.5">
                  {question.options.map((option) => {
                    const isSelected = selected === option.id;
                    const isCorrectOption =
                      feedback?.correctOptionId === option.id;
                    const isWrongSelection =
                      feedback !== undefined &&
                      isSelected &&
                      !feedback.correct &&
                      !isCorrectOption;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input px-3 py-2 text-[15px]",
                          result === null &&
                            isSelected &&
                            "border-primary bg-primary/10",
                          isCorrectOption && "border-success-ink bg-success/15",
                          isWrongSelection &&
                            "border-destructive bg-destructive/10",
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.id}
                          checked={isSelected}
                          onChange={() =>
                            setAnswers((previous) => ({
                              ...previous,
                              [question.id]: option.id,
                            }))
                          }
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-full border border-input",
                            isSelected && "border-primary",
                          )}
                        >
                          {isSelected ? (
                            <span className="size-2 rounded-full bg-primary" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">{option.text}</span>
                      </label>
                    );
                  })}
                </div>
                {!result && !selected ? (
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {t.unanswered}
                  </p>
                ) : null}
                {feedback ? (
                  <div className="mt-2 space-y-1 text-[15px]">
                    <p
                      className={cn(
                        "flex items-center gap-2 font-bold",
                        feedback.correct
                          ? "text-success-ink"
                          : "text-danger-ink",
                      )}
                    >
                      {feedback.correct ? (
                        <Check className="size-4" strokeWidth={2} aria-hidden />
                      ) : (
                        <X className="size-4" strokeWidth={2} aria-hidden />
                      )}
                      {feedback.correct ? t.correct : t.incorrect}
                    </p>
                    {!feedback.correct ? (
                      <p className="text-muted-foreground">
                        {t.correctAnswerWas(
                          question.options.find(
                            (option) => option.id === feedback.correctOptionId,
                          )?.text ?? "—",
                        )}
                      </p>
                    ) : null}
                    {feedback.explanation ? (
                      <p className="text-muted-foreground">
                        {feedback.explanation}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {result === null ? (
        <Button onClick={handleGrade} disabled={pending} className="h-11">
          {pending ? t.grading : t.grade}
        </Button>
      ) : null}
    </section>
  );
}

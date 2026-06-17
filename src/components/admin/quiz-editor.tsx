"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  moveQuestion,
  updateQuestion,
  updateQuizPassPct,
} from "@/actions/admin/quizzes";
import type { FieldErrors } from "@/actions/admin/shared";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminQuizEditor, AdminQuizQuestion } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.quizzes.editor;
const ta = strings.admin.actions;

interface OptionDraft {
  text: string;
  isCorrect: boolean;
}

const TRUEFALSE_OPTIONS: OptionDraft[] = [
  { text: "Verdadero", isCorrect: true },
  { text: "Falso", isCorrect: false },
];

const selectClass =
  "border-input bg-background h-9 rounded-md border px-2 text-[14px]";

function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}

/** Editor de UNA pregunta: estado local + guardar/borrar/↑↓. Sirve para
 *  preguntas existentes (questionId) y para el alta (quizId + onSaved). */
function QuestionEditor({
  idPrefix,
  question,
  quizId,
  isFirst,
  isLast,
  onCreated,
}: {
  idPrefix: string;
  question?: AdminQuizQuestion;
  quizId: string;
  isFirst?: boolean;
  isLast?: boolean;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const isCreate = !question;
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [kind, setKind] = useState<string>(question?.kind ?? "single");
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    question
      ? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
  );
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function switchKind(next: string): void {
    setKind(next);
    if (next === "truefalse") {
      setOptions(TRUEFALSE_OPTIONS.map((o) => ({ ...o })));
    }
  }

  function setOption(index: number, patch: Partial<OptionDraft>): void {
    setOptions((previous) =>
      previous.map((option, i) =>
        i === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function markCorrect(index: number): void {
    setOptions((previous) =>
      previous.map((option, i) => ({ ...option, isCorrect: i === index })),
    );
  }

  function handleSave(): void {
    setError(null);
    const payload = {
      prompt,
      kind,
      explanation: explanation.trim() === "" ? null : explanation,
      options,
    };
    startTransition(async () => {
      const result = isCreate
        ? await createQuestion({ ...payload, quizId })
        : await updateQuestion({ ...payload, id: question.id });
      if (!result.ok) {
        setError(
          result.error ??
            firstError(result.fieldErrors ?? {}) ??
            strings.common.genericError,
        );
        return;
      }
      toast.success(isCreate ? t.questionCreated : t.questionSaved);
      if (isCreate) {
        setPrompt("");
        setExplanation("");
        setKind("single");
        setOptions([
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ]);
        onCreated?.();
      }
      router.refresh();
    });
  }

  function handleDelete(): void {
    if (!question) return;
    startTransition(async () => {
      const result = await deleteQuestion({ id: question.id });
      if (!result.ok) {
        if ("reason" in result && result.reason === "has_attempts") {
          setBlocked(true);
          return;
        }
        toast.error(
          "error" in result ? result.error : strings.common.genericError,
        );
        return;
      }
      toast.success(t.questionDeleted);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  const correctName = `${idPrefix}-correct`;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <label
              htmlFor={`${idPrefix}-prompt`}
              className="text-[13px] font-bold"
            >
              {t.promptLabel}
            </label>
            <Input
              id={`${idPrefix}-prompt`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${idPrefix}-kind`}
                className="text-[13px] font-bold"
              >
                {t.kindLabel}
              </label>
              <select
                id={`${idPrefix}-kind`}
                value={kind}
                onChange={(e) => switchKind(e.target.value)}
                className={selectClass}
              >
                <option value="single">{t.kinds.single}</option>
                <option value="truefalse">{t.kinds.truefalse}</option>
              </select>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <label
                htmlFor={`${idPrefix}-explanation`}
                className="text-[13px] font-bold"
              >
                {t.explanationLabel}
              </label>
              <Input
                id={`${idPrefix}-explanation`}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-[13px] font-bold">{t.optionsLabel}</legend>
            <ul className="mt-1.5 space-y-1.5">
              {options.map((option, index) => (
                <li key={index} className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[13px]">
                    <input
                      type="radio"
                      name={correctName}
                      checked={option.isCorrect}
                      onChange={() => markCorrect(index)}
                      className="size-4 accent-primary"
                    />
                    {t.correctLabel}
                  </label>
                  <Input
                    value={option.text}
                    onChange={(e) => setOption(index, { text: e.target.value })}
                    readOnly={kind === "truefalse"}
                    aria-label={`${t.optionTextLabel} ${index + 1}`}
                    className="h-9 min-w-0 flex-1"
                  />
                  {kind === "single" && options.length > 2 ? (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setOptions((previous) =>
                          previous.filter((_, i) => i !== index),
                        )
                      }
                      className="h-9 text-danger-ink hover:text-danger-ink"
                    >
                      {t.removeOption}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
            {kind === "single" ? (
              <Button
                variant="outline"
                onClick={() =>
                  setOptions((previous) => [
                    ...previous,
                    { text: "", isCorrect: false },
                  ])
                }
                className="mt-2 h-8 text-[13px]"
              >
                {t.addOption}
              </Button>
            ) : null}
          </fieldset>

          {error ? (
            <p role="alert" className="text-[13px] text-danger-ink">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant={isCreate ? "default" : "outline"}
              onClick={handleSave}
              disabled={pending}
              className="h-9"
            >
              {isCreate ? t.addQuestion : t.saveQuestion}
            </Button>
            {!isCreate ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setBlocked(false);
                  setDeleteOpen(true);
                }}
                className="h-9 text-danger-ink hover:text-danger-ink"
              >
                {t.deleteQuestion}
              </Button>
            ) : null}
          </div>
        </div>

        {!isCreate ? (
          <MoveButtons
            id={question.id}
            title={question.prompt}
            isFirst={isFirst ?? true}
            isLast={isLast ?? true}
            action={moveQuestion}
          />
        ) : null}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteQuestionTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {blocked ? t.hasAttemptsBody : t.deleteQuestionBody(prompt)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            {!blocked ? (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
                className="h-10"
              >
                {ta.confirmDelete}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function QuizEditor({ data }: { data: AdminQuizEditor }) {
  const router = useRouter();
  const [passPct, setPassPct] = useState(String(data.quiz?.passPct ?? 80));
  const [deleteQuizOpen, setDeleteQuizOpen] = useState(false);
  const [quizBlocked, setQuizBlocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreateQuiz(): void {
    startTransition(async () => {
      const result = await createQuiz({ lessonId: data.lessonId });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(t.created);
      router.refresh();
    });
  }

  function handleSavePassPct(): void {
    if (!data.quiz) return;
    startTransition(async () => {
      const result = await updateQuizPassPct({
        quizId: data.quiz?.id ?? "",
        passPct: passPct.trim() === "" ? Number.NaN : Number(passPct),
      });
      if (!result.ok) {
        toast.error(
          result.error ??
            firstError(result.fieldErrors ?? {}) ??
            strings.common.genericError,
        );
        return;
      }
      toast.success(t.passPctSaved);
      router.refresh();
    });
  }

  function handleDeleteQuiz(): void {
    if (!data.quiz) return;
    startTransition(async () => {
      const result = await deleteQuiz({ quizId: data.quiz?.id ?? "" });
      if (!result.ok) {
        if ("reason" in result && result.reason === "has_attempts") {
          setQuizBlocked(true);
          return;
        }
        toast.error(
          "error" in result ? result.error : strings.common.genericError,
        );
        return;
      }
      toast.success(t.quizDeleted);
      setDeleteQuizOpen(false);
      router.refresh();
    });
  }

  if (!data.quiz) {
    return (
      <div className="mt-6 rounded-lg border bg-card p-6">
        <p className="text-[15px] text-muted-foreground">
          {strings.admin.quizzes.stateNoQuiz}
        </p>
        <Button
          onClick={handleCreateQuiz}
          disabled={pending}
          className="mt-3 h-10"
        >
          {t.createQuiz}
        </Button>
      </div>
    );
  }

  return (
    <>
      {data.attemptCount > 0 ? (
        <p
          role="note"
          className="mt-4 rounded-lg border border-info/50 bg-card p-3 text-[14px]"
        >
          {t.attemptsWarning}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="quiz-passpct" className="text-[13px] font-bold">
            {t.passPctLabel}
          </label>
          <Input
            id="quiz-passpct"
            type="number"
            min={1}
            max={100}
            value={passPct}
            onChange={(e) => setPassPct(e.target.value)}
            className="h-9 w-24 font-mono"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSavePassPct}
          disabled={pending}
          className="h-9"
        >
          {t.savePassPct}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setQuizBlocked(false);
            setDeleteQuizOpen(true);
          }}
          className="h-9 text-danger-ink hover:text-danger-ink"
        >
          {t.deleteQuiz}
        </Button>
      </div>

      <section aria-labelledby="quiz-questions-title" className="mt-6">
        <h2
          id="quiz-questions-title"
          className="text-lg font-bold tracking-tight"
        >
          {t.questionsTitle}
        </h2>
        {data.questions.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted-foreground">
            {t.noQuestions}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {data.questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                idPrefix={`q-${question.id}`}
                question={question}
                quizId={data.quiz?.id ?? ""}
                isFirst={index === 0}
                isLast={index === data.questions.length - 1}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="quiz-add-title" className="mt-6">
        <h2 id="quiz-add-title" className="text-lg font-bold tracking-tight">
          {t.addQuestionTitle}
        </h2>
        <div className="mt-3">
          <QuestionEditor idPrefix="q-new" quizId={data.quiz.id} />
        </div>
      </section>

      <Dialog open={deleteQuizOpen} onOpenChange={setDeleteQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteQuizTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {quizBlocked
              ? t.hasAttemptsBody
              : t.deleteQuizBody(data.questions.length)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteQuizOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            {!quizBlocked ? (
              <Button
                variant="destructive"
                onClick={handleDeleteQuiz}
                disabled={pending}
                className="h-10"
              >
                {ta.confirmDelete}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

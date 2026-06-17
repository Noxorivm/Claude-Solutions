"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { recordPracticeSession } from "@/actions/practice";
import { showAchievementToasts } from "@/components/achievement-toasts";
import {
  SessionFields,
  type SessionFieldsValue,
} from "@/components/practice/session-fields";
import { Button } from "@/components/ui/button";
import type { PracticeFormOptions } from "@/db/queries/practice";
import { formatRelativeDays } from "@/lib/format";
import { toMadridDay } from "@/lib/streak";
import { strings } from "@/lib/strings";

const t = strings.practice;

const EMPTY_FIELDS: SessionFieldsValue = {
  techniqueId: "",
  lessonId: "",
  rating: null,
  notes: "",
};

/** "YYYY-MM-DDTHH:mm" local para el input datetime-local. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ManualSessionForm({
  options,
}: {
  options: PracticeFormOptions;
}) {
  const router = useRouter();
  const [dateValue, setDateValue] = useState(() =>
    toLocalInputValue(new Date()),
  );
  const [minutes, setMinutes] = useState(10);
  const [fields, setFields] = useState<SessionFieldsValue>(EMPTY_FIELDS);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // El input datetime-local se interpreta en la zona del navegador; el
  // día de negocio se calcula igualmente en Europe/Madrid.
  const performedAt = dateValue ? new Date(dateValue) : null;
  const isRetro =
    performedAt !== null &&
    !Number.isNaN(performedAt.getTime()) &&
    toMadridDay(performedAt) !== toMadridDay(new Date());

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!performedAt || Number.isNaN(performedAt.getTime())) {
      setError(strings.common.genericError);
      return;
    }
    if (!fields.techniqueId && !fields.lessonId) {
      setError(t.needTarget);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await recordPracticeSession({
        durationSec: minutes * 60,
        techniqueId: fields.techniqueId || null,
        lessonId: fields.lessonId || null,
        selfRating: fields.rating,
        notes: fields.notes.trim() || null,
        performedAt: performedAt.toISOString(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.retro
          ? t.savedRetro
          : result.capped
            ? t.savedCapped(result.xpAwarded)
            : t.savedXp(result.xpAwarded),
      );
      if (result.nextReviewAt) {
        toast(
          t.nextReviewToast(
            formatRelativeDays(new Date(result.nextReviewAt), new Date()),
          ),
        );
      }
      showAchievementToasts(result.newAchievements);
      setFields(EMPTY_FIELDS);
      setMinutes(10);
      setDateValue(toLocalInputValue(new Date()));
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ornate-frame-sutil felt-texture space-y-4 p-5"
      noValidate
    >
      <h2 className="heading-eyebrow">{t.manualTitle}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="manual-date" className="text-sm font-bold">
            {t.dateLabel}
          </label>
          <input
            id="manual-date"
            type="datetime-local"
            value={dateValue}
            max={toLocalInputValue(new Date())}
            onChange={(e) => setDateValue(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-[15px]"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="manual-minutes" className="text-sm font-bold">
            {t.minutesLabel}
          </label>
          <input
            id="manual-minutes"
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-[15px]"
          />
        </div>
      </div>
      <div aria-live="polite">
        {isRetro ? (
          <p className="text-sm text-muted-foreground">{t.retroNotice}</p>
        ) : null}
      </div>
      <SessionFields
        options={options}
        value={fields}
        onChange={setFields}
        idPrefix="manual"
      />
      <div aria-live="polite">
        {error ? <p className="text-sm text-danger-ink">{error}</p> : null}
      </div>
      <Button type="submit" disabled={pending} className="h-11">
        {pending ? t.saving : t.save}
      </Button>
    </form>
  );
}

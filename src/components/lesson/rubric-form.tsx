"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { submitMilestone } from "@/actions/milestone";
import { completeLesson } from "@/actions/progress";
import { showAchievementToasts } from "@/components/achievement-toasts";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

const t = strings.milestone;

export interface RubricItem {
  id: string;
  text: string;
}

function formatAverage(average: number): string {
  return average.toFixed(1).replace(".", ",");
}

// Rúbrica 1–5 con honestidad guiada (docs/03 §C5, docs/02 §1.5): cada
// envío crea una submission nueva (historial); el XP llega al completar
// el hito vía el gate existente.
export function RubricForm({
  lessonSlug,
  lessonCompleted,
  hasSubmissions,
  items,
}: {
  lessonSlug: string;
  lessonCompleted: boolean;
  hasSubmissions: boolean;
  items: RubricItem[];
}) {
  const router = useRouter();
  // Con hito completado y rúbricas previas, el formulario se pliega
  // tras "Repetir autoevaluación".
  const [open, setOpen] = useState(!(hasSubmissions && lessonCompleted));
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [completing, startCompleting] = useTransition();

  const showCompleteCta = !lessonCompleted && (hasSubmissions || justSaved);

  function handleSave(): void {
    if (items.some((item) => ratings[item.id] === undefined)) {
      setError(t.incomplete);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitMilestone({
        lessonSlug,
        ratings,
        reflection: reflection.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t.savedToast(formatAverage(result.average)));
      setRatings({});
      setReflection("");
      setJustSaved(true);
      if (hasSubmissions && lessonCompleted) {
        setOpen(false);
      }
      router.refresh();
    });
  }

  function handleComplete(): void {
    startCompleting(async () => {
      const result = await completeLesson(lessonSlug);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.xpAwarded > 0
          ? strings.lesson.completedToast(result.xpAwarded)
          : strings.lesson.completedToastNoXp,
      );
      showAchievementToasts(result.newAchievements);
      router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="rubrica-title"
      className="ornate-frame-sutil felt-texture p-5"
    >
      <h2 id="rubrica-title" className="font-display text-xl tracking-tight">
        {t.rubricTitle}
      </h2>

      {showCompleteCta ? (
        <Button
          onClick={handleComplete}
          disabled={completing}
          className="mt-3 h-11"
        >
          {completing ? strings.lesson.completing : t.completeCta}
        </Button>
      ) : null}

      {!open ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="mt-3 h-11"
        >
          {t.repeat}
        </Button>
      ) : (
        <div className="mt-4 space-y-5">
          {items.map((item) => (
            <fieldset key={item.id}>
              <legend className="text-[15px]">{item.text}</legend>
              <div className="mt-2 flex gap-2" role="radiogroup">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`rubric-${item.id}`}
                      value={value}
                      checked={ratings[item.id] === value}
                      onChange={() =>
                        setRatings((previous) => ({
                          ...previous,
                          [item.id]: value,
                        }))
                      }
                      className="peer sr-only"
                    />
                    <span className="grid size-11 place-items-center rounded-lg border border-input font-mono text-[15px] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                      {value}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {t.anchors}
              </p>
            </fieldset>
          ))}

          <div className="space-y-1.5">
            <label htmlFor="rubric-reflection" className="text-sm font-bold">
              {t.reflectionLabel}
            </label>
            <textarea
              id="rubric-reflection"
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder={t.reflectionPlaceholder}
              rows={4}
              className="w-full rounded-lg border border-input bg-background p-3 text-[15px] placeholder:text-muted-foreground"
            />
          </div>

          <div aria-live="polite">
            {error ? <p className="text-sm text-danger-ink">{error}</p> : null}
          </div>

          <Button onClick={handleSave} disabled={pending} className="h-11">
            {pending ? t.saving : t.save}
          </Button>
        </div>
      )}
    </section>
  );
}

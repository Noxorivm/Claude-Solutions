"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTechniqueMastery } from "@/actions/techniques";
import { Button } from "@/components/ui/button";
import { formatMadridDate } from "@/lib/format";
import { strings } from "@/lib/strings";

const t = strings.techniques;

// Editor de dominio con honestidad guiada (docs/03 §E3): el descriptor
// del nivel enfocado o seleccionado está SIEMPRE visible.
export function MasteryEditor({
  techniqueSlug,
  initialMastery,
}: {
  techniqueSlug: string;
  initialMastery: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialMastery);
  const [focused, setFocused] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = focused ?? selected;

  function handleSave(): void {
    startTransition(async () => {
      const result = await updateTechniqueMastery({
        techniqueSlug,
        mastery: selected,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.nextReviewAt
          ? t.updatedToast(formatMadridDate(new Date(result.nextReviewAt)))
          : t.updatedToastNoReview,
      );
      router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="mastery-editor-title"
      className="ornate-frame-sutil felt-texture p-5"
    >
      <h2 id="mastery-editor-title" className="heading-eyebrow">
        {t.editorTitle}
      </h2>
      <fieldset className="mt-3">
        <legend className="sr-only">{t.masteryLabel}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="cursor-pointer">
              <input
                type="radio"
                name="mastery"
                value={level}
                checked={selected === level}
                onChange={() => setSelected(level)}
                onFocus={() => setFocused(level)}
                onBlur={() => setFocused(null)}
                className="peer sr-only"
              />
              <span className="grid size-11 place-items-center rounded-lg border border-input font-mono text-[15px] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                {level}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-[15px] text-muted-foreground"
      >
        {t.masteryDescriptors[shown]}
      </p>
      <Button onClick={handleSave} disabled={pending} className="mt-4 h-11">
        {pending ? t.editorSaving : t.editorSave}
      </Button>
    </section>
  );
}

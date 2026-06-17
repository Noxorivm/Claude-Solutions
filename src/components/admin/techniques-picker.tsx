"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setLessonTechniques } from "@/actions/admin/lessons";
import { Button } from "@/components/ui/button";
import type { TechniqueOption } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.techniquesPicker;
const categoryLabels = strings.techniques.categories;

export function TechniquesPicker({
  lessonId,
  options,
  selectedIds,
}: {
  lessonId: string;
  options: TechniqueOption[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [pending, startTransition] = useTransition();

  function toggle(id: string): void {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSave(): void {
    startTransition(async () => {
      const result = await setLessonTechniques({
        lessonId,
        techniqueIds: [...selected],
      });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(t.saved);
      router.refresh();
    });
  }

  const groups: { category: string; options: TechniqueOption[] }[] = [];
  for (const option of options) {
    const last = groups[groups.length - 1];
    if (last && last.category === option.category) {
      last.options.push(option);
    } else {
      groups.push({ category: option.category, options: [option] });
    }
  }

  return (
    <section aria-labelledby="techniques-picker-title" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="techniques-picker-title"
          className="text-lg font-bold tracking-tight"
        >
          {t.title}
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {t.count(selected.size)}
        </span>
      </div>
      {options.length === 0 ? (
        <p className="mt-2 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((group) => (
            <fieldset key={group.category}>
              <legend className="text-[12px] font-bold tracking-wide text-muted-foreground uppercase">
                {categoryLabels[group.category] ?? group.category}
              </legend>
              <div className="mt-1.5 grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {group.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex min-h-8 items-center gap-2 text-[14px]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(option.id)}
                      onChange={() => toggle(option.id)}
                      className="size-4 accent-primary"
                    />
                    {option.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
      <div className="mt-3">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={pending}
          className="h-9"
        >
          {t.save}
        </Button>
      </div>
    </section>
  );
}

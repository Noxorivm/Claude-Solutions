"use client";

import { useState } from "react";
import { toast } from "sonner";

import { toggleChecklistItem } from "@/actions/progress";
import type { LessonChecklistRow } from "@/db/queries/lesson-detail";
import { strings } from "@/lib/strings";

const t = strings.lesson;

// Checklist de práctica persistente (docs/03 §C3). Checkboxes nativos:
// accesibles de serie y sin componentes nuevos; persistencia inmediata
// por ítem vía server action.
export function ChecklistPanel({
  items,
  isPractice,
}: {
  items: LessonChecklistRow[];
  isPractice: boolean;
}) {
  const [checkedById, setCheckedById] = useState<Map<string, boolean>>(
    () => new Map(items.map((item) => [item.id, item.checked])),
  );
  const checkedCount = [...checkedById.values()].filter(Boolean).length;

  async function handleToggle(itemId: string) {
    const previous = checkedById.get(itemId) ?? false;
    setCheckedById((map) => new Map(map).set(itemId, !previous));
    const result = await toggleChecklistItem(itemId);
    if (!result.ok) {
      setCheckedById((map) => new Map(map).set(itemId, previous));
      toast.error(result.error);
    }
  }

  return (
    <section
      aria-labelledby="checklist-title"
      className="ornate-frame-sutil felt-texture p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="checklist-title" className="heading-eyebrow">
          {t.checklistTitle}
        </h2>
        <span className="font-mono text-[13px] text-muted-foreground">
          {t.checklistCount(checkedCount, items.length)}
        </span>
      </div>
      {isPractice ? (
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t.checklistRequired}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px]">
              <input
                type="checkbox"
                checked={checkedById.get(item.id) ?? false}
                onChange={() => handleToggle(item.id)}
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              <span>{item.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import type { PracticeFormOptions } from "@/db/queries/practice";
import { strings } from "@/lib/strings";

const t = strings.practice;
const CATEGORY_LABELS = strings.techniques.categories;

export interface SessionFieldsValue {
  techniqueId: string;
  lessonId: string;
  rating: number | null;
  notes: string;
}

// Campos comunes del cierre de sesión y del registro manual: selects
// nativos con optgroup y radiogroup nativo 1–5 (sin dependencias).
export function SessionFields({
  options,
  value,
  onChange,
  idPrefix,
}: {
  options: PracticeFormOptions;
  value: SessionFieldsValue;
  onChange: (value: SessionFieldsValue) => void;
  idPrefix: string;
}) {
  const dueIds = new Set(options.dueTechniqueIds);
  const dueTechniques = options.techniques.filter((tech) =>
    dueIds.has(tech.id),
  );
  const regularTechniques = options.techniques.filter(
    (tech) => !dueIds.has(tech.id),
  );
  const categories = [
    ...new Set(regularTechniques.map((tech) => tech.category)),
  ];
  const courseTitles = [...new Set(options.lessons.map((l) => l.courseTitle))];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-technique`} className="text-sm font-bold">
          {t.techniqueLabel}
        </label>
        <select
          id={`${idPrefix}-technique`}
          value={value.techniqueId}
          onChange={(e) => onChange({ ...value, techniqueId: e.target.value })}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-[15px]"
        >
          <option value="">{t.noneOption}</option>
          {dueTechniques.length > 0 ? (
            <optgroup label={t.dueGroup}>
              {dueTechniques.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {categories.map((category) => (
            <optgroup
              key={category}
              label={CATEGORY_LABELS[category] ?? category}
            >
              {regularTechniques
                .filter((tech) => tech.category === category)
                .map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-lesson`} className="text-sm font-bold">
          {t.lessonLabel}
        </label>
        <select
          id={`${idPrefix}-lesson`}
          value={value.lessonId}
          onChange={(e) => onChange({ ...value, lessonId: e.target.value })}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-[15px]"
        >
          <option value="">{t.noneOption}</option>
          {courseTitles.map((courseTitle) => (
            <optgroup key={courseTitle} label={courseTitle}>
              {options.lessons
                .filter((lesson) => lesson.courseTitle === courseTitle)
                .map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-bold">{t.ratingLegend}</legend>
        <div className="mt-2 flex gap-2" role="radiogroup">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="cursor-pointer">
              <input
                type="radio"
                name={`${idPrefix}-rating`}
                value={rating}
                checked={value.rating === rating}
                onChange={() => onChange({ ...value, rating })}
                className="peer sr-only"
              />
              <span className="grid size-11 place-items-center rounded-lg border border-input font-mono text-[15px] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                {rating}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-notes`} className="text-sm font-bold">
          {t.notesLabel}
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder={t.notesPlaceholder}
          rows={3}
          className="w-full rounded-lg border border-input bg-background p-3 text-[15px] placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

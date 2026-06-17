"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createCourse,
  updateCourse,
  type FieldErrors,
} from "@/actions/admin/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { strings } from "@/lib/strings";
import { suggestSlug } from "@/lib/validators/content";

const t = strings.admin.form;
const statusLabels = strings.admin.courses.statusLabel;

export interface CourseFormValues {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  levelId: number;
  orderInLevel: number | null;
  estHours: string;
  isRequired: boolean;
  status: "draft" | "published" | "archived";
  descriptionMd: string;
}

const EMPTY: CourseFormValues = {
  title: "",
  slug: "",
  summary: "",
  levelId: 0,
  orderInLevel: null,
  estHours: "",
  isRequired: true,
  status: "draft",
  descriptionMd: "",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[13px] text-danger-ink">
      {message}
    </p>
  );
}

// Formulario a dos columnas (docs/06 §Layout-Admin) con errores por
// campo asociados vía aria-describedby.
export function CourseForm({ initial }: { initial?: CourseFormValues }) {
  const router = useRouter();
  const isCreate = !initial?.id;
  const [values, setValues] = useState<CourseFormValues>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof CourseFormValues>(
    key: K,
    value: CourseFormValues[K],
  ): void {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleTitle(value: string): void {
    set("title", value);
    if (isCreate && !slugTouched) {
      set("slug", suggestSlug(value));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFieldErrors({});
    const payload = {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      levelId: values.levelId,
      orderInLevel: values.orderInLevel ?? undefined,
      estHours: values.estHours.trim() === "" ? null : Number(values.estHours),
      isRequired: values.isRequired,
      status: values.status,
      descriptionMd: values.descriptionMd.trim() || null,
    };
    startTransition(async () => {
      const result = isCreate
        ? await createCourse(payload)
        : await updateCourse({ ...payload, id: initial?.id ?? "" });
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.error) {
          toast.error(result.error);
        }
        return;
      }
      toast.success(isCreate ? t.created : t.saved);
      if (isCreate) {
        router.push(`/admin/cursos/${result.slug}`);
      } else if (result.slug !== initial?.slug) {
        router.replace(`/admin/cursos/${result.slug}`);
      } else {
        router.refresh();
      }
    });
  }

  const describedBy = (field: string) =>
    fieldErrors[field] ? `course-${field}-error` : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-x-6 gap-y-4 md:grid-cols-2"
    >
      <div className="space-y-1">
        <label htmlFor="course-title" className="text-[13px] font-bold">
          {t.titleLabel}
        </label>
        <Input
          id="course-title"
          value={values.title}
          onChange={(e) => handleTitle(e.target.value)}
          aria-describedby={describedBy("title")}
          aria-invalid={fieldErrors.title ? true : undefined}
        />
        <FieldError id="course-title-error" message={fieldErrors.title} />
      </div>

      <div className="space-y-1">
        <label htmlFor="course-slug" className="text-[13px] font-bold">
          {t.slugLabel}
        </label>
        <Input
          id="course-slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          aria-describedby={
            fieldErrors.slug ? "course-slug-error" : "course-slug-hint"
          }
          aria-invalid={fieldErrors.slug ? true : undefined}
          className="font-mono"
        />
        <p id="course-slug-hint" className="text-[12px] text-muted-foreground">
          {t.slugHint}
        </p>
        <FieldError id="course-slug-error" message={fieldErrors.slug} />
      </div>

      <div className="space-y-1">
        <label htmlFor="course-level" className="text-[13px] font-bold">
          {t.levelLabel}
        </label>
        <select
          id="course-level"
          value={values.levelId}
          onChange={(e) => set("levelId", Number(e.target.value))}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-[14px]"
        >
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="course-order" className="text-[13px] font-bold">
          {t.orderLabel}
        </label>
        <Input
          id="course-order"
          type="number"
          min={1}
          value={values.orderInLevel ?? ""}
          placeholder={isCreate ? t.orderAutoHint : undefined}
          onChange={(e) =>
            set(
              "orderInLevel",
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          aria-describedby={describedBy("orderInLevel")}
          className="font-mono"
        />
        <FieldError
          id="course-orderInLevel-error"
          message={fieldErrors.orderInLevel}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="course-hours" className="text-[13px] font-bold">
          {t.hoursLabel}
        </label>
        <Input
          id="course-hours"
          type="number"
          step="0.5"
          value={values.estHours}
          onChange={(e) => set("estHours", e.target.value)}
          aria-describedby={describedBy("estHours")}
          aria-invalid={fieldErrors.estHours ? true : undefined}
          className="font-mono"
        />
        <FieldError id="course-estHours-error" message={fieldErrors.estHours} />
      </div>

      <div className="space-y-1">
        <label htmlFor="course-status" className="text-[13px] font-bold">
          {t.statusLabel}
        </label>
        <select
          id="course-status"
          value={values.status}
          onChange={(e) =>
            set("status", e.target.value as CourseFormValues["status"])
          }
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-[14px]"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex min-h-9 items-center gap-2 text-[14px] md:col-span-2">
        <input
          type="checkbox"
          checked={values.isRequired}
          onChange={(e) => set("isRequired", e.target.checked)}
          className="size-4 accent-primary"
        />
        {t.requiredLabel}
      </label>

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="course-summary" className="text-[13px] font-bold">
          {t.summaryLabel}
        </label>
        <textarea
          id="course-summary"
          value={values.summary}
          onChange={(e) => set("summary", e.target.value)}
          rows={2}
          aria-describedby={describedBy("summary")}
          aria-invalid={fieldErrors.summary ? true : undefined}
          className="w-full rounded-md border border-input bg-background p-2 text-[14px]"
        />
        <FieldError id="course-summary-error" message={fieldErrors.summary} />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="course-description" className="text-[13px] font-bold">
          {t.descriptionLabel}
        </label>
        <textarea
          id="course-description"
          value={values.descriptionMd}
          onChange={(e) => set("descriptionMd", e.target.value)}
          rows={6}
          className="w-full rounded-md border border-input bg-background p-2 font-mono text-[13px]"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending} className="h-10">
          {pending ? t.saving : t.save}
        </Button>
      </div>
    </form>
  );
}

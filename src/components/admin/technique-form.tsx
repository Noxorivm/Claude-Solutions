"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { FieldErrors } from "@/actions/admin/shared";
import { createTechnique, updateTechnique } from "@/actions/admin/techniques";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { strings } from "@/lib/strings";
import { suggestSlug } from "@/lib/validators/content";

const t = strings.admin.techniques.form;
const categoryLabels = strings.techniques.categories;

const CATEGORY_VALUES = [
  "cards",
  "coins",
  "mentalism",
  "classics",
  "stage",
  "theory",
] as const;

export interface TechniqueFormValues {
  id?: string;
  name: string;
  slug: string;
  category: (typeof CATEGORY_VALUES)[number];
  levelNumber: number;
  descriptionMd: string;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[13px] text-danger-ink">
      {message}
    </p>
  );
}

export function TechniqueForm({ initial }: { initial?: TechniqueFormValues }) {
  const router = useRouter();
  const isCreate = !initial?.id;
  const [values, setValues] = useState<TechniqueFormValues>(
    initial ?? {
      name: "",
      slug: "",
      category: "cards",
      levelNumber: 0,
      descriptionMd: "",
    },
  );
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof TechniqueFormValues>(
    key: K,
    value: TechniqueFormValues[K],
  ): void {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleName(value: string): void {
    set("name", value);
    if (isCreate && !slugTouched) {
      set("slug", suggestSlug(value));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFieldErrors({});
    const payload = {
      name: values.name,
      slug: values.slug,
      category: values.category,
      levelNumber: values.levelNumber,
      descriptionMd:
        values.descriptionMd.trim() === "" ? null : values.descriptionMd,
    };
    startTransition(async () => {
      const result = isCreate
        ? await createTechnique(payload)
        : await updateTechnique({ ...payload, id: initial?.id ?? "" });
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
        router.push(`/admin/tecnicas/${result.slug}`);
      } else if (result.slug !== initial?.slug) {
        router.replace(`/admin/tecnicas/${result.slug}`);
      } else {
        router.refresh();
      }
    });
  }

  const selectClass =
    "border-input bg-background h-9 w-full rounded-md border px-2 text-[14px]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-x-6 gap-y-4 md:grid-cols-2"
    >
      <div className="space-y-1">
        <label htmlFor="technique-name" className="text-[13px] font-bold">
          {t.nameLabel}
        </label>
        <Input
          id="technique-name"
          value={values.name}
          onChange={(e) => handleName(e.target.value)}
          aria-describedby={
            fieldErrors.name ? "technique-name-error" : undefined
          }
          aria-invalid={fieldErrors.name ? true : undefined}
        />
        <FieldError id="technique-name-error" message={fieldErrors.name} />
      </div>

      <div className="space-y-1">
        <label htmlFor="technique-slug" className="text-[13px] font-bold">
          {t.slugLabel}
        </label>
        <Input
          id="technique-slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          aria-describedby={
            fieldErrors.slug ? "technique-slug-error" : "technique-slug-hint"
          }
          aria-invalid={fieldErrors.slug ? true : undefined}
          className="font-mono"
        />
        <p
          id="technique-slug-hint"
          className="text-[12px] text-muted-foreground"
        >
          {t.slugHint}
        </p>
        <FieldError id="technique-slug-error" message={fieldErrors.slug} />
      </div>

      <div className="space-y-1">
        <label htmlFor="technique-category" className="text-[13px] font-bold">
          {t.categoryLabel}
        </label>
        <select
          id="technique-category"
          value={values.category}
          onChange={(e) =>
            set("category", e.target.value as TechniqueFormValues["category"])
          }
          className={selectClass}
        >
          {CATEGORY_VALUES.map((value) => (
            <option key={value} value={value}>
              {categoryLabels[value] ?? value}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="technique-level" className="text-[13px] font-bold">
          {t.levelLabel}
        </label>
        <select
          id="technique-level"
          value={values.levelNumber}
          onChange={(e) => set("levelNumber", Number(e.target.value))}
          className={selectClass}
        >
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1 md:col-span-2">
        <label
          htmlFor="technique-description"
          className="text-[13px] font-bold"
        >
          {t.descriptionLabel}
        </label>
        <MarkdownEditor
          id="technique-description"
          value={values.descriptionMd}
          onChange={(value) => set("descriptionMd", value)}
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

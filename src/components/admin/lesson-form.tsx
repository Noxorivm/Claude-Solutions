"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createLesson, updateLesson } from "@/actions/admin/lessons";
import type { FieldErrors } from "@/actions/admin/shared";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModuleOption } from "@/db/queries/admin";
import { strings } from "@/lib/strings";
import { parseVideoUrl } from "@/lib/video";
import { suggestSlug } from "@/lib/validators/content";

const t = strings.admin.lessonForm;
const statusLabels = strings.admin.courses.statusLabel;
const typeLabels = strings.courseDetail.lessonTypes;

export interface LessonFormValues {
  id?: string;
  title: string;
  slug: string;
  moduleId: string;
  type: "article" | "video" | "practice" | "quiz" | "milestone";
  contentMd: string;
  videoUrl: string;
  durationMin: string;
  xpOverride: string;
  status: "draft" | "published" | "archived";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[13px] text-danger-ink">
      {message}
    </p>
  );
}

/** Badge de autodetección en vivo (lib/video.ts en cliente; el provider
 *  que cuenta se deriva SIEMPRE en servidor al guardar). */
function VideoBadge({ url }: { url: string }) {
  if (url.trim() === "") {
    return null;
  }
  const parsed = parseVideoUrl(url);
  return (
    <Badge
      variant="outline"
      data-testid="video-badge"
      className={
        parsed
          ? "border-success-ink/60 text-success-ink"
          : "border-destructive/50 text-danger-ink"
      }
    >
      {parsed
        ? t.videoDetected(t.videoProviders[parsed.provider])
        : t.videoUnrecognized}
    </Badge>
  );
}

export function LessonForm({
  initial,
  moduleOptions,
}: {
  initial?: LessonFormValues;
  moduleOptions: ModuleOption[];
}) {
  const router = useRouter();
  const isCreate = !initial?.id;
  const [values, setValues] = useState<LessonFormValues>(
    initial ?? {
      title: "",
      slug: "",
      moduleId: moduleOptions[0]?.id ?? "",
      type: "article",
      contentMd: "",
      videoUrl: "",
      durationMin: "",
      xpOverride: "",
      status: "draft",
    },
  );
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof LessonFormValues>(
    key: K,
    value: LessonFormValues[K],
  ): void {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleTitle(value: string): void {
    set("title", value);
    if (isCreate && !slugTouched) {
      set("slug", suggestSlug(value));
    }
  }

  // Cursos con sus módulos para el <select> agrupado.
  const courseGroups: { courseTitle: string; options: ModuleOption[] }[] = [];
  for (const option of moduleOptions) {
    const last = courseGroups[courseGroups.length - 1];
    if (last && last.options[0]?.courseId === option.courseId) {
      last.options.push(option);
    } else {
      courseGroups.push({ courseTitle: option.courseTitle, options: [option] });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFieldErrors({});
    const payload = {
      title: values.title,
      slug: values.slug,
      moduleId: values.moduleId,
      type: values.type,
      contentMd: values.contentMd.trim() === "" ? null : values.contentMd,
      videoUrl: values.videoUrl.trim() === "" ? null : values.videoUrl.trim(),
      durationMin:
        values.durationMin.trim() === "" ? null : Number(values.durationMin),
      xpOverride:
        values.xpOverride.trim() === "" ? null : Number(values.xpOverride),
      status: values.status,
    };
    startTransition(async () => {
      const result = isCreate
        ? await createLesson(payload)
        : await updateLesson({ ...payload, id: initial?.id ?? "" });
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
        router.push(`/admin/lecciones/${result.slug}`);
      } else if (result.slug !== initial?.slug) {
        router.replace(`/admin/lecciones/${result.slug}`);
      } else {
        router.refresh();
      }
    });
  }

  const describedBy = (field: string) =>
    fieldErrors[field] ? `lesson-${field}-error` : undefined;

  const selectClass =
    "border-input bg-background h-9 w-full rounded-md border px-2 text-[14px]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-x-6 gap-y-4 md:grid-cols-2"
    >
      <div className="space-y-1">
        <label htmlFor="lesson-title" className="text-[13px] font-bold">
          {t.titleLabel}
        </label>
        <Input
          id="lesson-title"
          value={values.title}
          onChange={(e) => handleTitle(e.target.value)}
          aria-describedby={describedBy("title")}
          aria-invalid={fieldErrors.title ? true : undefined}
        />
        <FieldError id="lesson-title-error" message={fieldErrors.title} />
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-slug" className="text-[13px] font-bold">
          {t.slugLabel}
        </label>
        <Input
          id="lesson-slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          aria-describedby={
            fieldErrors.slug ? "lesson-slug-error" : "lesson-slug-hint"
          }
          aria-invalid={fieldErrors.slug ? true : undefined}
          className="font-mono"
        />
        <p id="lesson-slug-hint" className="text-[12px] text-muted-foreground">
          {t.slugHint}
        </p>
        <FieldError id="lesson-slug-error" message={fieldErrors.slug} />
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-module" className="text-[13px] font-bold">
          {t.moduleLabel}
        </label>
        <select
          id="lesson-module"
          value={values.moduleId}
          onChange={(e) => set("moduleId", e.target.value)}
          aria-describedby={describedBy("moduleId")}
          className={selectClass}
        >
          {courseGroups.map((group) => (
            <optgroup key={group.options[0].courseId} label={group.courseTitle}>
              {group.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <FieldError id="lesson-moduleId-error" message={fieldErrors.moduleId} />
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-type" className="text-[13px] font-bold">
          {t.typeLabel}
        </label>
        <select
          id="lesson-type"
          value={values.type}
          onChange={(e) =>
            set("type", e.target.value as LessonFormValues["type"])
          }
          className={selectClass}
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-duration" className="text-[13px] font-bold">
          {t.durationLabel}
        </label>
        <Input
          id="lesson-duration"
          type="number"
          min={1}
          value={values.durationMin}
          onChange={(e) => set("durationMin", e.target.value)}
          aria-describedby={describedBy("durationMin")}
          aria-invalid={fieldErrors.durationMin ? true : undefined}
          className="font-mono"
        />
        <FieldError
          id="lesson-durationMin-error"
          message={fieldErrors.durationMin}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-xp" className="text-[13px] font-bold">
          {t.xpLabel}
        </label>
        <Input
          id="lesson-xp"
          type="number"
          min={0}
          value={values.xpOverride}
          onChange={(e) => set("xpOverride", e.target.value)}
          aria-describedby={describedBy("xpOverride")}
          aria-invalid={fieldErrors.xpOverride ? true : undefined}
          className="font-mono"
        />
        <FieldError
          id="lesson-xpOverride-error"
          message={fieldErrors.xpOverride}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-status" className="text-[13px] font-bold">
          {t.statusLabel}
        </label>
        <select
          id="lesson-status"
          value={values.status}
          onChange={(e) =>
            set("status", e.target.value as LessonFormValues["status"])
          }
          className={selectClass}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="lesson-video" className="text-[13px] font-bold">
            {t.videoLabel}
          </label>
          <VideoBadge url={values.videoUrl} />
        </div>
        <Input
          id="lesson-video"
          type="url"
          value={values.videoUrl}
          onChange={(e) => set("videoUrl", e.target.value)}
          aria-describedby={describedBy("videoUrl")}
          aria-invalid={fieldErrors.videoUrl ? true : undefined}
          className="font-mono"
          placeholder="https://…"
        />
        <FieldError id="lesson-videoUrl-error" message={fieldErrors.videoUrl} />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="lesson-content" className="text-[13px] font-bold">
          {t.contentLabel}
        </label>
        <MarkdownEditor
          id="lesson-content"
          value={values.contentMd}
          onChange={(value) => set("contentMd", value)}
        />
        <FieldError
          id="lesson-contentMd-error"
          message={fieldErrors.contentMd}
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

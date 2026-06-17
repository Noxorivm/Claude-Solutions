import Link from "next/link";
import { notFound } from "next/navigation";

import { ChecklistEditor } from "@/components/admin/checklist-editor";
import { LessonActions } from "@/components/admin/lesson-actions";
import { LessonForm } from "@/components/admin/lesson-form";
import { ResourcesEditor } from "@/components/admin/resources-editor";
import { TechniquesPicker } from "@/components/admin/techniques-picker";
import { Badge } from "@/components/ui/badge";
import {
  getAdminLessonDetail,
  getModuleOptions,
  getTechniqueOptions,
} from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin;

export default async function AdminLeccionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [lesson, moduleOptions, techniqueOptions] = await Promise.all([
    getAdminLessonDetail(slug),
    getModuleOptions(),
    getTechniqueOptions(),
  ]);
  if (!lesson) {
    notFound();
  }

  return (
    <>
      <Link
        href="/admin/lecciones"
        className="text-[13px] text-muted-foreground hover:text-foreground"
      >
        ← {t.lessons.title}
      </Link>
      <p className="mt-2 text-[13px] text-muted-foreground">
        {lesson.courseTitle} → {lesson.moduleTitle}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          {lesson.title}
          <Badge variant="outline">
            {t.courses.statusLabel[lesson.status]}
          </Badge>
          {lesson.type === "quiz" ? (
            <Link
              href={`/admin/quizzes/${lesson.slug}`}
              className="text-[14px] font-normal text-info underline underline-offset-2"
            >
              {t.quizzes.editor.editQuiz}
            </Link>
          ) : null}
        </h1>
        <LessonActions
          lessonId={lesson.id}
          title={lesson.title}
          status={lesson.status}
          itemCount={lesson.checklistItems.length}
          resourceCount={lesson.resources.length}
        />
      </div>

      <div className="mt-6">
        <LessonForm
          initial={{
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            moduleId: lesson.moduleId,
            type: lesson.type,
            contentMd: lesson.contentMd ?? "",
            videoUrl: lesson.videoUrl ?? "",
            durationMin:
              lesson.durationMin != null ? String(lesson.durationMin) : "",
            xpOverride:
              lesson.xpOverride != null ? String(lesson.xpOverride) : "",
            status: lesson.status,
          }}
          moduleOptions={moduleOptions}
        />

        <ChecklistEditor lessonId={lesson.id} items={lesson.checklistItems} />
        <TechniquesPicker
          lessonId={lesson.id}
          options={techniqueOptions}
          selectedIds={lesson.techniqueIds}
        />
        <ResourcesEditor lessonId={lesson.id} resources={lesson.resources} />
      </div>
    </>
  );
}

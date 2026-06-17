import Link from "next/link";
import { notFound } from "next/navigation";

import { QuizEditor } from "@/components/admin/quiz-editor";
import { getAdminQuizEditor } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.quizzes.editor;

export default async function AdminQuizEditorPage({
  params,
}: {
  params: Promise<{ lessonSlug: string }>;
}) {
  const { lessonSlug } = await params;
  const data = await getAdminQuizEditor(lessonSlug);
  if (!data) {
    notFound();
  }

  return (
    <>
      <Link
        href="/admin/quizzes"
        className="text-[13px] text-muted-foreground hover:text-foreground"
      >
        ← {t.backToList}
      </Link>
      <p className="mt-2 text-[13px] text-muted-foreground">
        {data.courseTitle} → {data.moduleTitle}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {data.lessonTitle}
        </h1>
        <Link
          href={`/admin/lecciones/${data.lessonSlug}`}
          className="text-[14px] text-info underline underline-offset-2"
        >
          {t.editInLesson}
        </Link>
      </div>

      <QuizEditor data={data} />
    </>
  );
}

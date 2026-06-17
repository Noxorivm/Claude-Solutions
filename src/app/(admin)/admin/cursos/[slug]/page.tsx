import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseActions } from "@/components/admin/course-actions";
import { CourseForm } from "@/components/admin/course-form";
import { ModuleManager } from "@/components/admin/module-manager";
import { Badge } from "@/components/ui/badge";
import { getAdminCourseDetail } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin;

export default async function AdminCursoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getAdminCourseDetail(slug);
  if (!course) {
    notFound();
  }

  return (
    <>
      <Link
        href="/admin/cursos"
        className="text-[13px] text-muted-foreground hover:text-foreground"
      >
        ← {t.courses.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          {course.title}
          <Badge variant="outline">
            {t.courses.statusLabel[course.status]}
          </Badge>
        </h1>
        <CourseActions
          courseId={course.id}
          title={course.title}
          status={course.status}
          moduleCount={course.modules.length}
          lessonCount={course.totalLessons}
        />
      </div>

      <div className="mt-6 max-w-3xl">
        <CourseForm
          initial={{
            id: course.id,
            title: course.title,
            slug: course.slug,
            summary: course.summary,
            levelId: course.levelId,
            orderInLevel: course.orderInLevel,
            estHours: course.estHours ?? "",
            isRequired: course.isRequired,
            status: course.status,
            descriptionMd: course.descriptionMd ?? "",
          }}
        />

        <ModuleManager courseId={course.id} modules={course.modules} />
      </div>
    </>
  );
}

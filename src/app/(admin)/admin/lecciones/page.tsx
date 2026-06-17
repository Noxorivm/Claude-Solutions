import { CircleHelp, FileText, PlayCircle, Repeat, Trophy } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminCourses, getAdminLessons } from "@/db/queries/admin";
import { formatMadridDateShort } from "@/lib/format";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin.lessons;
const typeLabels = strings.courseDetail.lessonTypes;
const statusLabels = strings.admin.courses.statusLabel;

const STATUS_BADGE: Record<string, string> = {
  draft: "border-border text-muted-foreground",
  published: "border-success-ink/60 text-success-ink",
  archived: "border-destructive/50 text-danger-ink",
};

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  article: FileText,
  video: PlayCircle,
  practice: Repeat,
  quiz: CircleHelp,
  milestone: Trophy,
};

export default async function AdminLeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string; tipo?: string; estado?: string }>;
}) {
  const { curso = "", tipo = "", estado = "" } = await searchParams;
  const [all, courses] = await Promise.all([
    getAdminLessons(),
    getAdminCourses(),
  ]);
  const filtered = all.filter((lesson) => {
    if (curso && lesson.courseId !== curso) return false;
    if (tipo && lesson.type !== tipo) return false;
    if (estado && lesson.status !== estado) return false;
    return true;
  });
  const hasFilters = curso !== "" || tipo !== "" || estado !== "";
  const selectClass =
    "border-input bg-background h-9 rounded-md border px-2 text-[14px]";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <Button asChild className="h-10">
          <Link href="/admin/lecciones/nueva">{t.newLesson}</Link>
        </Button>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="filtro-curso" className="text-[13px] font-bold">
            {t.filterCourse}
          </label>
          <select
            id="filtro-curso"
            name="curso"
            defaultValue={curso}
            className={cn(selectClass, "max-w-64")}
          >
            <option value="">{t.allOption}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filtro-tipo" className="text-[13px] font-bold">
            {t.filterType}
          </label>
          <select
            id="filtro-tipo"
            name="tipo"
            defaultValue={tipo}
            className={selectClass}
          >
            <option value="">{t.allOption}</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filtro-estado" className="text-[13px] font-bold">
            {t.filterStatus}
          </label>
          <select
            id="filtro-estado"
            name="estado"
            defaultValue={estado}
            className={selectClass}
          >
            <option value="">{t.allOption}</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" className="h-9">
          {t.apply}
        </Button>
        {hasFilters ? (
          <Button asChild variant="ghost" className="h-9">
            <Link href="/admin/lecciones">{t.clear}</Link>
          </Button>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <p className="mt-6 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b text-left text-[12px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colTitle}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colWhere}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colType}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colStatus}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colOrder}
                </th>
                <th scope="col" className="py-1.5 font-bold">
                  {t.colUpdated}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((lesson) => {
                const TypeIcon = TYPE_ICONS[lesson.type] ?? FileText;
                return (
                  <tr key={lesson.id}>
                    <td className="py-1.5 pr-3">
                      <Link
                        href={`/admin/lecciones/${lesson.slug}`}
                        className="text-info underline underline-offset-2 hover:text-foreground"
                      >
                        {lesson.title}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      {lesson.courseTitle} → {lesson.moduleTitle}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className="flex items-center gap-1.5">
                        <TypeIcon className="size-4" aria-hidden="true" />
                        {typeLabels[lesson.type as keyof typeof typeLabels] ??
                          lesson.type}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <Badge
                        variant="outline"
                        className={cn(STATUS_BADGE[lesson.status])}
                      >
                        {statusLabels[lesson.status] ?? lesson.status}
                      </Badge>
                    </td>
                    <td className="py-1.5 pr-3 font-mono">{lesson.order}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {formatMadridDateShort(lesson.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

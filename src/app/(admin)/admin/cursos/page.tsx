import Link from "next/link";

import { moveCourse } from "@/actions/admin/reorder";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminCourses } from "@/db/queries/admin";
import { formatMadridDateShort } from "@/lib/format";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin.courses;

const STATUS_BADGE: Record<string, string> = {
  draft: "border-border text-muted-foreground",
  published: "border-success-ink/60 text-success-ink",
  archived: "border-destructive/50 text-danger-ink",
};

export default async function AdminCursosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; nivel?: string }>;
}) {
  const { estado = "", nivel = "" } = await searchParams;
  const all = await getAdminCourses();
  const filtered = all.filter((course) => {
    if (estado && course.status !== estado) return false;
    if (nivel !== "" && course.levelId !== Number(nivel)) return false;
    return true;
  });
  const hasFilters = estado !== "" || nivel !== "";

  // Extremos por nivel calculados sobre TODOS los cursos (el reorden
  // opera dentro del nivel completo aunque la tabla esté filtrada).
  const levelNeighbors = new Map<
    string,
    { isFirst: boolean; isLast: boolean }
  >();
  for (const course of all) {
    const siblings = all.filter((c) => c.levelId === course.levelId);
    levelNeighbors.set(course.id, {
      isFirst: siblings[0]?.id === course.id,
      isLast: siblings[siblings.length - 1]?.id === course.id,
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <Button asChild className="h-10">
          <Link href="/admin/cursos/nuevo">{t.newCourse}</Link>
        </Button>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="filtro-estado" className="text-[13px] font-bold">
            {t.filterStatus}
          </label>
          <select
            id="filtro-estado"
            name="estado"
            defaultValue={estado}
            className="h-9 rounded-md border border-input bg-background px-2 text-[14px]"
          >
            <option value="">{t.allOption}</option>
            {Object.entries(t.statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filtro-nivel" className="text-[13px] font-bold">
            {t.filterLevel}
          </label>
          <select
            id="filtro-nivel"
            name="nivel"
            defaultValue={nivel}
            className="h-9 rounded-md border border-input bg-background px-2 text-[14px]"
          >
            <option value="">{t.allOption}</option>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" className="h-9">
          {t.apply}
        </Button>
        {hasFilters ? (
          <Button asChild variant="ghost" className="h-9">
            <Link href="/admin/cursos">{t.clear}</Link>
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
                  {t.colLevel}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colOrder}
                </th>
                <th scope="col" className="py-1.5 pr-3">
                  <span className="sr-only">
                    {strings.admin.reorder.moveUp}
                  </span>
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colStatus}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colContent}
                </th>
                <th scope="col" className="py-1.5 font-bold">
                  {t.colUpdated}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((course) => (
                <tr key={course.id}>
                  <td className="py-1.5 pr-3">
                    <Link
                      href={`/admin/cursos/${course.slug}`}
                      className="text-info underline underline-offset-2 hover:text-foreground"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-3 font-mono">{course.levelId}</td>
                  <td className="py-1.5 pr-3 font-mono">
                    {course.orderInLevel}
                  </td>
                  <td className="py-1.5 pr-3">
                    <MoveButtons
                      id={course.id}
                      title={course.title}
                      isFirst={levelNeighbors.get(course.id)?.isFirst ?? true}
                      isLast={levelNeighbors.get(course.id)?.isLast ?? true}
                      action={moveCourse}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <Badge
                      variant="outline"
                      className={cn(STATUS_BADGE[course.status])}
                    >
                      {t.statusLabel[course.status] ?? course.status}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-3 font-mono">
                    {course.moduleCount} / {course.lessonCount}
                  </td>
                  <td className="py-1.5 text-muted-foreground">
                    {formatMadridDateShort(course.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseModules } from "@/components/course/course-modules";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCourseDetail } from "@/db/queries/course-detail";
import { getRouteMapData } from "@/db/queries/route-map";
import { requireUser } from "@/lib/guards";
import { computeLessonFlow, type LessonFlowStatus } from "@/lib/lesson-flow";
import { strings } from "@/lib/strings";
import { computeRouteState } from "@/lib/unlock";

const t = strings.courseDetail;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireUser();
  const detail = await getCourseDetail(slug, session.user.id);
  if (!detail) {
    notFound();
  }

  const freeRoam = Boolean(session.user.free_roam);

  // Estado del nivel del curso (reutiliza unlock.ts, paso 7).
  const routeData = await getRouteMapData(session.user.id);
  const levelInputs = routeData.levels.map((level) => ({
    id: level.id,
    courses: routeData.courses
      .filter((course) => course.levelId === level.id)
      .map((course) => ({
        id: course.id,
        isRequired: course.isRequired,
        publishedLessons: course.publishedLessons,
        completedLessons: course.completedLessons,
      })),
  }));
  const states = computeRouteState(levelInputs, { freeRoam });
  const levelIndex = routeData.levels.findIndex(
    (level) => level.id === detail.levelId,
  );
  const levelState = levelIndex >= 0 ? states[levelIndex] : undefined;
  const levelLocked = !(levelState?.unlocked ?? false);

  let levelLockedHint: string | null = null;
  if (levelLocked && levelIndex > 0) {
    const previousLevel = routeData.levels[levelIndex - 1];
    const previousState = states[levelIndex - 1];
    levelLockedHint =
      previousState.requiredPublishedCourses === 0
        ? strings.routeMap.lockedPreparing
        : strings.routeMap.lockedNeeds(
            previousState.requiredPublishedCourses -
              previousState.requiredCompletedCourses,
            previousLevel.name,
          );
  }

  const flow = computeLessonFlow(
    detail.modules.map((mod) => ({
      order: mod.order,
      lessons: mod.lessons.map((lesson) => ({
        slug: lesson.slug,
        order: lesson.order,
        completed: lesson.completed,
      })),
    })),
    { freeRoam },
  );

  // Nivel bloqueado sin modo libre: TODAS las lecciones bloqueadas.
  const statusBySlug = new Map<string, LessonFlowStatus>(
    flow.lessons.map((lesson) => [
      lesson.slug,
      levelLocked ? "locked" : lesson.status,
    ]),
  );

  const allLessons = detail.modules.flatMap((mod) => mod.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter(
    (lesson) => lesson.completed,
  ).length;
  const pct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const nextModule = flow.nextPendingSlug
    ? detail.modules.find((mod) =>
        mod.lessons.some((lesson) => lesson.slug === flow.nextPendingSlug),
      )
    : null;
  const defaultOpenModuleId = levelLocked
    ? null
    : (nextModule?.id ?? detail.modules[0]?.id ?? null);

  // Eyebrow del hero: el nivel al que pertenece el curso (R2b-1).
  const levelName = routeData.levels.find(
    (level) => level.id === detail.levelId,
  )?.name;

  return (
    <>
      <Link
        href="/app/ruta"
        className="text-[15px] text-muted-foreground hover:text-foreground"
      >
        {t.backToRoute}
      </Link>

      <div className="ornate-glow section-enter mt-4">
        <header className="ornate-frame-strong felt-texture p-6 md:p-7">
          {levelName ? (
            <p className="heading-eyebrow">
              {strings.routeMap.levelLabel(detail.levelId, levelName)}
            </p>
          ) : null}
          <h1 className="heading-gilded mt-1 font-display text-3xl tracking-tight">
            {detail.title}
          </h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            {detail.summary}
          </p>
          <p className="mt-3 text-[15px] text-muted-foreground">
            {detail.estHours ? <>{t.estHours(detail.estHours)} · </> : null}
            {t.progressText(completedLessons, totalLessons)}
          </p>
          <Progress
            value={pct}
            aria-label={strings.routeMap.progressLabel(detail.title)}
            className="mt-3 h-2 max-w-md"
          />
          {!levelLocked && totalLessons > 0 ? (
            <div className="mt-5">
              {flow.nextPendingSlug ? (
                <Button asChild>
                  <Link href={`/app/leccion/${flow.nextPendingSlug}`}>
                    {completedLessons === 0 ? t.start : t.continue}
                  </Link>
                </Button>
              ) : (
                <Button disabled>{t.courseCompleted}</Button>
              )}
            </div>
          ) : null}
        </header>
      </div>

      {levelLocked ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-card p-4"
        >
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-destructive"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-[15px]">
            {t.levelLockedBanner}
            {levelLockedHint ? ` ${levelLockedHint}.` : null}
          </p>
        </div>
      ) : null}

      <div className="mt-8">
        <CourseModules
          modules={detail.modules}
          statusBySlug={statusBySlug}
          defaultOpenModuleId={defaultOpenModuleId}
        />
      </div>
    </>
  );
}

import Link from "next/link";

import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { CategoryBars } from "@/components/charts/category-bars";
import { MasteryDial } from "@/components/practice/mastery-dial";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProgressData } from "@/db/queries/progress";
import { getRouteMapData } from "@/db/queries/route-map";
import { getTechniquesList } from "@/db/queries/techniques";
import { buildHeatmapGrid } from "@/lib/progress";
import { requireUser } from "@/lib/guards";
import { toMadridDay } from "@/lib/streak";
import { strings } from "@/lib/strings";
import { computeRouteState } from "@/lib/unlock";

const t = strings.progress;

export default async function ProgresoPage() {
  const session = await requireUser();
  const userId = session.user.id;
  const [progressData, techniqueRows, routeData] = await Promise.all([
    getProgressData(userId),
    getTechniquesList(userId),
    getRouteMapData(userId),
  ]);

  const today = toMadridDay(new Date());
  const weeks = buildHeatmapGrid(today, progressData.activityDays);

  const states = computeRouteState(
    routeData.levels.map((level) => ({
      id: level.id,
      courses: routeData.courses
        .filter((course) => course.levelId === level.id)
        .map((course) => ({
          id: course.id,
          isRequired: course.isRequired,
          publishedLessons: course.publishedLessons,
          completedLessons: course.completedLessons,
        })),
    })),
    { freeRoam: Boolean(session.user.free_roam) },
  );

  const anyMastery = techniqueRows.some((row) => (row.mastery ?? 0) > 0);
  const masteryGroups = [5, 4, 3, 2, 1, 0].map((level) => ({
    level,
    rows: techniqueRows.filter((row) => (row.mastery ?? 0) === level),
  }));

  const levelBlocks = routeData.levels
    .map((level, index) => {
      const courses = routeData.courses.filter(
        (course) => course.levelId === level.id,
      );
      const published = courses.reduce(
        (acc, course) => acc + course.publishedLessons,
        0,
      );
      const completed = courses.reduce(
        (acc, course) => acc + course.completedLessons,
        0,
      );
      return {
        id: level.id,
        name: level.name,
        pct: published > 0 ? Math.round((completed / published) * 100) : null,
        courses: courses.map((course) => {
          const state = states[index]?.courses.find(
            (entry) => entry.id === course.id,
          );
          return {
            slug: course.slug,
            title: course.title,
            pct: state?.completionPct ?? 0,
          };
        }),
      };
    })
    .filter((block) => block.pct !== null);

  return (
    <>
      <h1 className="section-enter heading-gilded font-display text-3xl tracking-tight">
        {t.title}
      </h1>
      <p
        className="section-enter mt-2 text-muted-foreground"
        style={{ "--enter-i": 1 } as React.CSSProperties}
      >
        {t.intro}
      </p>

      <section
        aria-labelledby="heatmap-title"
        style={{ "--enter-i": 2 } as React.CSSProperties}
        className="section-enter ornate-frame-sutil reading-surface mt-6 p-5"
      >
        <h2 id="heatmap-title" className="heading-eyebrow">
          {t.heatmapTitle}
        </h2>
        <div className="mt-4">
          <ActivityHeatmap weeks={weeks} />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="categorias-title"
          className="ornate-frame-sutil reading-surface p-5"
        >
          <h2 id="categorias-title" className="heading-eyebrow">
            {t.categoriesTitle}
          </h2>
          <div className="mt-4">
            <CategoryBars
              categories={progressData.categorySeconds}
              totalSeconds={progressData.totalSeconds}
            />
          </div>
        </section>

        <section
          aria-labelledby="dominio-title"
          className="ornate-frame-sutil felt-texture p-5"
        >
          <h2 id="dominio-title" className="heading-eyebrow">
            {t.masteryTitle}
          </h2>
          {!anyMastery ? (
            <p className="mt-4 text-[15px] text-muted-foreground">
              {t.masteryEmpty}
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {masteryGroups
                .filter((group) => group.rows.length > 0)
                .map((group) => (
                  <li key={group.level} className="flex gap-3">
                    <MasteryDial mastery={group.level} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] text-muted-foreground">
                        {t.masteryCount(group.rows.length)}
                      </p>
                      <p className="text-[15px]">
                        {group.rows.map((row, index) => (
                          <span key={row.id}>
                            <Link
                              href={`/app/tecnicas/${row.slug}`}
                              className="text-info underline underline-offset-2 hover:text-foreground"
                            >
                              {row.name}
                            </Link>
                            {index < group.rows.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section
        aria-labelledby="niveles-title"
        className="ornate-frame-sutil felt-texture mt-4 p-5"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="niveles-title" className="heading-eyebrow">
            {t.levelsTitle}
          </h2>
          <Button asChild variant="ghost" className="h-9">
            <Link href="/app/ruta">{t.viewRoute}</Link>
          </Button>
        </div>
        <div className="mt-3 space-y-5">
          {levelBlocks.map((block) => (
            <div key={block.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[15px] font-bold">
                  {strings.routeMap.levelLabel(block.id, block.name)}
                </h3>
                <span className="font-mono text-[13px] text-muted-foreground">
                  {block.pct}%
                </span>
              </div>
              <Progress
                value={block.pct ?? 0}
                aria-label={strings.routeMap.progressLabel(block.name)}
                className="mt-1.5 h-2"
              />
              <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                {block.courses.map((course) => (
                  <li
                    key={course.slug}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <Link
                      href={`/app/cursos/${course.slug}`}
                      className="min-w-0 flex-1 truncate hover:text-foreground"
                    >
                      {course.title}
                    </Link>
                    <span className="font-mono">{course.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

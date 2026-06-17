import {
  RouteMap,
  type RouteMapLevelView,
} from "@/components/course/route-map";
import { getRouteMapData } from "@/db/queries/route-map";
import { requireUser } from "@/lib/guards";
import { strings } from "@/lib/strings";
import { computeRouteState, type CourseState } from "@/lib/unlock";

const t = strings.routeMap;

export default async function RutaPage() {
  const session = await requireUser();
  const { levels, courses } = await getRouteMapData(session.user.id);

  const levelInputs = levels.map((level) => ({
    id: level.id,
    courses: courses
      .filter((course) => course.levelId === level.id)
      .map((course) => ({
        id: course.id,
        isRequired: course.isRequired,
        publishedLessons: course.publishedLessons,
        completedLessons: course.completedLessons,
      })),
  }));

  const states = computeRouteState(levelInputs, {
    freeRoam: Boolean(session.user.free_roam),
  });

  const view: RouteMapLevelView[] = levels.map((level, index) => {
    const state = states[index];
    const previousLevel = index > 0 ? levels[index - 1] : null;
    const previousState = index > 0 ? states[index - 1] : null;

    let lockedHint: string | undefined;
    if (!state.unlocked && previousLevel && previousState) {
      lockedHint =
        previousState.requiredPublishedCourses === 0
          ? t.lockedPreparing
          : t.lockedNeeds(
              previousState.requiredPublishedCourses -
                previousState.requiredCompletedCourses,
              previousLevel.name,
            );
    }

    const stateById = new Map<string, CourseState>(
      state.courses.map((course) => [course.id, course]),
    );

    return {
      id: level.id,
      name: level.name,
      milestone: (level.descriptionMd ?? "").replaceAll("**", ""),
      courses: courses
        .filter((course) => course.levelId === level.id)
        .map((course) => {
          const courseState = stateById.get(course.id);
          return {
            id: course.id,
            slug: course.slug,
            title: course.title,
            summary: course.summary,
            status: courseState?.status ?? "locked",
            completionPct: courseState?.completionPct ?? 0,
            lockedHint,
          };
        }),
    };
  });

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
      <div
        className="section-enter mt-8"
        style={{ "--enter-i": 2 } as React.CSSProperties}
      >
        <RouteMap levels={view} />
      </div>
    </>
  );
}

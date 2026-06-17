import {
  CourseCard,
  type CourseCardProps,
} from "@/components/course/course-card";
import { strings } from "@/lib/strings";

const t = strings.routeMap;

export interface RouteMapLevelView {
  id: number;
  name: string;
  /** Hito de salida del nivel, ya en texto plano. */
  milestone: string;
  courses: Array<CourseCardProps & { id: string }>;
}

// Niveles en vertical como "mesas" de tapete; dentro, los naipes-curso
// (docs/06 §Layout-Ruta). Lista semántica y headings por nivel (§A11y-3).
export function RouteMap({ levels }: { levels: RouteMapLevelView[] }) {
  return (
    <div className="space-y-6">
      {levels.map((level) => (
        <section
          key={level.id}
          aria-labelledby={`nivel-${level.id}`}
          className="felt-texture rounded-2xl border bg-card/50 p-5 md:p-6"
        >
          <header className="ornate-frame-sutil mb-5 inline-block px-4 py-2">
            <h2
              id={`nivel-${level.id}`}
              className="heading-gilded font-display text-2xl tracking-tight"
            >
              {t.levelLabel(level.id, level.name)}
            </h2>
            {level.milestone ? (
              <p className="mt-1 text-[15px] text-muted-foreground">
                {level.milestone}
              </p>
            ) : null}
          </header>
          {level.courses.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">
              {t.inPreparation}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {level.courses.map((course) => (
                <li key={course.id}>
                  <CourseCard
                    slug={course.slug}
                    title={course.title}
                    summary={course.summary}
                    status={course.status}
                    completionPct={course.completionPct}
                    lockedHint={course.lockedHint}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

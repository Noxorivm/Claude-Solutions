// Reglas puras de desbloqueo del mapa de ruta (docs/03 §B1/§B3, docs/05:
// el progreso se calcula SOLO sobre lecciones published). Sin IO: la query
// de src/db/queries/route-map.ts alimenta estas funciones.

export type CourseStatus = "locked" | "available" | "in_progress" | "completed";

export interface CourseProgressInput {
  id: string;
  isRequired: boolean;
  publishedLessons: number;
  completedLessons: number;
}

export interface LevelInput {
  id: number;
  courses: CourseProgressInput[];
}

export interface CourseState {
  id: string;
  status: CourseStatus;
  /** 0–100, redondeado. */
  completionPct: number;
}

export interface LevelState {
  id: number;
  unlocked: boolean;
  requiredPublishedCourses: number;
  requiredCompletedCourses: number;
  courses: CourseState[];
}

export interface RouteStateOptions {
  freeRoam: boolean;
}

export function courseCompletionPct(course: CourseProgressInput): number {
  if (course.publishedLessons <= 0) {
    return 0;
  }
  return Math.round((course.completedLessons / course.publishedLessons) * 100);
}

/** Un curso sin lecciones published nunca cuenta como completado. */
export function isCourseCompleted(course: CourseProgressInput): boolean {
  return (
    course.publishedLessons > 0 &&
    course.completedLessons >= course.publishedLessons
  );
}

function courseStatus(
  course: CourseProgressInput,
  levelUnlocked: boolean,
): CourseStatus {
  if (!levelUnlocked) {
    return "locked";
  }
  if (isCourseCompleted(course)) {
    return "completed";
  }
  if (course.completedLessons > 0) {
    return "in_progress";
  }
  return "available";
}

/**
 * Estado de toda la ruta. Nivel 0 siempre desbloqueado; el nivel N se
 * desbloquea si N-1 está desbloqueado, tiene >= 1 curso obligatorio
 * publicado y todos sus obligatorios publicados están completados (un
 * nivel sin obligatorios publicados bloquea la cadena). Con free_roam no
 * hay candados, pero los estados por porcentaje se mantienen.
 */
export function computeRouteState(
  levels: LevelInput[],
  options: RouteStateOptions,
): LevelState[] {
  const sorted = [...levels].sort((a, b) => a.id - b.id);
  const result: LevelState[] = [];
  let previousUnlocked: boolean = true;
  let previousSatisfied: boolean = true;

  for (const [index, level] of sorted.entries()) {
    const required = level.courses.filter((course) => course.isRequired);
    const requiredCompleted = required.filter(isCourseCompleted);

    const naturallyUnlocked: boolean =
      index === 0 ? true : previousUnlocked && previousSatisfied;
    const unlocked = options.freeRoam || naturallyUnlocked;

    result.push({
      id: level.id,
      unlocked,
      requiredPublishedCourses: required.length,
      requiredCompletedCourses: requiredCompleted.length,
      courses: level.courses.map((course) => ({
        id: course.id,
        status: courseStatus(course, unlocked),
        completionPct: courseCompletionPct(course),
      })),
    });

    previousUnlocked = naturallyUnlocked;
    previousSatisfied =
      required.length > 0 && requiredCompleted.length === required.length;
  }

  return result;
}

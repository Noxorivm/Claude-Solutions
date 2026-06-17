// Secuencia lineal de lecciones dentro de un curso (docs/03 §B2/§B3):
// la primera lección del curso siempre está disponible y cada una exige
// la anterior completada; el orden cruza módulos (module.order →
// lesson.order). free_roam elimina bloqueos. Sin IO: la query de
// src/db/queries/course-detail.ts alimenta estas funciones.

export type LessonFlowStatus = "completed" | "available" | "locked";

export interface FlowLessonInput {
  slug: string;
  order: number;
  completed: boolean;
}

export interface FlowModuleInput {
  order: number;
  /** Solo lecciones published, en cualquier orden (se ordenan aquí). */
  lessons: FlowLessonInput[];
}

export interface FlowLessonState {
  slug: string;
  status: LessonFlowStatus;
}

export interface LessonFlowResult {
  /** Estados en el orden lineal del curso. */
  lessons: FlowLessonState[];
  /** Primera lección no completada del curso, o null si está completo. */
  nextPendingSlug: string | null;
}

export function computeLessonFlow(
  modules: FlowModuleInput[],
  options: { freeRoam: boolean },
): LessonFlowResult {
  const linear = [...modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) => [...mod.lessons].sort((a, b) => a.order - b.order));

  const lessons: FlowLessonState[] = [];
  let nextPendingSlug: string | null = null;
  let previousCompleted = true;

  for (const lesson of linear) {
    let status: LessonFlowStatus;
    if (lesson.completed) {
      status = "completed";
    } else if (options.freeRoam || previousCompleted) {
      status = "available";
    } else {
      status = "locked";
    }
    if (!lesson.completed && nextPendingSlug === null) {
      nextPendingSlug = lesson.slug;
    }
    lessons.push({ slug: lesson.slug, status });
    previousCompleted = lesson.completed;
  }

  return { lessons, nextPendingSlug };
}

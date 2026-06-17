import { describe, expect, it } from "vitest";

import {
  computeRouteState,
  courseCompletionPct,
  type LevelInput,
} from "@/lib/unlock";

function course(
  id: string,
  publishedLessons: number,
  completedLessons: number,
  isRequired = true,
) {
  return { id, isRequired, publishedLessons, completedLessons };
}

/** Forma del seed real: N0 con 2 cursos (11 y 9 lecciones), N2–N5 sin
 *  cursos published. */
function seedLevels(
  overrides?: Partial<Record<number, LevelInput["courses"]>>,
): LevelInput[] {
  return [
    {
      id: 0,
      courses: overrides?.[0] ?? [course("0-1", 11, 0), course("0-2", 9, 0)],
    },
    {
      id: 1,
      courses: overrides?.[1] ?? [
        course("1-1", 17, 0),
        course("1-2", 8, 0),
        course("1-3", 4, 0),
        course("1-4", 5, 0),
      ],
    },
    { id: 2, courses: overrides?.[2] ?? [] },
    { id: 3, courses: overrides?.[3] ?? [] },
    { id: 4, courses: overrides?.[4] ?? [] },
    { id: 5, courses: overrides?.[5] ?? [] },
  ];
}

describe("computeRouteState", () => {
  it("usuario nuevo con el seed: N0 disponible y N1 bloqueado", () => {
    const state = computeRouteState(seedLevels(), { freeRoam: false });
    expect(state[0].unlocked).toBe(true);
    expect(state[0].courses.map((c) => c.status)).toEqual([
      "available",
      "available",
    ]);
    expect(state[1].unlocked).toBe(false);
    expect(state[1].courses.every((c) => c.status === "locked")).toBe(true);
  });

  it("completar los obligatorios de N0 desbloquea N1 (caso seed N0→N1)", () => {
    const state = computeRouteState(
      seedLevels({ 0: [course("0-1", 11, 11), course("0-2", 9, 9)] }),
      { freeRoam: false },
    );
    expect(state[0].courses.map((c) => c.status)).toEqual([
      "completed",
      "completed",
    ]);
    expect(state[1].unlocked).toBe(true);
    expect(state[1].courses.every((c) => c.status === "available")).toBe(true);
  });

  it("un nivel sin obligatorios publicados (N2 hoy) bloquea la cadena N3+", () => {
    const state = computeRouteState(
      seedLevels({
        0: [course("0-1", 11, 11), course("0-2", 9, 9)],
        1: [
          course("1-1", 17, 17),
          course("1-2", 8, 8),
          course("1-3", 4, 4),
          course("1-4", 5, 5),
        ],
      }),
      { freeRoam: false },
    );
    expect(state[1].unlocked).toBe(true);
    expect(state[2].unlocked).toBe(true); // N1 satisfecho desbloquea N2
    expect(state[3].unlocked).toBe(false); // N2 vacío bloquea N3…
    expect(state[4].unlocked).toBe(false);
    expect(state[5].unlocked).toBe(false);
  });

  it("free_roam quita candados sin alterar los porcentajes", () => {
    const state = computeRouteState(
      seedLevels({ 0: [course("0-1", 11, 5), course("0-2", 9, 0)] }),
      { freeRoam: true },
    );
    const allStatuses = state.flatMap((l) => l.courses.map((c) => c.status));
    expect(allStatuses).not.toContain("locked");
    expect(state.every((l) => l.unlocked)).toBe(true);
    expect(state[0].courses[0]).toMatchObject({
      status: "in_progress",
      completionPct: 45,
    });
    expect(state[1].courses[0].status).toBe("available");
  });

  it("un curso opcional incompleto no bloquea el desbloqueo del siguiente nivel", () => {
    const state = computeRouteState(
      seedLevels({
        0: [
          course("0-1", 11, 11),
          course("0-2", 9, 9),
          course("0-extra", 6, 0, false),
        ],
      }),
      { freeRoam: false },
    );
    expect(state[1].unlocked).toBe(true);
  });

  it("un curso published sin lecciones published nunca cuenta como completado", () => {
    const state = computeRouteState(
      seedLevels({ 0: [course("0-1", 11, 11), course("0-vacio", 0, 0)] }),
      { freeRoam: false },
    );
    // El curso vacío es obligatorio y no completado: N1 sigue bloqueado.
    expect(state[0].courses[1]).toMatchObject({
      status: "available",
      completionPct: 0,
    });
    expect(state[1].unlocked).toBe(false);
  });

  it("redondea el porcentaje de progreso", () => {
    expect(courseCompletionPct(course("x", 3, 1))).toBe(33);
    expect(courseCompletionPct(course("x", 3, 2))).toBe(67);
    expect(courseCompletionPct(course("x", 0, 0))).toBe(0);
  });
});

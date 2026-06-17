import { describe, expect, it } from "vitest";

import { computeLessonFlow } from "@/lib/lesson-flow";

function lesson(slug: string, order: number, completed = false) {
  return { slug, order, completed };
}

describe("computeLessonFlow", () => {
  it("usuario nuevo: solo la primera disponible y siguiente = primera", () => {
    const result = computeLessonFlow(
      [
        { order: 1, lessons: [lesson("a", 1), lesson("b", 2)] },
        { order: 2, lessons: [lesson("c", 1)] },
      ],
      { freeRoam: false },
    );
    expect(result.lessons).toEqual([
      { slug: "a", status: "available" },
      { slug: "b", status: "locked" },
      { slug: "c", status: "locked" },
    ]);
    expect(result.nextPendingSlug).toBe("a");
  });

  it("la secuencia cruza módulos: completar el módulo 1 abre la primera del 2", () => {
    const result = computeLessonFlow(
      [
        { order: 1, lessons: [lesson("a", 1, true), lesson("b", 2, true)] },
        { order: 2, lessons: [lesson("c", 1), lesson("d", 2)] },
      ],
      { freeRoam: false },
    );
    expect(result.lessons).toEqual([
      { slug: "a", status: "completed" },
      { slug: "b", status: "completed" },
      { slug: "c", status: "available" },
      { slug: "d", status: "locked" },
    ]);
    expect(result.nextPendingSlug).toBe("c");
  });

  it("free_roam elimina bloqueos manteniendo completadas", () => {
    const result = computeLessonFlow(
      [
        {
          order: 1,
          lessons: [lesson("a", 1, true), lesson("b", 2), lesson("c", 3)],
        },
      ],
      { freeRoam: true },
    );
    expect(result.lessons.map((l) => l.status)).toEqual([
      "completed",
      "available",
      "available",
    ]);
    expect(result.nextPendingSlug).toBe("b");
  });

  it("todo completado: siguiente = null", () => {
    const result = computeLessonFlow(
      [
        { order: 1, lessons: [lesson("a", 1, true)] },
        { order: 2, lessons: [lesson("b", 1, true)] },
      ],
      { freeRoam: false },
    );
    expect(result.lessons.every((l) => l.status === "completed")).toBe(true);
    expect(result.nextPendingSlug).toBeNull();
  });

  it("ordena por order aunque los arrays lleguen desordenados", () => {
    const result = computeLessonFlow(
      [
        { order: 2, lessons: [lesson("c", 1)] },
        { order: 1, lessons: [lesson("b", 2), lesson("a", 1, true)] },
      ],
      { freeRoam: false },
    );
    expect(result.lessons.map((l) => l.slug)).toEqual(["a", "b", "c"]);
    expect(result.lessons.map((l) => l.status)).toEqual([
      "completed",
      "available",
      "locked",
    ]);
    expect(result.nextPendingSlug).toBe("b");
  });

  it("una completada tras un hueco sigue navegable y el hueco es la siguiente", () => {
    const result = computeLessonFlow(
      [
        {
          order: 1,
          lessons: [lesson("a", 1, true), lesson("b", 2), lesson("c", 3, true)],
        },
      ],
      { freeRoam: false },
    );
    expect(result.lessons).toEqual([
      { slug: "a", status: "completed" },
      { slug: "b", status: "available" },
      { slug: "c", status: "completed" },
    ]);
    expect(result.nextPendingSlug).toBe("b");
  });
});

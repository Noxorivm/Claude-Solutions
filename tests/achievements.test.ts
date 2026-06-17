import { describe, expect, it } from "vitest";

import { evaluateCriteria, type AchievementSnapshot } from "@/lib/achievements";

const BASE: AchievementSnapshot = {
  lessonsCompleted: 0,
  milestonesCompleted: 0,
  currentStreak: 0,
  practiceSeconds: 0,
  completedLevels: [],
};

describe("evaluateCriteria", () => {
  it("first_lesson en el umbral exacto", () => {
    expect(evaluateCriteria({ type: "first_lesson" }, BASE)).toBe(false);
    expect(
      evaluateCriteria(
        { type: "first_lesson" },
        { ...BASE, lessonsCompleted: 1 },
      ),
    ).toBe(true);
  });

  it("first_milestone", () => {
    expect(evaluateCriteria({ type: "first_milestone" }, BASE)).toBe(false);
    expect(
      evaluateCriteria(
        { type: "first_milestone" },
        { ...BASE, milestonesCompleted: 1 },
      ),
    ).toBe(true);
  });

  it("streak: 6 no, 7 sí", () => {
    expect(
      evaluateCriteria(
        { type: "streak", days: 7 },
        { ...BASE, currentStreak: 6 },
      ),
    ).toBe(false);
    expect(
      evaluateCriteria(
        { type: "streak", days: 7 },
        { ...BASE, currentStreak: 7 },
      ),
    ).toBe(true);
  });

  it("practice_hours: 9,9 h no, 10 h sí", () => {
    expect(
      evaluateCriteria(
        { type: "practice_hours", hours: 10 },
        { ...BASE, practiceSeconds: 35_640 },
      ),
    ).toBe(false);
    expect(
      evaluateCriteria(
        { type: "practice_hours", hours: 10 },
        { ...BASE, practiceSeconds: 36_000 },
      ),
    ).toBe(true);
  });

  it("level_completed", () => {
    expect(
      evaluateCriteria(
        { type: "level_completed", level: 0 },
        { ...BASE, completedLevels: [1] },
      ),
    ).toBe(false);
    expect(
      evaluateCriteria(
        { type: "level_completed", level: 0 },
        { ...BASE, completedLevels: [0, 1] },
      ),
    ).toBe(true);
  });

  it("desconocido o malformado: false sin lanzar", () => {
    expect(evaluateCriteria({ type: "unicornio" }, BASE)).toBe(false);
    expect(evaluateCriteria(null, BASE)).toBe(false);
    expect(evaluateCriteria("streak", BASE)).toBe(false);
    expect(evaluateCriteria({ type: "streak" }, BASE)).toBe(false); // sin days
    expect(
      evaluateCriteria({ type: "practice_hours", hours: "10" }, BASE),
    ).toBe(false);
  });
});

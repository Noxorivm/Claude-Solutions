// Motor de criterios de logros (docs/03 §G3). Puro: evalúa un criteria
// jsonb contra un snapshot del usuario. Un criteria desconocido o
// malformado NUNCA lanza: simplemente no se cumple (los logros nuevos
// del admin no pueden romper las actions).

export interface AchievementSnapshot {
  lessonsCompleted: number;
  milestonesCompleted: number;
  currentStreak: number;
  practiceSeconds: number;
  completedLevels: number[];
}

export interface AchievementGrant {
  slug: string;
  name: string;
}

export function evaluateCriteria(
  criteria: unknown,
  snapshot: AchievementSnapshot,
): boolean {
  if (typeof criteria !== "object" || criteria === null) {
    return false;
  }
  const c = criteria as Record<string, unknown>;
  switch (c.type) {
    case "first_lesson":
      return snapshot.lessonsCompleted >= 1;
    case "first_milestone":
      return snapshot.milestonesCompleted >= 1;
    case "streak":
      return typeof c.days === "number" && snapshot.currentStreak >= c.days;
    case "practice_hours":
      return (
        typeof c.hours === "number" &&
        snapshot.practiceSeconds >= c.hours * 3600
      );
    case "level_completed":
      return (
        typeof c.level === "number" &&
        snapshot.completedLevels.includes(c.level)
      );
    default:
      return false;
  }
}

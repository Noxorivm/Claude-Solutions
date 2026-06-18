// Regla de XP por tipo de lección (docs/05: si xp_override es null, XP
// por tipo). Pura y sin IO; las actions la orquestan.

export type XpLessonType =
  | "article"
  | "video"
  | "practice"
  | "quiz"
  | "milestone";

const XP_BY_TYPE: Record<XpLessonType, number> = {
  article: 10,
  video: 15,
  practice: 20,
  quiz: 25,
  milestone: 100,
};

export function xpForLessonType(
  type: XpLessonType,
  xpOverride?: number | null,
): number {
  if (xpOverride !== null && xpOverride !== undefined) {
    return xpOverride;
  }
  return XP_BY_TYPE[type];
}

// XP de práctica (docs/03 §G1): +1 XP por minuto entero, tope 60/día.
export const PRACTICE_XP_DAILY_CAP = 60;

export function practiceXp(
  durationSec: number,
  alreadyEarnedToday: number,
): number {
  const minutes = Math.floor(Math.max(0, durationSec) / 60);
  const remaining = Math.max(
    0,
    PRACTICE_XP_DAILY_CAP - Math.max(0, alreadyEarnedToday),
  );
  return Math.min(minutes, remaining);
}

// Niveles de jugador (docs/03 §G2: cosméticos, distintos de los niveles
// del currículo). Umbral = XP mínimo para entrar en el nivel.
export const PLAYER_LEVELS = [
  { name: "Curioso", threshold: 0 },
  { name: "Conversador", threshold: 250 },
  { name: "Prompter", threshold: 600 },
  { name: "Constructor", threshold: 1200 },
  { name: "Orquestador", threshold: 2500 },
  { name: "Arquitecto", threshold: 5000 },
] as const;

export interface PlayerLevel {
  name: (typeof PLAYER_LEVELS)[number]["name"];
  /** Umbral del nivel actual. */
  current: number;
  /** Umbral del siguiente nivel; null en el máximo. */
  nextThreshold: number | null;
  /** Progreso 0–100 hacia el siguiente umbral (100 en el máximo). */
  progressPct: number;
}

export function playerLevel(xp: number): PlayerLevel {
  const clamped = Math.max(0, xp);
  let index = 0;
  for (let i = PLAYER_LEVELS.length - 1; i >= 0; i -= 1) {
    if (clamped >= PLAYER_LEVELS[i].threshold) {
      index = i;
      break;
    }
  }
  const level = PLAYER_LEVELS[index];
  const next =
    index < PLAYER_LEVELS.length - 1 ? PLAYER_LEVELS[index + 1] : null;
  const progressPct = next
    ? Math.floor(
        ((clamped - level.threshold) / (next.threshold - level.threshold)) *
          100,
      )
    : 100;
  return {
    name: level.name,
    current: level.threshold,
    nextThreshold: next?.threshold ?? null,
    progressPct,
  };
}

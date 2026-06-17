// Cálculos puros de la página de progreso (docs/03 §D2) y de la
// mini-gráfica semanal del dashboard. El "día" es siempre el día
// natural de Europe/Madrid representado como "YYYY-MM-DD" (lib/streak).

import { nextDay, previousDay } from "@/lib/streak";

/** Lunes (Madrid) de la semana del día dado. */
export function weekStartMonday(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=domingo
  let back = (weekday + 6) % 7;
  let current = day;
  while (back > 0) {
    current = previousDay(current);
    back -= 1;
  }
  return current;
}

/** Puntos del día: lecciones×10 + minutos de práctica. */
export function dayScore(
  lessonsCompleted: number,
  practiceSec: number,
): number {
  return lessonsCompleted * 10 + Math.floor(practiceSec / 60);
}

export type HeatmapIntensity = 0 | 1 | 2 | 3;

/** Escala: 0 / 1–14 / 15–44 / ≥45 puntos. */
export function scoreToIntensity(score: number): HeatmapIntensity {
  if (score <= 0) return 0;
  if (score <= 14) return 1;
  if (score <= 44) return 2;
  return 3;
}

export interface ActivityDayInput {
  day: string;
  lessonsCompleted: number;
  practiceSec: number;
}

export interface HeatmapCell {
  date: string;
  lessons: number;
  minutes: number;
  score: number;
  intensity: HeatmapIntensity;
  /** Día posterior a hoy dentro de la semana en curso. */
  future: boolean;
}

export interface HeatmapWeek {
  /** Lunes de la semana. */
  start: string;
  /** 7 celdas, lunes a domingo. */
  cells: HeatmapCell[];
}

export const HEATMAP_WEEKS = 26;

/**
 * Grid de 26 semanas (la actual incluida, como última columna) × 7 días
 * L–D. 26×7 = 182 días exactos terminando en el domingo de esta semana.
 */
export function buildHeatmapGrid(
  todayMadrid: string,
  activeDays: ActivityDayInput[],
): HeatmapWeek[] {
  let firstMonday = weekStartMonday(todayMadrid);
  for (let i = 0; i < (HEATMAP_WEEKS - 1) * 7; i += 1) {
    firstMonday = previousDay(firstMonday);
  }

  const byDay = new Map(activeDays.map((entry) => [entry.day, entry]));
  const weeks: HeatmapWeek[] = [];
  let cursor = firstMonday;
  for (let week = 0; week < HEATMAP_WEEKS; week += 1) {
    const start = cursor;
    const cells: HeatmapCell[] = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      const entry = byDay.get(cursor);
      const lessons = entry?.lessonsCompleted ?? 0;
      const seconds = entry?.practiceSec ?? 0;
      const score = dayScore(lessons, seconds);
      cells.push({
        date: cursor,
        lessons,
        minutes: Math.floor(seconds / 60),
        score,
        intensity: scoreToIntensity(score),
        future: cursor > todayMadrid,
      });
      cursor = nextDay(cursor);
    }
    weeks.push({ start, cells });
  }
  return weeks;
}

/** Minutos de práctica de lunes a hoy (semana en curso). */
export function weekMinutes(
  todayMadrid: string,
  days: ActivityDayInput[],
): number {
  const monday = weekStartMonday(todayMadrid);
  const totalSec = days
    .filter((entry) => entry.day >= monday && entry.day <= todayMadrid)
    .reduce((acc, entry) => acc + entry.practiceSec, 0);
  return Math.floor(totalSec / 60);
}

export interface WeekBar {
  date: string;
  minutes: number;
  isToday: boolean;
  future: boolean;
}

/** Barras L–D de la semana en curso para el dashboard. */
export function buildWeekBars(
  todayMadrid: string,
  days: ActivityDayInput[],
): WeekBar[] {
  const byDay = new Map(days.map((entry) => [entry.day, entry]));
  const bars: WeekBar[] = [];
  let cursor = weekStartMonday(todayMadrid);
  for (let i = 0; i < 7; i += 1) {
    const entry = byDay.get(cursor);
    bars.push({
      date: cursor,
      minutes: Math.floor((entry?.practiceSec ?? 0) / 60),
      isToday: cursor === todayMadrid,
      future: cursor > todayMadrid,
    });
    cursor = nextDay(cursor);
  }
  return bars;
}

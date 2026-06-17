// Núcleo del repaso espaciado (docs/05: progresión 1·3·7·14·30·60).
// Aquí solo el mapping dominio→intervalo al editar mastery (docs/03 §E3:
// cambiar dominio recalcula el repaso); la progresión por repasos
// completados y el reinicio por fallo llegan en F4-T4. Puro, sin IO.

export const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dominio 1–5 → intervalo inicial en días (1,3,7,14,30). */
export function masteryToInterval(mastery: number): number {
  const clamped = Math.min(5, Math.max(1, Math.floor(mastery)));
  return INTERVALS[clamped - 1];
}

export interface MasterySchedule {
  intervalDays: number;
  nextReviewAt: Date | null;
}

/**
 * Programación al fijar el dominio a mano. Mastery 0 = sin dominio aún:
 * intervalo base 1 y sin repaso programado.
 */
export function scheduleFromMastery(
  mastery: number,
  now: Date,
): MasterySchedule {
  if (mastery <= 0) {
    return { intervalDays: 1, nextReviewAt: null };
  }
  const intervalDays = masteryToInterval(mastery);
  return {
    intervalDays,
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}

/**
 * Siguiente peldaño de la progresión. 60 es el tope (60 → 60); un valor
 * que no es peldaño exacto salta al peldaño superior más cercano.
 */
export function advanceInterval(days: number): number {
  for (const step of INTERVALS) {
    if (step > days) {
      return step;
    }
  }
  return INTERVALS[INTERVALS.length - 1];
}

export interface PracticeScheduleInput {
  intervalDays: number;
  nextReviewAt: Date | null;
  selfRating: number | null | undefined;
  practicedAt: Date;
}

/**
 * Reprogramación tras practicar una técnica (docs/03 §E4):
 * - rating < 3 reinicia SIEMPRE (1 → 1 día, 2 → 3 días);
 * - sin repaso previo, arranca en el peldaño 1;
 * - rating >= 3 avanza el peldaño SOLO si el repaso estaba vencido
 *   (nextReviewAt <= practicedAt); si no, conserva el intervalo;
 * - sin rating, conserva el intervalo.
 * El nuevo nextReviewAt siempre se calcula desde practicedAt.
 */
export function scheduleAfterPractice(
  input: PracticeScheduleInput,
): MasterySchedule {
  const { intervalDays, nextReviewAt, selfRating, practicedAt } = input;

  let next: number;
  if (selfRating !== null && selfRating !== undefined && selfRating < 3) {
    next = selfRating <= 1 ? 1 : 3;
  } else if (nextReviewAt === null) {
    next = INTERVALS[0];
  } else if (
    selfRating !== null &&
    selfRating !== undefined &&
    nextReviewAt.getTime() <= practicedAt.getTime()
  ) {
    next = advanceInterval(intervalDays);
  } else {
    next = intervalDays;
  }

  return {
    intervalDays: next,
    nextReviewAt: new Date(practicedAt.getTime() + next * DAY_MS),
  };
}

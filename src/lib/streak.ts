// Utilidades de "día" y racha (docs/03 regla 4: cuenta el día si hay
// lección completada o >= 10 min de práctica; el día se calcula en
// Europe/Madrid aunque las fechas se almacenen en UTC). Puras, sin IO.

const MADRID_DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha UTC → día natural "YYYY-MM-DD" en Europe/Madrid. */
export function toMadridDay(date: Date): string {
  return MADRID_DAY_FORMAT.format(date);
}

/** Día anterior en el calendario (aritmética de fechas, ajena a DST). */
export function previousDay(day: string): string {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Día siguiente en el calendario. */
export function nextDay(day: string): string {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

const MADRID_WALL_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function madridOffsetMs(utc: Date): number {
  const parts = Object.fromEntries(
    MADRID_WALL_FORMAT.formatToParts(utc).map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wall - Math.floor(utc.getTime() / 1000) * 1000;
}

/** Instante UTC de la medianoche de Madrid del día dado ("YYYY-MM-DD"). */
export function madridMidnightUtc(day: string): Date {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  let ts = Date.UTC(year, month - 1, dayOfMonth);
  // Dos pasadas: la primera estima el offset, la segunda lo corrige si
  // la medianoche cae al otro lado de un cambio horario.
  for (let i = 0; i < 2; i += 1) {
    ts = Date.UTC(year, month - 1, dayOfMonth) - madridOffsetMs(new Date(ts));
  }
  return new Date(ts);
}

/**
 * Rango UTC [start, end) del día natural de Madrid que contiene `date`.
 * En los cambios de hora el día dura 23 h (marzo) o 25 h (octubre).
 */
export function madridDayRange(date: Date): { start: Date; end: Date } {
  const day = toMadridDay(date);
  return {
    start: madridMidnightUtc(day),
    end: madridMidnightUtc(nextDay(day)),
  };
}

/**
 * Racha actual: días consecutivos con actividad terminando hoy o ayer
 * (la racha no se rompe hasta dejar pasar un día entero sin actividad).
 * `activeDays` son días "YYYY-MM-DD" (zona Madrid) con actividad.
 */
export function currentStreak(activeDays: string[], today: string): number {
  const active = new Set(activeDays);
  let day = active.has(today) ? today : previousDay(today);
  let streak = 0;
  while (active.has(day)) {
    streak += 1;
    day = previousDay(day);
  }
  return streak;
}

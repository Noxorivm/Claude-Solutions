// Formato de fechas de cara al usuario (es-ES, zona Europe/Madrid).
import { toMadridDay } from "@/lib/streak";

const RELATIVE = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });

const DATE_MEDIUM = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  day: "numeric",
  month: "short",
});

export function formatMadridDate(date: Date): string {
  return DATE_MEDIUM.format(date);
}

export function formatMadridDateShort(date: Date): string {
  return DATE_SHORT.format(date);
}

/** Segundos → "X min" o "X,Y h". */
export function formatHours(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = (minutes / 60).toFixed(1).replace(".", ",").replace(",0", "");
  return `${hours} h`;
}

/** Día "YYYY-MM-DD" → "12 may" (es-ES). */
export function formatDayShort(day: string): string {
  return DATE_SHORT.format(new Date(`${day}T12:00:00Z`));
}

/** Diferencia en días naturales (Madrid) y texto relativo ("dentro de 7 días"). */
export function formatRelativeDays(date: Date, now: Date): string {
  const target = toMadridDay(date);
  const today = toMadridDay(now);
  const diffDays = Math.round(
    (Date.UTC(
      Number(target.slice(0, 4)),
      Number(target.slice(5, 7)) - 1,
      Number(target.slice(8, 10)),
    ) -
      Date.UTC(
        Number(today.slice(0, 4)),
        Number(today.slice(5, 7)) - 1,
        Number(today.slice(8, 10)),
      )) /
      86_400_000,
  );
  return RELATIVE.format(diffDays, "day");
}

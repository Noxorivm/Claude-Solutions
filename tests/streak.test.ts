import { describe, expect, it } from "vitest";

import {
  currentStreak,
  madridDayRange,
  nextDay,
  previousDay,
  toMadridDay,
} from "@/lib/streak";

describe("toMadridDay", () => {
  it("23:30 UTC de un sábado de verano es domingo en Madrid (UTC+2)", () => {
    expect(toMadridDay(new Date("2026-06-13T23:30:00Z"))).toBe("2026-06-14");
  });

  it("23:30 UTC de un sábado de invierno es domingo en Madrid (UTC+1)", () => {
    expect(toMadridDay(new Date("2026-01-17T23:30:00Z"))).toBe("2026-01-18");
  });

  it("cambio horario de marzo: la 01:30 UTC ya es CEST 03:30 del mismo día", () => {
    // 2026-03-29: a las 02:00 CET los relojes saltan a las 03:00 CEST.
    expect(toMadridDay(new Date("2026-03-29T01:30:00Z"))).toBe("2026-03-29");
    expect(toMadridDay(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-29");
  });

  it("cambio horario de octubre: la 23:30 UTC del sábado sigue siendo domingo", () => {
    // 2026-10-25: a las 03:00 CEST los relojes vuelven a las 02:00 CET.
    expect(toMadridDay(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    expect(toMadridDay(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-25");
  });
});

describe("previousDay", () => {
  it("retrocede cruzando meses y años", () => {
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });
});

describe("madridDayRange", () => {
  it("día normal de verano: [22:00Z anterior, 22:00Z)", () => {
    const { start, end } = madridDayRange(new Date("2026-06-11T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-06-10T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-11T22:00:00.000Z");
  });

  it("día normal de invierno: [23:00Z anterior, 23:00Z)", () => {
    const { start, end } = madridDayRange(new Date("2026-01-15T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });

  it("cambio de marzo (2026-03-29): el día dura 23 horas", () => {
    const { start, end } = madridDayRange(new Date("2026-03-29T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-03-28T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-29T22:00:00.000Z");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it("cambio de octubre (2026-10-25): el día dura 25 horas", () => {
    const { start, end } = madridDayRange(new Date("2026-10-25T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-25T23:00:00.000Z");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("nextDay cruza meses y años", () => {
    expect(nextDay("2026-02-28")).toBe("2026-03-01");
    expect(nextDay("2025-12-31")).toBe("2026-01-01");
  });
});

describe("currentStreak", () => {
  it("racha consecutiva que incluye hoy", () => {
    expect(
      currentStreak(["2026-06-09", "2026-06-10", "2026-06-11"], "2026-06-11"),
    ).toBe(3);
  });

  it("hoy sin actividad: la racha de ayer sigue viva", () => {
    expect(currentStreak(["2026-06-09", "2026-06-10"], "2026-06-11")).toBe(2);
  });

  it("racha rota por un hueco", () => {
    expect(
      currentStreak(["2026-06-07", "2026-06-08", "2026-06-10"], "2026-06-11"),
    ).toBe(1);
    expect(currentStreak(["2026-06-08"], "2026-06-11")).toBe(0);
  });

  it("la racha cruza el cambio horario de marzo sin romperse", () => {
    expect(
      currentStreak(["2026-03-28", "2026-03-29", "2026-03-30"], "2026-03-30"),
    ).toBe(3);
  });

  it("sin actividad: cero", () => {
    expect(currentStreak([], "2026-06-11")).toBe(0);
  });
});

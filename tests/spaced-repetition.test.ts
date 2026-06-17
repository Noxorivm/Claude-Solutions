import { describe, expect, it } from "vitest";

import {
  advanceInterval,
  INTERVALS,
  masteryToInterval,
  scheduleAfterPractice,
  scheduleFromMastery,
} from "@/lib/spaced-repetition";

describe("INTERVALS", () => {
  it("es la progresión completa de docs/05", () => {
    expect(INTERVALS).toEqual([1, 3, 7, 14, 30, 60]);
  });
});

describe("masteryToInterval", () => {
  it("mapea cada nivel de dominio 1–5", () => {
    expect(masteryToInterval(1)).toBe(1);
    expect(masteryToInterval(2)).toBe(3);
    expect(masteryToInterval(3)).toBe(7);
    expect(masteryToInterval(4)).toBe(14);
    expect(masteryToInterval(5)).toBe(30);
  });

  it("clampa fuera de rango", () => {
    expect(masteryToInterval(0)).toBe(1);
    expect(masteryToInterval(9)).toBe(30);
  });
});

describe("advanceInterval", () => {
  it("avanza al siguiente peldaño", () => {
    expect(advanceInterval(1)).toBe(3);
    expect(advanceInterval(7)).toBe(14);
    expect(advanceInterval(30)).toBe(60);
  });

  it("60 es el tope", () => {
    expect(advanceInterval(60)).toBe(60);
    expect(advanceInterval(90)).toBe(60);
  });

  it("valores no exactos saltan al peldaño superior más cercano", () => {
    expect(advanceInterval(10)).toBe(14);
    expect(advanceInterval(2)).toBe(3);
    expect(advanceInterval(0)).toBe(1);
  });
});

describe("scheduleAfterPractice", () => {
  const practicedAt = new Date("2026-06-11T10:00:00Z");
  const due = new Date("2026-06-08T10:00:00Z"); // vencido hace 3 días
  const notDue = new Date("2026-06-16T10:00:00Z"); // dentro de 5 días

  it("rating 1 reinicia a 1 día desde practicedAt", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 14,
        nextReviewAt: notDue,
        selfRating: 1,
        practicedAt,
      }),
    ).toEqual({
      intervalDays: 1,
      nextReviewAt: new Date("2026-06-12T10:00:00.000Z"),
    });
  });

  it("rating 2 reinicia a 3 días", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 30,
        nextReviewAt: due,
        selfRating: 2,
        practicedAt,
      }),
    ).toEqual({
      intervalDays: 3,
      nextReviewAt: new Date("2026-06-14T10:00:00.000Z"),
    });
  });

  it("rating >= 3 sobre repaso vencido avanza el peldaño", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 7,
        nextReviewAt: due,
        selfRating: 4,
        practicedAt,
      }),
    ).toEqual({
      intervalDays: 14,
      nextReviewAt: new Date("2026-06-25T10:00:00.000Z"),
    });
  });

  it("rating >= 3 con repaso NO vencido conserva el intervalo (fecha desde practicedAt)", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 7,
        nextReviewAt: notDue,
        selfRating: 5,
        practicedAt,
      }),
    ).toEqual({
      intervalDays: 7,
      nextReviewAt: new Date("2026-06-18T10:00:00.000Z"),
    });
  });

  it("sin rating conserva el intervalo", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 14,
        nextReviewAt: due,
        selfRating: null,
        practicedAt,
      }),
    ).toEqual({
      intervalDays: 14,
      nextReviewAt: new Date("2026-06-25T10:00:00.000Z"),
    });
  });

  it("sin repaso previo arranca en el peldaño 1", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 1,
        nextReviewAt: null,
        selfRating: 4,
        practicedAt,
      }),
    ).toEqual({
      intervalDays: 1,
      nextReviewAt: new Date("2026-06-12T10:00:00.000Z"),
    });
  });

  it("tope 60: avanzar desde 60 se queda en 60", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 60,
        nextReviewAt: due,
        selfRating: 5,
        practicedAt,
      }).intervalDays,
    ).toBe(60);
  });

  it("intervalo no exacto avanza al peldaño superior", () => {
    expect(
      scheduleAfterPractice({
        intervalDays: 10,
        nextReviewAt: due,
        selfRating: 3,
        practicedAt,
      }).intervalDays,
    ).toBe(14);
  });

  it("práctica retroactiva: nextReviewAt coherente aunque ya esté vencido", () => {
    const past = new Date("2026-06-01T10:00:00Z");
    expect(
      scheduleAfterPractice({
        intervalDays: 7,
        nextReviewAt: new Date("2026-05-30T10:00:00Z"),
        selfRating: 4,
        practicedAt: past,
      }),
    ).toEqual({
      intervalDays: 14,
      nextReviewAt: new Date("2026-06-15T10:00:00.000Z"),
    });
    // rating bajo retroactivo puede dejar el repaso ya vencido hoy
    expect(
      scheduleAfterPractice({
        intervalDays: 7,
        nextReviewAt: null,
        selfRating: 1,
        practicedAt: past,
      }).nextReviewAt,
    ).toEqual(new Date("2026-06-02T10:00:00.000Z"));
  });
});

describe("scheduleFromMastery", () => {
  const now = new Date("2026-06-11T10:00:00Z");

  it("mastery 0: intervalo base sin repaso programado", () => {
    expect(scheduleFromMastery(0, now)).toEqual({
      intervalDays: 1,
      nextReviewAt: null,
    });
  });

  it("fechas exactas para cada nivel", () => {
    expect(scheduleFromMastery(1, now).nextReviewAt?.toISOString()).toBe(
      "2026-06-12T10:00:00.000Z",
    );
    expect(scheduleFromMastery(3, now)).toEqual({
      intervalDays: 7,
      nextReviewAt: new Date("2026-06-18T10:00:00.000Z"),
    });
    expect(scheduleFromMastery(5, now)).toEqual({
      intervalDays: 30,
      nextReviewAt: new Date("2026-07-11T10:00:00.000Z"),
    });
  });
});

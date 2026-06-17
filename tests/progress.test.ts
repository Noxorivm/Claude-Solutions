import { describe, expect, it } from "vitest";

import {
  buildHeatmapGrid,
  buildWeekBars,
  dayScore,
  scoreToIntensity,
  weekMinutes,
  weekStartMonday,
} from "@/lib/progress";

describe("dayScore y scoreToIntensity", () => {
  it("puntos = lecciones×10 + minutos", () => {
    expect(dayScore(0, 0)).toBe(0);
    expect(dayScore(1, 1500)).toBe(35); // 1 lección + 25 min
    expect(dayScore(2, 3600)).toBe(80);
  });

  it("escala 0 / 1–14 / 15–44 / >=45", () => {
    expect(scoreToIntensity(0)).toBe(0);
    expect(scoreToIntensity(1)).toBe(1);
    expect(scoreToIntensity(14)).toBe(1);
    expect(scoreToIntensity(15)).toBe(2);
    expect(scoreToIntensity(44)).toBe(2);
    expect(scoreToIntensity(45)).toBe(3);
    expect(scoreToIntensity(200)).toBe(3);
  });
});

describe("weekStartMonday", () => {
  it("lunes de la semana para cada día", () => {
    expect(weekStartMonday("2026-06-11")).toBe("2026-06-08"); // jueves
    expect(weekStartMonday("2026-06-08")).toBe("2026-06-08"); // lunes
    expect(weekStartMonday("2026-06-14")).toBe("2026-06-08"); // domingo
  });
});

describe("buildHeatmapGrid", () => {
  it("26 semanas × 7 días = 182 días consecutivos", () => {
    const grid = buildHeatmapGrid("2026-06-11", []);
    expect(grid).toHaveLength(26);
    const flat = grid.flatMap((week) => week.cells);
    expect(flat).toHaveLength(182);
    // consecutivos y únicos
    for (let i = 1; i < flat.length; i += 1) {
      expect(flat[i].date > flat[i - 1].date).toBe(true);
    }
    // termina en el domingo de la semana actual
    expect(flat[181].date).toBe("2026-06-14");
    expect(grid[25].start).toBe("2026-06-08");
  });

  it("hoy en lunes: 6 celdas futuras en la última semana", () => {
    const grid = buildHeatmapGrid("2026-06-08", []);
    const last = grid[25].cells;
    expect(last[0].date).toBe("2026-06-08");
    expect(last[0].future).toBe(false);
    expect(last.filter((cell) => cell.future)).toHaveLength(6);
  });

  it("hoy en domingo: sin celdas futuras y rango exacto de 182 días", () => {
    const grid = buildHeatmapGrid("2026-06-14", []);
    const flat = grid.flatMap((week) => week.cells);
    expect(flat.every((cell) => !cell.future)).toBe(true);
    expect(flat[181].date).toBe("2026-06-14");
    expect(flat[0].date).toBe("2025-12-15"); // 181 días antes
  });

  it("puntúa los días activos y deja fuera lo anterior al grid", () => {
    const grid = buildHeatmapGrid("2026-06-11", [
      { day: "2026-06-11", lessonsCompleted: 1, practiceSec: 1500 },
      { day: "2025-12-14", lessonsCompleted: 5, practiceSec: 3600 }, // fuera
    ]);
    const flat = grid.flatMap((week) => week.cells);
    const today = flat.find((cell) => cell.date === "2026-06-11");
    expect(today).toMatchObject({ lessons: 1, minutes: 25, intensity: 2 });
    expect(flat.some((cell) => cell.date === "2025-12-14")).toBe(false);
  });

  it("la semana del cambio horario de marzo es continua", () => {
    const grid = buildHeatmapGrid("2026-06-11", []);
    const dstWeek = grid.find((week) => week.start === "2026-03-23");
    expect(dstWeek).toBeDefined();
    expect(dstWeek?.cells.map((cell) => cell.date)).toEqual([
      "2026-03-23",
      "2026-03-24",
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
    ]);
  });
});

describe("weekMinutes y buildWeekBars", () => {
  const days = [
    { day: "2026-06-08", lessonsCompleted: 0, practiceSec: 600 },
    { day: "2026-06-10", lessonsCompleted: 1, practiceSec: 1500 },
    { day: "2026-06-07", lessonsCompleted: 0, practiceSec: 6000 }, // semana pasada
  ];

  it("suma solo lunes–hoy de la semana en curso", () => {
    expect(weekMinutes("2026-06-11", days)).toBe(35);
  });

  it("barras L–D con hoy destacado y futuro marcado", () => {
    const bars = buildWeekBars("2026-06-11", days);
    expect(bars).toHaveLength(7);
    expect(bars[0]).toMatchObject({ date: "2026-06-08", minutes: 10 });
    expect(bars[2]).toMatchObject({ date: "2026-06-10", minutes: 25 });
    expect(bars[3]).toMatchObject({ date: "2026-06-11", isToday: true });
    expect(bars.filter((bar) => bar.future)).toHaveLength(3);
  });
});

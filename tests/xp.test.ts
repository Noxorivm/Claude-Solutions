import { describe, expect, it } from "vitest";

import { playerLevel, practiceXp, xpForLessonType } from "@/lib/xp";

describe("xpForLessonType", () => {
  it("XP por tipo de lección", () => {
    expect(xpForLessonType("article")).toBe(10);
    expect(xpForLessonType("video")).toBe(15);
    expect(xpForLessonType("practice")).toBe(20);
    expect(xpForLessonType("quiz")).toBe(25);
    expect(xpForLessonType("milestone")).toBe(100);
  });

  it("respeta xp_override cuando no es null", () => {
    expect(xpForLessonType("article", 50)).toBe(50);
    expect(xpForLessonType("milestone", 5)).toBe(5);
    expect(xpForLessonType("video", 0)).toBe(0);
  });

  it("override null o undefined cae al XP por tipo", () => {
    expect(xpForLessonType("video", null)).toBe(15);
    expect(xpForLessonType("quiz", undefined)).toBe(25);
  });
});

describe("practiceXp", () => {
  it("caso normal: +1 XP por minuto entero", () => {
    expect(practiceXp(120, 0)).toBe(2);
    expect(practiceXp(150, 0)).toBe(2); // 2,5 min → 2
  });

  it("tope justo: 60 minutos con día limpio dan 60", () => {
    expect(practiceXp(3600, 0)).toBe(60);
  });

  it("excedido: el tope corta aunque la sesión sea más larga", () => {
    expect(practiceXp(7200, 0)).toBe(60);
    expect(practiceXp(600, 55)).toBe(5); // solo quedan 5
  });

  it("tope ya agotado: 0", () => {
    expect(practiceXp(1800, 60)).toBe(0);
    expect(practiceXp(1800, 75)).toBe(0);
  });

  it("menos de 60s: 0", () => {
    expect(practiceXp(45, 0)).toBe(0);
    expect(practiceXp(0, 0)).toBe(0);
  });
});

describe("playerLevel", () => {
  it("límites exactos de umbral: 249 es Iniciado, 250 es Aprendiz", () => {
    expect(playerLevel(249).name).toBe("Iniciado");
    expect(playerLevel(250)).toMatchObject({
      name: "Aprendiz",
      current: 250,
      nextThreshold: 600,
      progressPct: 0,
    });
  });

  it("usuario nuevo: Iniciado a 0 con siguiente en 250", () => {
    expect(playerLevel(0)).toEqual({
      name: "Iniciado",
      current: 0,
      nextThreshold: 250,
      progressPct: 0,
    });
  });

  it("progreso hacia el siguiente umbral (floor, nunca 100 antes de subir)", () => {
    expect(playerLevel(10).progressPct).toBe(4);
    expect(playerLevel(125).progressPct).toBe(50);
    expect(playerLevel(249).progressPct).toBe(99);
    expect(playerLevel(425).progressPct).toBe(50); // mitad de 250→600
  });

  it("todos los umbrales asignan su nivel", () => {
    expect(playerLevel(600).name).toBe("Ilusionista");
    expect(playerLevel(1199).name).toBe("Ilusionista");
    expect(playerLevel(1200).name).toBe("Prestidigitador");
    expect(playerLevel(2500).name).toBe("Maestro");
  });

  it("5000+ es Profesional sin siguiente umbral", () => {
    expect(playerLevel(5000)).toEqual({
      name: "Profesional",
      current: 5000,
      nextThreshold: null,
      progressPct: 100,
    });
    expect(playerLevel(99999).nextThreshold).toBeNull();
  });

  it("xp negativo se trata como 0", () => {
    expect(playerLevel(-5)).toMatchObject({ name: "Iniciado", progressPct: 0 });
  });
});

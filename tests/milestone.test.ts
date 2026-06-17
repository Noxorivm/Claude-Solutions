import { describe, expect, it } from "vitest";

import { ratingsAverage, validateRatings } from "@/lib/milestone";

const ITEMS = ["a", "b", "c"];

describe("validateRatings", () => {
  it("rúbrica completa: ok", () => {
    expect(validateRatings(ITEMS, { a: 4, b: 3, c: 5 })).toEqual({ ok: true });
  });

  it("incompleta: lista los criterios sin puntuar", () => {
    expect(validateRatings(ITEMS, { a: 4 })).toEqual({
      ok: false,
      reason: "missing",
      itemIds: ["b", "c"],
    });
  });

  it("fuera de rango (0, 6, decimales): invalid", () => {
    expect(validateRatings(ITEMS, { a: 0, b: 3, c: 5 })).toMatchObject({
      ok: false,
      reason: "invalid",
      itemIds: ["a"],
    });
    expect(validateRatings(ITEMS, { a: 6, b: 3, c: 5 })).toMatchObject({
      reason: "invalid",
    });
    expect(validateRatings(ITEMS, { a: 3.5, b: 3, c: 5 })).toMatchObject({
      reason: "invalid",
    });
  });

  it("id ajeno: invalid aunque el resto esté bien", () => {
    expect(validateRatings(ITEMS, { a: 4, b: 3, c: 5, intruso: 4 })).toEqual({
      ok: false,
      reason: "invalid",
      itemIds: ["intruso"],
    });
  });

  it("media con 1 decimal", () => {
    expect(ratingsAverage({ a: 4, b: 4, c: 3, d: 4 })).toBe(3.8);
    expect(ratingsAverage({ a: 5, b: 5 })).toBe(5);
    expect(ratingsAverage({})).toBe(0);
  });
});

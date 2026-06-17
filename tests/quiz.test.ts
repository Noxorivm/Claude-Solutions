import { describe, expect, it } from "vitest";

import { gradeQuiz, shuffle } from "@/lib/quiz";

const QUESTIONS = [
  { id: "q1", correctOptionId: "q1-a" },
  { id: "q2", correctOptionId: "q2-a" },
  { id: "q3", correctOptionId: "q3-a" },
  { id: "q4", correctOptionId: "q4-a" },
  { id: "q5", correctOptionId: "q5-a" },
];

describe("gradeQuiz", () => {
  it("4/5 con pass 80 aprueba", () => {
    const result = gradeQuiz(
      QUESTIONS,
      { q1: "q1-a", q2: "q2-a", q3: "q3-a", q4: "q4-a", q5: "q5-x" },
      80,
    );
    expect(result.scorePct).toBe(80);
    expect(result.passed).toBe(true);
  });

  it("3/5 con pass 80 no aprueba", () => {
    const result = gradeQuiz(
      QUESTIONS,
      { q1: "q1-a", q2: "q2-a", q3: "q3-a", q4: "x", q5: "y" },
      80,
    );
    expect(result.scorePct).toBe(60);
    expect(result.passed).toBe(false);
  });

  it("sin responder cuenta como fallo y queda reflejado", () => {
    const result = gradeQuiz(QUESTIONS, { q1: "q1-a" }, 80);
    expect(result.scorePct).toBe(20);
    expect(result.perQuestion[1]).toEqual({
      questionId: "q2",
      selectedOptionId: null,
      correctOptionId: "q2-a",
      correct: false,
    });
  });

  it("redondea la nota", () => {
    const three = QUESTIONS.slice(0, 3);
    expect(gradeQuiz(three, { q1: "q1-a" }, 80).scorePct).toBe(33);
    expect(gradeQuiz(three, { q1: "q1-a", q2: "q2-a" }, 80).scorePct).toBe(67);
  });

  it("quiz vacío: nota 0 y no aprobado", () => {
    expect(gradeQuiz([], {}, 80)).toEqual({
      scorePct: 0,
      passed: false,
      perQuestion: [],
    });
  });
});

describe("shuffle", () => {
  function lcg(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  it("es determinista con rng fijo y no muta el original", () => {
    const original = ["a", "b", "c", "d", "e"];
    const first = shuffle(original, lcg(42));
    const second = shuffle(original, lcg(42));
    expect(first).toEqual(second);
    expect(original).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("devuelve una permutación de los mismos elementos", () => {
    const original = [1, 2, 3, 4, 5, 6, 7];
    const result = shuffle(original, lcg(7));
    expect([...result].sort()).toEqual([...original].sort());
    expect(result).not.toEqual(original); // con esta semilla, cambia
  });
});

import { describe, expect, it } from "vitest";

import {
  checklistItemSchema,
  courseSchema,
  lessonSchema,
  moduleSchema,
  quizPassPctSchema,
  quizQuestionSchema,
  resourceSchema,
  suggestSlug,
  techniqueSchema,
} from "@/lib/validators/content";

const VALID_COURSE = {
  title: "Curso de prueba",
  slug: "curso-de-prueba",
  summary: "Un resumen suficientemente largo para pasar.",
  levelId: 0,
  orderInLevel: 3,
  estHours: 4.5,
  isRequired: true,
  status: "draft" as const,
  descriptionMd: null,
};

function firstError(
  result: ReturnType<typeof courseSchema.safeParse>,
  field: string,
): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("courseSchema", () => {
  it("acepta un curso válido (y estHours opcional)", () => {
    expect(courseSchema.safeParse(VALID_COURSE).success).toBe(true);
    expect(
      courseSchema.safeParse({ ...VALID_COURSE, estHours: null }).success,
    ).toBe(true);
  });

  it("título corto", () => {
    const r = courseSchema.safeParse({ ...VALID_COURSE, title: "ab" });
    expect(firstError(r, "title")).toBe(
      "El título necesita al menos 3 caracteres.",
    );
  });

  it("slug con espacios o mayúsculas", () => {
    const r = courseSchema.safeParse({ ...VALID_COURSE, slug: "Con Espacios" });
    expect(firstError(r, "slug")).toBe(
      "Usa minúsculas, números y guiones (kebab-case).",
    );
    expect(
      courseSchema.safeParse({ ...VALID_COURSE, slug: "doble--guion" }).success,
    ).toBe(false);
  });

  it("resumen corto, nivel fuera de rango, orden 0", () => {
    expect(
      firstError(
        courseSchema.safeParse({ ...VALID_COURSE, summary: "corto" }),
        "summary",
      ),
    ).toBe("El resumen necesita al menos 10 caracteres.");
    expect(
      firstError(
        courseSchema.safeParse({ ...VALID_COURSE, levelId: 6 }),
        "levelId",
      ),
    ).toBe("El nivel va de 0 a 5.");
    expect(
      firstError(
        courseSchema.safeParse({ ...VALID_COURSE, orderInLevel: 0 }),
        "orderInLevel",
      ),
    ).toBe("El orden empieza en 1.");
  });

  it("horas fuera de rango (negativas o ínfimas)", () => {
    expect(
      firstError(
        courseSchema.safeParse({ ...VALID_COURSE, estHours: -1 }),
        "estHours",
      ),
    ).toBe("Las horas estimadas van de 0,5 a 200.");
    expect(
      courseSchema.safeParse({ ...VALID_COURSE, estHours: 0.2 }).success,
    ).toBe(false);
  });

  it("estado inválido", () => {
    expect(
      courseSchema.safeParse({ ...VALID_COURSE, status: "hidden" }).success,
    ).toBe(false);
  });
});

describe("moduleSchema", () => {
  it("acepta válido y rechaza orden 0 / título corto", () => {
    expect(
      moduleSchema.safeParse({ title: "Módulo uno", order: 1 }).success,
    ).toBe(true);
    expect(moduleSchema.safeParse({ title: "ab", order: 1 }).success).toBe(
      false,
    );
    expect(moduleSchema.safeParse({ title: "Módulo", order: 0 }).success).toBe(
      false,
    );
  });
});

const VALID_LESSON = {
  title: "Lección de prueba",
  slug: "leccion-de-prueba",
  moduleId: "5f0b0c5e-7a8d-4c4b-9a2f-1b3c4d5e6f70",
  type: "video" as const,
  contentMd: "# Hola",
  videoUrl: "https://www.youtube.com/watch?v=abc123",
  durationMin: 12,
  xpOverride: null,
  status: "draft" as const,
};

describe("lessonSchema", () => {
  it("acepta una lección válida (opcionales en null)", () => {
    expect(lessonSchema.safeParse(VALID_LESSON).success).toBe(true);
    expect(
      lessonSchema.safeParse({
        ...VALID_LESSON,
        videoUrl: null,
        durationMin: null,
        contentMd: null,
      }).success,
    ).toBe(true);
  });

  it("rechaza tipo desconocido, módulo no uuid y slug no kebab", () => {
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, type: "podcast" }).success,
    ).toBe(false);
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, moduleId: "nope" }).success,
    ).toBe(false);
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, slug: "Mayúsculas" }).success,
    ).toBe(false);
  });

  it("duración mínima 1 y xp_override no negativo (0 válido)", () => {
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, durationMin: 0 }).success,
    ).toBe(false);
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, xpOverride: -5 }).success,
    ).toBe(false);
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, xpOverride: 0 }).success,
    ).toBe(true);
  });

  it("videoUrl debe ser http(s) válida si está presente", () => {
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, videoUrl: "ftp://x.com/v.mp4" })
        .success,
    ).toBe(false);
    expect(
      lessonSchema.safeParse({ ...VALID_LESSON, videoUrl: "no-es-url" })
        .success,
    ).toBe(false);
  });
});

describe("checklistItemSchema", () => {
  it("texto entre 3 y 300", () => {
    expect(checklistItemSchema.safeParse({ text: "Practicar" }).success).toBe(
      true,
    );
    expect(checklistItemSchema.safeParse({ text: "ab" }).success).toBe(false);
    expect(
      checklistItemSchema.safeParse({ text: "x".repeat(301) }).success,
    ).toBe(false);
  });
});

describe("resourceSchema", () => {
  const VALID_RESOURCE = {
    kind: "pdf" as const,
    title: "Guía en PDF",
    url: "https://example.com/guia.pdf",
  };

  it("acepta url externa y subida propia", () => {
    expect(resourceSchema.safeParse(VALID_RESOURCE).success).toBe(true);
    expect(
      resourceSchema.safeParse({
        ...VALID_RESOURCE,
        url: "/uploads/abc123.png",
      }).success,
    ).toBe(true);
  });

  it("rechaza kind desconocido y urls raras", () => {
    expect(
      resourceSchema.safeParse({ ...VALID_RESOURCE, kind: "zip" }).success,
    ).toBe(false);
    expect(
      resourceSchema.safeParse({ ...VALID_RESOURCE, url: "ftp://x.com/a.pdf" })
        .success,
    ).toBe(false);
    expect(
      resourceSchema.safeParse({ ...VALID_RESOURCE, url: "/etc/passwd" })
        .success,
    ).toBe(false);
    expect(
      resourceSchema.safeParse({
        ...VALID_RESOURCE,
        url: "/uploads/../secreto.png",
      }).success,
    ).toBe(false);
  });
});

describe("techniqueSchema", () => {
  const VALID_TECHNIQUE = {
    name: "Doble lift",
    slug: "doble-lift",
    category: "cards" as const,
    levelNumber: 1,
    descriptionMd: null,
  };

  it("acepta una técnica válida", () => {
    expect(techniqueSchema.safeParse(VALID_TECHNIQUE).success).toBe(true);
  });

  it("rechaza categoría desconocida, nivel fuera de rango y slug no kebab", () => {
    expect(
      techniqueSchema.safeParse({ ...VALID_TECHNIQUE, category: "ropes" })
        .success,
    ).toBe(false);
    expect(
      techniqueSchema.safeParse({ ...VALID_TECHNIQUE, levelNumber: 6 }).success,
    ).toBe(false);
    expect(
      techniqueSchema.safeParse({ ...VALID_TECHNIQUE, slug: "Doble Lift" })
        .success,
    ).toBe(false);
  });
});

describe("quizPassPctSchema", () => {
  it("acepta 1..100 y rechaza fuera de rango", () => {
    expect(quizPassPctSchema.safeParse({ passPct: 80 }).success).toBe(true);
    expect(quizPassPctSchema.safeParse({ passPct: 0 }).success).toBe(false);
    expect(quizPassPctSchema.safeParse({ passPct: 101 }).success).toBe(false);
  });
});

describe("quizQuestionSchema", () => {
  const VALID_SINGLE = {
    prompt: "¿Cuál es la salida natural?",
    kind: "single" as const,
    explanation: null,
    options: [
      { text: "La correcta", isCorrect: true },
      { text: "Una incorrecta", isCorrect: false },
      { text: "Otra incorrecta", isCorrect: false },
    ],
  };

  it("acepta single válida y truefalse válida", () => {
    expect(quizQuestionSchema.safeParse(VALID_SINGLE).success).toBe(true);
    expect(
      quizQuestionSchema.safeParse({
        prompt: "¿La misdirection es atención?",
        kind: "truefalse",
        explanation: "Lo es.",
        options: [
          { text: "Verdadero", isCorrect: true },
          { text: "Falso", isCorrect: false },
        ],
      }).success,
    ).toBe(true);
  });

  it("single: rechaza 0 correctas, 2 correctas y menos de 2 opciones", () => {
    expect(
      quizQuestionSchema.safeParse({
        ...VALID_SINGLE,
        options: VALID_SINGLE.options.map((o) => ({ ...o, isCorrect: false })),
      }).success,
    ).toBe(false);
    expect(
      quizQuestionSchema.safeParse({
        ...VALID_SINGLE,
        options: VALID_SINGLE.options.map((o) => ({ ...o, isCorrect: true })),
      }).success,
    ).toBe(false);
    expect(
      quizQuestionSchema.safeParse({
        ...VALID_SINGLE,
        options: [{ text: "Única", isCorrect: true }],
      }).success,
    ).toBe(false);
  });

  it("truefalse: exige exactamente Verdadero/Falso con una correcta", () => {
    expect(
      quizQuestionSchema.safeParse({
        ...VALID_SINGLE,
        kind: "truefalse",
        options: [
          { text: "Sí", isCorrect: true },
          { text: "No", isCorrect: false },
        ],
      }).success,
    ).toBe(false);
    expect(
      quizQuestionSchema.safeParse({
        ...VALID_SINGLE,
        kind: "truefalse",
        options: [
          { text: "Verdadero", isCorrect: true },
          { text: "Falso", isCorrect: true },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("suggestSlug", () => {
  it("kebabiza con acentos y símbolos", () => {
    expect(suggestSlug("Curso de Prueba QA")).toBe("curso-de-prueba-qa");
    expect(suggestSlug("Magia & Cía: ¡Núm. 1!")).toBe("magia-cia-num-1");
    expect(suggestSlug("  --Bordes--  ")).toBe("bordes");
  });
});

// Validadores de contenido del admin (docs/04: actions con requireAdmin
// + Zod; validadores compartidos en lib/validators con test). Mensajes
// en español: van directos a los errores por campo del formulario.
import { z } from "zod";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 caracteres.")
    .max(120, "El título no puede pasar de 120 caracteres."),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio.")
    .max(200, "El slug no puede pasar de 200 caracteres.")
    .regex(KEBAB, "Usa minúsculas, números y guiones (kebab-case)."),
  summary: z
    .string()
    .trim()
    .min(10, "El resumen necesita al menos 10 caracteres.")
    .max(300, "El resumen no puede pasar de 300 caracteres."),
  levelId: z
    .number({ message: "Elige un nivel." })
    .int()
    .min(0, "El nivel va de 0 a 5.")
    .max(5, "El nivel va de 0 a 5."),
  orderInLevel: z
    .number({ message: "El orden debe ser un número." })
    .int("El orden debe ser un número entero.")
    .min(1, "El orden empieza en 1."),
  estHours: z
    .number({ message: "Las horas deben ser un número." })
    .min(0.5, "Las horas estimadas van de 0,5 a 200.")
    .max(200, "Las horas estimadas van de 0,5 a 200.")
    .nullish(),
  isRequired: z.boolean(),
  status: z.enum(["draft", "published", "archived"], {
    message: "Estado no válido.",
  }),
  descriptionMd: z
    .string()
    .max(20000, "La descripción no puede pasar de 20.000 caracteres.")
    .nullish(),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 caracteres.")
    .max(120, "El título no puede pasar de 120 caracteres."),
  order: z
    .number({ message: "El orden debe ser un número." })
    .int("El orden debe ser un número entero.")
    .min(1, "El orden empieza en 1."),
});

export type ModuleInput = z.infer<typeof moduleSchema>;

const HTTP_URL = z
  .string()
  .trim()
  .url("Debe ser una URL válida.")
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "Solo se admiten URLs http(s).",
  );

export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 caracteres.")
    .max(120, "El título no puede pasar de 120 caracteres."),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio.")
    .max(200, "El slug no puede pasar de 200 caracteres.")
    .regex(KEBAB, "Usa minúsculas, números y guiones (kebab-case)."),
  moduleId: z.string().uuid("Elige un módulo."),
  type: z.enum(["article", "video", "practice", "quiz", "milestone"], {
    message: "Tipo no válido.",
  }),
  contentMd: z
    .string()
    .max(50000, "El contenido no puede pasar de 50.000 caracteres.")
    .nullish(),
  videoUrl: HTTP_URL.nullish(),
  durationMin: z
    .number({ message: "La duración debe ser un número." })
    .int("La duración debe ser un número entero.")
    .min(1, "La duración mínima es 1 minuto.")
    .nullish(),
  xpOverride: z
    .number({ message: "El XP debe ser un número." })
    .int("El XP debe ser un número entero.")
    .min(0, "El XP no puede ser negativo.")
    .nullish(),
  status: z.enum(["draft", "published", "archived"], {
    message: "Estado no válido.",
  }),
});

export type LessonInput = z.infer<typeof lessonSchema>;

export const checklistItemSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "El texto necesita al menos 3 caracteres.")
    .max(300, "El texto no puede pasar de 300 caracteres."),
});

/** URL de recurso: externa http(s) o subida propia /uploads/... */
const resourceUrl = z
  .string()
  .trim()
  .min(1, "La URL es obligatoria.")
  .refine(
    (value) => /^https?:\/\/.+/.test(value) || /^\/uploads\/[^/]+$/.test(value),
    "Debe ser una URL http(s) o una subida (/uploads/…).",
  );

export const resourceSchema = z.object({
  kind: z.enum(["pdf", "image", "link", "file"], {
    message: "Tipo de recurso no válido.",
  }),
  title: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 caracteres.")
    .max(120, "El título no puede pasar de 120 caracteres."),
  url: resourceUrl,
});

export type ResourceInput = z.infer<typeof resourceSchema>;

export const techniqueSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre necesita al menos 3 caracteres.")
    .max(120, "El nombre no puede pasar de 120 caracteres."),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio.")
    .max(200, "El slug no puede pasar de 200 caracteres.")
    .regex(KEBAB, "Usa minúsculas, números y guiones (kebab-case)."),
  category: z.enum(
    ["conversation", "prompting", "tools", "api", "agents", "theory"],
    { message: "Categoría no válida." },
  ),
  levelNumber: z
    .number({ message: "Elige un nivel." })
    .int()
    .min(0, "El nivel va de 0 a 5.")
    .max(5, "El nivel va de 0 a 5."),
  descriptionMd: z
    .string()
    .max(20000, "La descripción no puede pasar de 20.000 caracteres.")
    .nullish(),
});

export type TechniqueInput = z.infer<typeof techniqueSchema>;

export const quizPassPctSchema = z.object({
  passPct: z
    .number({ message: "La nota mínima debe ser un número." })
    .int("La nota mínima debe ser un número entero.")
    .min(1, "La nota mínima va de 1 a 100.")
    .max(100, "La nota mínima va de 1 a 100."),
});

const quizOptionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "El texto de la opción es obligatorio.")
    .max(300, "La opción no puede pasar de 300 caracteres."),
  isCorrect: z.boolean(),
});

/** Pregunta completa con sus opciones. Reglas (docs/05 §quiz_*):
 *  single → ≥2 opciones y EXACTAMENTE una correcta;
 *  truefalse → exactamente Verdadero/Falso con una correcta. */
export const quizQuestionSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(3, "El enunciado necesita al menos 3 caracteres.")
      .max(500, "El enunciado no puede pasar de 500 caracteres."),
    kind: z.enum(["single", "truefalse"], { message: "Tipo no válido." }),
    explanation: z
      .string()
      .max(1000, "La explicación no puede pasar de 1.000 caracteres.")
      .nullish(),
    options: z
      .array(quizOptionSchema)
      .max(8, "Como mucho 8 opciones por pregunta."),
  })
  .superRefine((question, ctx) => {
    const correct = question.options.filter((o) => o.isCorrect).length;
    if (question.kind === "single") {
      if (question.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Una pregunta necesita al menos 2 opciones.",
        });
      }
      if (correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Marca exactamente una opción correcta.",
        });
      }
    } else {
      const texts = question.options.map((o) => o.text);
      if (
        question.options.length !== 2 ||
        texts[0] !== "Verdadero" ||
        texts[1] !== "Falso"
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message:
            "Una pregunta de verdadero/falso lleva exactamente las opciones Verdadero y Falso.",
        });
      }
      if (correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Marca exactamente una opción correcta.",
        });
      }
    }
  });

export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;

/** Sugerencia de slug kebab a partir de un título. */
export function suggestSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

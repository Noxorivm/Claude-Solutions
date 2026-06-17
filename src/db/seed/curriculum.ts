// Curriculum seed data, typed and human-editable. Source of truth: docs/02.
//
// CS-T1 — Currículo EN BLANCO. Esta bifurcación de Cubiletica («Claude
// Solutions») arranca sin contenido de magia: los 6 niveles existen, con
// nombre y tagline, pero SIN cursos, módulos ni lecciones. El catálogo de
// técnicas y los quizzes quedan vacíos; los logros se mantienen genéricos.
// El temario de Claude Solutions (cursos y lecciones) llega en una tarea
// posterior; el admin y el seed siguen siendo el camino para poblarlo.
//
// Slug convention (stable, globally unique):
//   - levels:  level name in kebab ("primeros-pasos", "conversar-con-criterio", …)
//   - courses: "{nivel}-{orden}-{titulo-kebab}"
//   - lessons: "{nivel}-{curso}-{titulo-kebab-corto}"

export type SeedLessonType =
  | "article"
  | "video"
  | "practice"
  | "quiz"
  | "milestone";

export interface SeedLesson {
  slug: string;
  title: string;
  type: SeedLessonType;
  durationMin: number;
  /** Criterios de superación (docs/02 §2.6); en milestones actúa de rúbrica. */
  checklist?: string[];
  /** Slugs del catálogo de técnicas (docs/02 §10). */
  techniques?: string[];
  /** Por defecto hereda del curso; 'draft' para lecciones aún sin redactar
   *  dentro de un curso ya publicado. */
  status?: "draft" | "published";
}

export interface SeedModule {
  title: string;
  lessons?: SeedLesson[];
}

export interface SeedCourse {
  slug: string;
  title: string;
  summary: string;
  estHours?: string;
  isRequired?: boolean;
  status: "draft" | "published";
  modules: SeedModule[];
}

export interface SeedLevel {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  descriptionMd: string;
  courses: SeedCourse[];
}

// Los 6 niveles de Claude Solutions (N0–N5), renombrados y SIN cursos. El
// orden y los ids se conservan (0–5) por compatibilidad con el desbloqueo y
// el upsert idempotente por `levels.id`.
export const curriculum: SeedLevel[] = [
  {
    id: 0,
    slug: "primeros-pasos",
    name: "Primeros pasos",
    tagline:
      "Qué es Claude, cómo hablarle y tus primeras conversaciones útiles.",
    descriptionMd:
      "Nivel de entrada: del primer mensaje a sacarle partido a la app de Claude.",
    courses: [],
  },
  {
    id: 1,
    slug: "conversar-con-criterio",
    name: "Conversar con criterio",
    tagline: "Dar contexto, iterar y pedir lo que de verdad necesitas.",
    descriptionMd:
      "Conversaciones que funcionan: contexto, seguimiento y juicio crítico de las respuestas.",
    courses: [],
  },
  {
    id: 2,
    slug: "el-oficio-del-prompt",
    name: "El oficio del prompt",
    tagline: "Estructura, ejemplos y patrones para prompts fiables.",
    descriptionMd:
      "Prompting como oficio: instrucciones claras, ejemplos y formatos repetibles.",
    courses: [],
  },
  {
    id: 3,
    slug: "claude-que-actua",
    name: "Claude que actúa",
    tagline: "Proyectos, archivos, artefactos y herramientas conectadas.",
    descriptionMd:
      "Más allá del chat: proyectos, documentos, artefactos y conectores.",
    courses: [],
  },
  {
    id: 4,
    slug: "construir-con-la-api",
    name: "Construir con la API",
    tagline: "Mensajes, streaming y uso de herramientas desde la API.",
    descriptionMd:
      "Programar con Claude: la API de mensajes, streaming y tool use.",
    courses: [],
  },
  {
    id: 5,
    slug: "sistemas-agenticos",
    name: "Sistemas agénticos en producción",
    tagline: "Agentes, MCP, orquestación y despliegue real.",
    descriptionMd:
      "Llevar agentes a producción: MCP, orquestación, evaluación y operación.",
    courses: [],
  },
];

// Catálogo de técnicas (docs/02 §10). VACÍO en CS-T1: el remapeo de
// conceptos al dominio de Claude llega en una tarea posterior.
export interface SeedTechnique {
  slug: string;
  name: string;
  category: "cards" | "coins" | "mentalism" | "classics" | "stage" | "theory";
  levelNumber: number;
}

export const techniquesSeed: SeedTechnique[] = [];

// Quizzes del seed. VACÍO en CS-T1: no hay lecciones a las que asociarlos.
export interface SeedQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface SeedQuizQuestion {
  prompt: string;
  kind: "single" | "truefalse";
  explanation: string;
  options: SeedQuizOption[];
}

export interface SeedQuiz {
  lessonSlug: string;
  passPct: number;
  questions: SeedQuizQuestion[];
}

export const quizzesSeed: SeedQuiz[] = [];

// Logros base genéricos (independientes del temario). El motor de criterios
// vive en lib/achievements. Se conservan para que la vitrina y la mecánica
// de XP/rachas funcionen desde el primer día, con currículo vacío.
// criteria: {type:'first_lesson'} | {type:'first_milestone'} |
//           {type:'streak',days:n} | {type:'practice_hours',hours:n} |
//           {type:'level_completed',level:n}
export interface SeedAchievement {
  slug: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, unknown>;
}

export const achievementsSeed: SeedAchievement[] = [
  {
    slug: "primera-leccion",
    name: "Primera lección",
    description: "Completa tu primera lección.",
    icon: "sparkles",
    criteria: { type: "first_lesson" },
  },
  {
    slug: "primer-hito",
    name: "Primer hito",
    description: "Supera tu primer hito de nivel.",
    icon: "trophy",
    criteria: { type: "first_milestone" },
  },
  {
    slug: "racha-7",
    name: "Racha de 7",
    description: "Aprende o practica 7 días seguidos.",
    icon: "flame",
    criteria: { type: "streak", days: 7 },
  },
  {
    slug: "racha-30",
    name: "Racha de 30",
    description: "Un mes entero sin fallar un día.",
    icon: "flame",
    criteria: { type: "streak", days: 30 },
  },
  {
    slug: "10-horas",
    name: "10 horas de práctica",
    description: "Acumula 10 horas en el diario de práctica.",
    icon: "clock",
    criteria: { type: "practice_hours", hours: 10 },
  },
  {
    slug: "nivel-0-completado",
    name: "Primeros pasos completado",
    description: "Completa todos los cursos obligatorios del Nivel 0.",
    icon: "crown",
    criteria: { type: "level_completed", level: 0 },
  },
];

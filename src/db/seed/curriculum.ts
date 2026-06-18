// Curriculum seed data, typed and human-editable. Source of truth: docs/02.
//
// CS-T3 — ESQUELETO EN BORRADOR. Encaja la estructura de docs/02 en el seed:
// 6 niveles; N0–N1 a nivel de lección (5 cursos, 15 módulos, 50 lecciones);
// N2–N5 a nivel de módulo (1 curso por nivel, 17 módulos, sin lecciones); y el
// catálogo de 41 habilidades. TODO en `draft` y SIN cuerpos: cada lección lleva
// content_md='[REDACTAR]' (lo pone el seed) y no tiene checklist.
//
// Diferido a otras tareas (NO en CS-T3):
//   - Cuerpos de lección, checklists y preguntas de quiz  → CS-T4.
//   - Remapeo de conceptos (relabel de `technique_category`, "exercise" como
//     tipo propio, "práctica" → uso, rangos)              → CS-T5.
//   - Lecciones de tipo `simulation` y el simulador        → CS-T6.
//
// MAPEO DE TIPOS (docs/02 §4 usa tipos que el enum heredado no tiene):
//   - `exercise`   → `practice` (el tipo práctico existente; CS-T5 rehará su
//     semántica/label/gate). Aquí TODA lección "exercise" de docs/02 entra como
//     `practice`.
//   - `simulation` → NO se crea ninguna lección de este tipo (docs/02 N0–N1 no
//     define ninguna; el tipo queda reservado para CS-T6).
//   - `article` / `quiz` / `milestone` → tal cual.
//
// Nota sobre módulos: docs/02 cuenta 15 módulos en N0–N1 (5 cursos × 3 módulos);
// el resumen de CS-T2 dijo "18" por error. Se encaja lo que docs/02 DEFINE (15).
//
// Slug convention (stable, globally unique):
//   - levels:  level name in kebab ("primeros-pasos", …)
//   - courses: "{nivel}-{orden}-{titulo-kebab}"        e.g. "0-1-bienvenido-a-claude"
//   - lessons: "{nivel}-{curso}-{titulo-kebab-corto}"  e.g. "0-1-que-es-claude"

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
  /** Criterios de superación (docs/02 §3); se redactan junto al cuerpo en CS-T4. */
  checklist?: string[];
  /** Slugs del catálogo de habilidades (§ Habilidades). */
  techniques?: string[];
  /** Por defecto hereda del curso; aquí todo hereda 'draft'. */
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

// Duraciones placeholder por tipo (min); se afinan en CS-T4.
const A = 10; // article
const P = 15; // practice (exercise mapeado)
const Q = 10; // quiz
const M = 20; // milestone

export const curriculum: SeedLevel[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // Nivel 0 — Primeros pasos (docs/02 §6). 2 cursos, 6 módulos, 26 lecciones.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 0,
    slug: "primeros-pasos",
    name: "Primeros pasos",
    tagline:
      "Qué es Claude, cómo hablarle y tus primeras conversaciones útiles.",
    descriptionMd:
      "**Hito de salida:** resuelve una tarea real tuya de principio a fin en el chat.",
    courses: [
      {
        slug: "0-1-bienvenido-a-claude",
        title: "Bienvenido a Claude",
        summary:
          "Qué es Claude, dónde usarlo, cómo hablarle y qué esperar (y qué no) de él.",
        status: "draft",
        modules: [
          {
            title: "Qué es Claude",
            lessons: [
              { slug: "0-1-que-es-claude", title: "¿Qué es Claude?", type: "article", durationMin: A },
              { slug: "0-1-donde-vive-claude", title: "Dónde vive Claude: web, escritorio y móvil", type: "article", durationMin: A },
              { slug: "0-1-familias-de-modelos", title: "Las familias de modelos (Opus, Sonnet, Haiku)", type: "article", durationMin: A, techniques: ["elegir-modelo"] },
              {
                slug: "0-1-primer-mensaje",
                title: "Tu primera cuenta y tu primer mensaje",
                type: "practice",
                durationMin: P,
                checklist: [
                  "He creado mi cuenta y abierto un chat nuevo.",
                  "He escrito un primer mensaje sobre una tarea real mía.",
                  "He leído la respuesta y le he pedido al menos un cambio.",
                  "Me he quedado con la versión que me sirve.",
                ],
              },
              { slug: "0-1-repaso-que-es-claude", title: "Repaso: qué es y qué no es Claude", type: "quiz", durationMin: Q },
            ],
          },
          {
            title: "Hablar con Claude",
            lessons: [
              { slug: "0-1-la-conversacion-como-interfaz", title: "La conversación como interfaz", type: "article", durationMin: A },
              { slug: "0-1-que-puede-hacer-en-el-chat", title: "Qué puede hacer ya en el chat", type: "article", durationMin: A },
              {
                slug: "0-1-reescribir-correo-tres-tonos",
                title: "Reescribe un correo en tres tonos distintos",
                type: "practice",
                durationMin: P,
                checklist: [
                  "He partido de un correo o texto mío.",
                  "He pedido al menos tres tonos distintos.",
                  "He comparado las versiones y elegido la que mejor encaja.",
                ],
              },
              { slug: "0-1-adjuntar-archivos-imagenes", title: "Adjuntar archivos e imágenes", type: "article", durationMin: A, techniques: ["subir-archivos"] },
              {
                slug: "0-1-resumir-documento",
                title: "Sube un documento y pide un resumen de 5 puntos",
                type: "practice",
                durationMin: P,
                techniques: ["subir-archivos"],
                checklist: [
                  "He subido un documento mío.",
                  "He pedido un resumen breve con formato (p. ej. 5 puntos).",
                  "He comprobado que el resumen es fiel a lo que dice el documento.",
                ],
              },
            ],
          },
          {
            title: "Honestidad y límites",
            lessons: [
              { slug: "0-1-lo-que-claude-no-hace-bien", title: "Lo que Claude NO hace bien", type: "article", durationMin: A, techniques: ["verificar-respuestas"] },
              { slug: "0-1-como-verificar", title: "Cómo verificar", type: "article", durationMin: A, techniques: ["verificar-respuestas"] },
              { slug: "0-1-privacidad-y-memoria", title: "Privacidad, buen uso y memoria entre conversaciones", type: "article", durationMin: A },
              {
                slug: "0-1-hito-conversacion-util",
                title: "Hito: una conversación útil de principio a fin",
                type: "milestone",
                durationMin: M,
                checklist: [
                  "He resuelto una tarea real mía de principio a fin con Claude.",
                  "He iterado al menos una vez para mejorar el resultado.",
                  "He usado al menos una herramienta del curso (archivo, formato o búsqueda web) cuando encajaba.",
                  "He verificado algo (un dato o una fuente) en vez de fiarme sin más.",
                  "He anotado qué funcionó y qué haría distinto.",
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "0-2-tu-primera-conversacion-util",
        title: "Tu primera conversación útil",
        summary:
          "Resuelve tareas reales del día a día: escribir, resumir, planificar y mejorar tus resultados.",
        status: "draft",
        modules: [
          {
            title: "Escribir y comunicar",
            lessons: [
              { slug: "0-2-redactar-y-reescribir", title: "Redactar y reescribir", type: "article", durationMin: A },
              { slug: "0-2-notas-a-email", title: "Convierte unas notas en un email claro", type: "practice", durationMin: P },
              { slug: "0-2-resumir-y-explicar", title: "Resumir y explicar", type: "article", durationMin: A },
              { slug: "0-2-resumen-y-preguntas", title: "Resumen + 3 preguntas de un texto largo", type: "practice", durationMin: P },
            ],
          },
          {
            title: "El día a día",
            lessons: [
              { slug: "0-2-planificar-y-organizar", title: "Planificar y organizar", type: "article", durationMin: A },
              { slug: "0-2-plan-semanal", title: "Un plan semanal con su lista de la compra", type: "practice", durationMin: P },
              { slug: "0-2-buscar-en-la-web", title: "Buscar en la web desde el chat", type: "article", durationMin: A, techniques: ["buscar-en-web"] },
              { slug: "0-2-actualidad-con-web", title: "Una pregunta de actualidad con búsqueda web", type: "practice", durationMin: P, techniques: ["buscar-en-web", "verificar-respuestas"] },
            ],
          },
          {
            title: "Mejorar tus resultados",
            lessons: [
              { slug: "0-2-pedir-cambios", title: "Si la respuesta no te sirve, díselo", type: "article", durationMin: A, techniques: ["iterar"] },
              { slug: "0-2-dar-contexto-basico", title: "Dar contexto básico", type: "article", durationMin: A, techniques: ["dar-contexto"] },
              { slug: "0-2-mejorar-en-tres-turnos", title: "Mejora una respuesta floja en tres turnos", type: "practice", durationMin: P, techniques: ["iterar", "dar-contexto"] },
              { slug: "0-2-hito-tarea-real", title: "Hito de salida N0: una tarea tuya real con contexto + iteración", type: "milestone", durationMin: M },
            ],
          },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────────────────────────────────────
  // Nivel 1 — Conversar con criterio (docs/02 §7). 3 cursos, 9 módulos, 24 lecc.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    slug: "conversar-con-criterio",
    name: "Conversar con criterio",
    tagline: "Dar contexto, iterar y pedir lo que de verdad necesitas.",
    descriptionMd:
      "**Hito de salida:** resuelve un encargo de varios pasos con tus documentos, la web y un Proyecto.",
    courses: [
      {
        slug: "1-1-el-arte-de-pedir",
        title: "El arte de pedir",
        summary:
          "Sé claro, da contexto, enseña con ejemplos e itera hasta una respuesta excelente.",
        status: "draft",
        modules: [
          {
            title: "Claridad y contexto",
            lessons: [
              { slug: "1-1-claro-y-directo", title: "Sé claro y directo", type: "article", durationMin: A },
              { slug: "1-1-dar-contexto", title: "Da contexto (rol, audiencia, objetivo)", type: "article", durationMin: A, techniques: ["dar-contexto"] },
              { slug: "1-1-peticion-clara", title: "Reescribe una petición vaga en una clara", type: "practice", durationMin: P, techniques: ["dar-contexto"] },
              { slug: "1-1-pedir-formato", title: "Pide el formato que necesitas", type: "article", durationMin: A, techniques: ["pedir-formato"] },
            ],
          },
          {
            title: "Ejemplos e iteración",
            lessons: [
              { slug: "1-1-few-shot", title: "Enséñale con ejemplos (few-shot)", type: "article", durationMin: A },
              { slug: "1-1-ejemplos-resumen", title: "Dos ejemplos de buen resumen, pide el tercero", type: "practice", durationMin: P },
              { slug: "1-1-iterar-con-criterio", title: "Iterar con criterio", type: "article", durationMin: A, techniques: ["iterar"] },
              { slug: "1-1-quiz-que-falla", title: "¿Qué falla en este prompt?", type: "quiz", durationMin: Q },
            ],
          },
          {
            title: "Pensar en voz alta",
            lessons: [
              { slug: "1-1-cadena-de-pensamiento", title: "Deja que Claude piense paso a paso", type: "article", durationMin: A },
              { slug: "1-1-razonar-antes", title: "Pídele que razone antes de responder", type: "practice", durationMin: P },
              { slug: "1-1-hito-respuesta-excelente", title: "Hito: una respuesta excelente (contexto + ejemplo + iteración)", type: "milestone", durationMin: M, techniques: ["dar-contexto", "iterar"] },
            ],
          },
        ],
      },
      {
        slug: "1-2-trabajar-con-tus-materiales",
        title: "Trabajar con tus materiales",
        summary:
          "Trae tus documentos y datos, usa la web y la Investigación, y monta tu primer Proyecto.",
        status: "draft",
        modules: [
          {
            title: "Documentos y datos",
            lessons: [
              { slug: "1-2-subir-archivos", title: "Subir y trabajar con archivos", type: "article", durationMin: A, techniques: ["subir-archivos"] },
              { slug: "1-2-extraer-de-pdf", title: "Extrae puntos clave + una tabla de un PDF", type: "practice", durationMin: P, techniques: ["subir-archivos", "trabajar-datos"] },
              { slug: "1-2-trabajar-con-datos", title: "Trabajar con datos sencillos", type: "article", durationMin: A, techniques: ["trabajar-datos"] },
            ],
          },
          {
            title: "La web y la actualidad",
            lessons: [
              { slug: "1-2-web-vs-research", title: "Búsqueda web vs. Investigación (Research)", type: "article", durationMin: A, techniques: ["buscar-en-web", "usar-research"] },
              { slug: "1-2-usar-research", title: "Lanza una Investigación y revisa el informe", type: "practice", durationMin: P, techniques: ["usar-research"] },
            ],
          },
          {
            title: "Proyectos",
            lessons: [
              { slug: "1-2-que-es-un-proyecto", title: "Qué es un Proyecto", type: "article", durationMin: A, techniques: ["usar-proyectos"] },
              { slug: "1-2-crear-proyecto", title: "Crea un Proyecto con tus documentos", type: "practice", durationMin: P, techniques: ["usar-proyectos"] },
              { slug: "1-2-hito-proyecto", title: "Hito: monta un Proyecto recurrente", type: "milestone", durationMin: M, techniques: ["usar-proyectos"] },
            ],
          },
        ],
      },
      {
        slug: "1-3-hacer-tuyo-a-claude",
        title: "Hacer tuyo a Claude",
        summary:
          "Personaliza memoria e instrucciones, elige bien el modelo y el modo, y asoma a las herramientas conectadas.",
        status: "draft",
        modules: [
          {
            title: "Personalización",
            lessons: [
              { slug: "1-3-memoria-instrucciones", title: "Memoria e instrucciones personales", type: "article", durationMin: A, techniques: ["personalizar"] },
              { slug: "1-3-configurar-preferencias", title: "Configura tus preferencias", type: "practice", durationMin: P, techniques: ["personalizar"] },
            ],
          },
          {
            title: "Elegir bien",
            lessons: [
              { slug: "1-3-elegir-modelo-y-modo", title: "Elegir modelo y modo", type: "article", durationMin: A, techniques: ["elegir-modelo"] },
              { slug: "1-3-conectar-herramientas", title: "Conectar herramientas (vistazo)", type: "article", durationMin: A },
            ],
          },
          {
            title: "Cierre de nivel",
            lessons: [
              { slug: "1-3-hito-nivel-n1", title: "Hito de nivel N1: un encargo realista", type: "milestone", durationMin: M },
            ],
          },
        ],
      },
    ],
  },
  // ──────────────────────────────────────────────────────────────────────────
  // Niveles 2–5 — a nivel de módulo (docs/02 §8–§11). 1 curso por nivel, sin
  // lecciones (las lecciones llegan cuando se diseñen esos niveles a detalle).
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 2,
    slug: "el-oficio-del-prompt",
    name: "El oficio del prompt",
    tagline: "Estructura, ejemplos y patrones para prompts fiables.",
    descriptionMd:
      "**Hito de salida:** convierte una tarea recurrente en un prompt fiable y reutilizable.",
    courses: [
      {
        slug: "2-1-el-oficio-del-prompt",
        title: "El oficio del prompt",
        summary:
          "Prompting como oficio: estructura y claridad, ejemplos y razonamiento, encadenar y controlar, y fiabilidad.",
        status: "draft",
        modules: [
          { title: "Estructura y claridad" },
          { title: "Ejemplos y razonamiento" },
          { title: "Encadenar y controlar" },
          { title: "Contexto largo y fiabilidad" },
        ],
      },
    ],
  },
  {
    id: 3,
    slug: "claude-que-actua",
    name: "Claude que actúa",
    tagline: "Proyectos, archivos, artefactos y herramientas conectadas.",
    descriptionMd:
      "**Hito de salida:** automatiza un flujo real con un Proyecto, un conector o una Skill y un artefacto.",
    courses: [
      {
        slug: "3-1-claude-que-actua",
        title: "Claude que actúa",
        summary:
          "Más allá del chat: Proyectos y artefactos, conectores y MCP, Skills, e Investigación y automatización ligera.",
        status: "draft",
        modules: [
          { title: "Proyectos y artefactos" },
          { title: "Conectar Claude a tus herramientas" },
          { title: "Habilidades (Skills)" },
          { title: "Investigación y automatización ligera" },
        ],
      },
    ],
  },
  {
    id: 4,
    slug: "construir-con-la-api",
    name: "Construir con la API",
    tagline: "Mensajes, streaming y uso de herramientas desde la API.",
    descriptionMd:
      "**Hito de salida:** construye una pequeña app con la API (entrada → llamada → salida) con tool use.",
    courses: [
      {
        slug: "4-1-construir-con-la-api",
        title: "Construir con la API",
        summary:
          "Programar con Claude: primeros pasos con la API, los Mensajes a fondo, tool use, y calidad, coste y fiabilidad.",
        status: "draft",
        modules: [
          { title: "Primeros pasos con la API" },
          { title: "Mensajes a fondo" },
          { title: "Herramientas (tool use)" },
          { title: "Calidad, coste y fiabilidad" },
        ],
      },
    ],
  },
  {
    id: 5,
    slug: "sistemas-agenticos",
    name: "Sistemas agénticos en producción",
    tagline: "Agentes, MCP, orquestación y despliegue real.",
    descriptionMd:
      "**Hito de salida:** lleva un agente de extremo a extremo a un entorno real, con evals y plan de operación.",
    courses: [
      {
        slug: "5-1-sistemas-agenticos-en-produccion",
        title: "Sistemas agénticos en producción",
        summary:
          "Llevar agentes a producción: diseño de agentes, el Agent SDK, MCP a fondo, Managed Agents, y evaluar, observar y operar.",
        status: "draft",
        modules: [
          { title: "Diseñar un agente" },
          { title: "El Claude Agent SDK" },
          { title: "MCP a fondo" },
          { title: "Agentes gestionados (Managed Agents)" },
          { title: "Evaluar, observar y operar" },
        ],
      },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Catálogo de habilidades (docs/02 §12) — seed de la tabla `techniques`.
//
// Las categorías son las de docs/02 (conversation|prompting|tools|api|agents|
// theory), ya alineadas con el enum `technique_category` tras el renombrado no
// destructivo de CS-T5 (ALTER TYPE … RENAME VALUE). Ya no hay puente: la
// categoría de cada técnica se siembra tal cual.
// ────────────────────────────────────────────────────────────────────────────
export interface SeedTechnique {
  slug: string;
  name: string;
  category: "conversation" | "prompting" | "tools" | "api" | "agents" | "theory";
  levelNumber: number;
}

type SkillCategory =
  | "conversation"
  | "prompting"
  | "tools"
  | "api"
  | "agents"
  | "theory";

interface SeedSkill {
  slug: string;
  name: string;
  category: SkillCategory;
  levelNumber: number;
}

const skills: SeedSkill[] = [
  { slug: "dar-contexto", name: "Dar contexto", category: "conversation", levelNumber: 0 },
  { slug: "subir-archivos", name: "Subir archivos e imágenes", category: "conversation", levelNumber: 0 },
  { slug: "iterar", name: "Iterar y pedir cambios", category: "conversation", levelNumber: 1 },
  { slug: "pedir-formato", name: "Pedir el formato de salida", category: "conversation", levelNumber: 1 },
  { slug: "buscar-en-web", name: "Usar la búsqueda web", category: "conversation", levelNumber: 1 },
  { slug: "usar-research", name: "Usar Investigación (Research)", category: "conversation", levelNumber: 1 },
  { slug: "trabajar-datos", name: "Trabajar con datos y archivos de vuelta", category: "conversation", levelNumber: 1 },
  { slug: "usar-proyectos", name: "Usar Proyectos", category: "tools", levelNumber: 1 },
  { slug: "personalizar", name: "Memoria e instrucciones personales", category: "conversation", levelNumber: 1 },
  { slug: "elegir-modelo", name: "Elegir modelo y modo", category: "conversation", levelNumber: 1 },
  { slug: "verificar-respuestas", name: "Verificar respuestas", category: "theory", levelNumber: 1 },
  { slug: "ser-claro-directo", name: "Ser claro y directo", category: "prompting", levelNumber: 2 },
  { slug: "few-shot", name: "Ejemplos (few-shot/multishot)", category: "prompting", levelNumber: 2 },
  { slug: "cadena-de-pensamiento", name: "Cadena de pensamiento", category: "prompting", levelNumber: 2 },
  { slug: "xml-tags", name: "Estructurar con etiquetas XML", category: "prompting", levelNumber: 2 },
  { slug: "system-prompts", name: "Roles y system prompts", category: "prompting", levelNumber: 2 },
  { slug: "plantillas-prompt", name: "Plantillas y variables de prompt", category: "prompting", levelNumber: 2 },
  { slug: "encadenar-prompts", name: "Encadenar prompts", category: "prompting", levelNumber: 2 },
  { slug: "contexto-largo", name: "Manejar contexto largo", category: "prompting", levelNumber: 2 },
  { slug: "reducir-alucinaciones", name: "Reducir alucinaciones", category: "theory", levelNumber: 2 },
  { slug: "artefactos", name: "Crear artefactos (apps sin código)", category: "tools", levelNumber: 3 },
  { slug: "conectores-mcp", name: "Conectores y MCP en la app", category: "tools", levelNumber: 3 },
  { slug: "skills-en-claude", name: "Habilidades (Skills) en Claude", category: "tools", levelNumber: 3 },
  { slug: "claude-code", name: "Claude Code (primeros pasos)", category: "tools", levelNumber: 3 },
  { slug: "consola-api", name: "Consola y claves de API", category: "api", levelNumber: 4 },
  { slug: "mensajes-api", name: "La API de Mensajes", category: "api", levelNumber: 4 },
  { slug: "streaming", name: "Streaming de respuestas", category: "api", levelNumber: 4 },
  { slug: "vision-pdf", name: "Visión y PDFs por API", category: "api", levelNumber: 4 },
  { slug: "tool-use", name: "Tool use (herramientas)", category: "api", levelNumber: 4 },
  { slug: "salidas-estructuradas", name: "Salidas estructuradas", category: "api", levelNumber: 4 },
  { slug: "pensamiento-effort", name: "Pensamiento adaptativo y effort", category: "api", levelNumber: 4 },
  { slug: "prompt-caching", name: "Prompt caching", category: "api", levelNumber: 4 },
  { slug: "batches", name: "Procesamiento por lotes", category: "api", levelNumber: 4 },
  { slug: "conteo-tokens", name: "Conteo de tokens", category: "api", levelNumber: 4 },
  { slug: "diseno-agentes", name: "Diseño de agentes", category: "agents", levelNumber: 5 },
  { slug: "agent-sdk", name: "Claude Agent SDK", category: "agents", levelNumber: 5 },
  { slug: "construir-mcp", name: "Construir servidores MCP", category: "agents", levelNumber: 5 },
  { slug: "managed-agents", name: "Managed Agents", category: "agents", levelNumber: 5 },
  { slug: "contexto-agentes", name: "Gestión de contexto en agentes", category: "agents", levelNumber: 5 },
  { slug: "diseno-evals", name: "Diseño de evals", category: "agents", levelNumber: 5 },
  { slug: "observabilidad", name: "Observabilidad y operación", category: "agents", levelNumber: 5 },
];

export const techniquesSeed: SeedTechnique[] = skills.map((s) => ({
  slug: s.slug,
  name: s.name,
  category: s.category,
  levelNumber: s.levelNumber,
}));

// Quizzes del seed. VACÍO en CS-T3: las preguntas son contenido y llegan con los
// cuerpos en CS-T4 (las lecciones type=quiz ya existen, sin preguntas todavía).
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

export const quizzesSeed: SeedQuiz[] = [
  {
    lessonSlug: "0-1-repaso-que-es-claude",
    passPct: 80,
    questions: [
      {
        prompt: "¿Qué es Claude, en esencia?",
        kind: "single",
        explanation:
          "Claude es un modelo de lenguaje: genera la respuesta que mejor encaja con tu petición. No es un buscador ni una base de datos de hechos.",
        options: [
          { text: "Un asistente de IA (modelo de lenguaje) que genera texto", isCorrect: true },
          { text: "Un buscador de internet", isCorrect: false },
          { text: "Una base de datos de hechos verificados", isCorrect: false },
          { text: "Una persona que responde por chat", isCorrect: false },
        ],
      },
      {
        prompt: "Claude siempre da información correcta.",
        kind: "truefalse",
        explanation:
          "No: puede 'alucinar', es decir, inventar datos con tono seguro. Por eso conviene verificar lo importante.",
        options: [
          { text: "Falso", isCorrect: true },
          { text: "Verdadero", isCorrect: false },
        ],
      },
      {
        prompt: "Necesitas saber algo que pasó ayer. ¿Qué es verdad?",
        kind: "single",
        explanation:
          "El conocimiento de Claude tiene una fecha de corte; para lo reciente necesita buscar en la web (lo verás más adelante).",
        options: [
          { text: "Por defecto Claude no lo sabe; necesita buscar en la web", isCorrect: true },
          { text: "Claude siempre conoce las noticias del día", isCorrect: false },
          { text: "Claude nunca puede acceder a información reciente", isCorrect: false },
          { text: "Hay que pagar para que responda cualquier cosa", isCorrect: false },
        ],
      },
      {
        prompt: "Para una pregunta sencilla y rápida, ¿qué familia de modelos encaja mejor?",
        kind: "single",
        explanation:
          "Hay familias rápidas, equilibradas y muy capaces. Para lo sencillo, una rápida responde antes; reserva las más capaces para lo difícil.",
        options: [
          { text: "Una ligera y rápida (tipo Haiku)", isCorrect: true },
          { text: "Siempre la más potente disponible", isCorrect: false },
          { text: "Da igual: solo existe un modelo de Claude", isCorrect: false },
          { text: "Ninguna: las preguntas sencillas no se pueden responder", isCorrect: false },
        ],
      },
      {
        prompt: "Puedes empezar a usar Claude gratis.",
        kind: "truefalse",
        explanation:
          "Sí: el plan gratis cubre de sobra todo el Nivel 0 (chat, escritura, resúmenes, búsqueda web y archivos).",
        options: [
          { text: "Verdadero", isCorrect: true },
          { text: "Falso", isCorrect: false },
        ],
      },
    ],
  },
];

// Logros base genéricos (independientes del temario). Se conservan para que la
// vitrina y la mecánica de XP/rachas funcionen desde el primer día.
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

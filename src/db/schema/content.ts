import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const contentStatus = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

export const lessonType = pgEnum("lesson_type", [
  "article",
  "video",
  "practice",
  "quiz",
  "milestone",
]);

export const videoProvider = pgEnum("video_provider", [
  "youtube",
  "vimeo",
  "file",
]);

export const techniqueCategory = pgEnum("technique_category", [
  "cards",
  "coins",
  "mentalism",
  "classics",
  "stage",
  "theory",
]);

export const resourceKind = pgEnum("resource_kind", [
  "pdf",
  "image",
  "link",
  "file",
]);

// 0..5, ids fijados por el seed (sin default a propósito).
export const levels = pgTable("levels", {
  id: smallint("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  descriptionMd: text("description_md"),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    levelId: smallint("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    descriptionMd: text("description_md"),
    coverUrl: text("cover_url"),
    orderInLevel: integer("order_in_level").notNull(),
    estHours: numeric("est_hours", { precision: 4, scale: 1 }),
    isRequired: boolean("is_required").default(true).notNull(),
    status: contentStatus("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("courses_level_order_unique").on(t.levelId, t.orderInLevel)],
);

export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    order: integer("order").notNull(),
  },
  (t) => [unique("modules_course_order_unique").on(t.courseId, t.order)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    type: lessonType("type").notNull(),
    contentMd: text("content_md"),
    videoUrl: text("video_url"),
    // Derivado de la URL al guardar (lib/video.ts, F2).
    videoProvider: videoProvider("video_provider"),
    durationMin: integer("duration_min"),
    order: integer("order").notNull(),
    // Si null, XP por tipo de lección (lib/xp.ts, F2).
    xpOverride: integer("xp_override"),
    status: contentStatus("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("lessons_module_order_unique").on(t.moduleId, t.order)],
);

// En lecciones 'milestone' actúa como rúbrica.
export const lessonChecklistItems = pgTable("lesson_checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  order: integer("order").notNull(),
});

export const lessonResources = pgTable("lesson_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  kind: resourceKind("kind").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  order: integer("order").notNull(),
});

export const techniques = pgTable("techniques", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: techniqueCategory("category").notNull(),
  levelNumber: smallint("level_number")
    .notNull()
    .references(() => levels.id, { onDelete: "restrict" }),
  descriptionMd: text("description_md"),
});

export const lessonTechniques = pgTable(
  "lesson_techniques",
  {
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    techniqueId: uuid("technique_id")
      .notNull()
      .references(() => techniques.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({
      name: "lesson_techniques_pk",
      columns: [t.lessonId, t.techniqueId],
    }),
  ],
);

export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Solo lecciones type=quiz (regla aplicada en código, docs/05).
  lessonId: uuid("lesson_id")
    .notNull()
    .unique()
    .references(() => lessons.id, { onDelete: "cascade" }),
  passPct: integer("pass_pct").default(80).notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  prompt: text("prompt").notNull(),
  explanation: text("explanation"),
  // 'single' | 'truefalse'
  kind: text("kind").default("single").notNull(),
});

export const quizOptions = pgTable("quiz_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quizQuestions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  order: integer("order").notNull(),
});

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    path: text("path").notNull().unique(),
    mime: text("mime").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("uploads_created_by_idx").on(t.createdBy)],
);

export const levelsRelations = relations(levels, ({ many }) => ({
  courses: many(courses),
  techniques: many(techniques),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  level: one(levels, {
    fields: [courses.levelId],
    references: [levels.id],
  }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  checklistItems: many(lessonChecklistItems),
  resources: many(lessonResources),
  lessonTechniques: many(lessonTechniques),
  quiz: one(quizzes),
}));

export const lessonChecklistItemsRelations = relations(
  lessonChecklistItems,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonChecklistItems.lessonId],
      references: [lessons.id],
    }),
  }),
);

export const lessonResourcesRelations = relations(
  lessonResources,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonResources.lessonId],
      references: [lessons.id],
    }),
  }),
);

export const techniquesRelations = relations(techniques, ({ one, many }) => ({
  level: one(levels, {
    fields: [techniques.levelNumber],
    references: [levels.id],
  }),
  lessonTechniques: many(lessonTechniques),
}));

export const lessonTechniquesRelations = relations(
  lessonTechniques,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonTechniques.lessonId],
      references: [lessons.id],
    }),
    technique: one(techniques, {
      fields: [lessonTechniques.techniqueId],
      references: [techniques.id],
    }),
  }),
);

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(quizQuestions),
}));

export const quizQuestionsRelations = relations(
  quizQuestions,
  ({ one, many }) => ({
    quiz: one(quizzes, {
      fields: [quizQuestions.quizId],
      references: [quizzes.id],
    }),
    options: many(quizOptions),
  }),
);

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
  question: one(quizQuestions, {
    fields: [quizOptions.questionId],
    references: [quizQuestions.id],
  }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  createdBy: one(user, {
    fields: [uploads.createdBy],
    references: [user.id],
  }),
}));

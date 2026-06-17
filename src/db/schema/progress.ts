import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { lessonChecklistItems, lessons, quizzes } from "./content";

export const progressStatus = pgEnum("progress_status", [
  "started",
  "completed",
]);

// Progreso de curso/nivel = calculado sobre lecciones published
// (no hay tabla enrollments), docs/05.
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "restrict" }),
    status: progressStatus("status").default("started").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ name: "lesson_progress_pk", columns: [t.userId, t.lessonId] }),
    index("lesson_progress_user_status_idx").on(t.userId, t.status),
  ],
);

export const checklistProgress = pgTable(
  "checklist_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => lessonChecklistItems.id, { onDelete: "restrict" }),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "checklist_progress_pk",
      columns: [t.userId, t.itemId],
    }),
  ],
);

export const notes = pgTable(
  "notes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "restrict" }),
    contentMd: text("content_md").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [primaryKey({ name: "notes_pk", columns: [t.userId, t.lessonId] })],
);

export const milestoneSubmissions = pgTable("milestone_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Solo lecciones type=milestone (regla aplicada en código, docs/05).
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "restrict" }),
  // { item_id: 1..5 } sobre los checklist_items de la lección.
  ratings: jsonb("ratings").notNull(),
  reflection: text("reflection"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "restrict" }),
    scorePct: integer("score_pct").notNull(),
    passed: boolean("passed").notNull(),
    answers: jsonb("answers").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("quiz_attempts_user_quiz_idx").on(t.userId, t.quizId)],
);

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(user, {
    fields: [lessonProgress.userId],
    references: [user.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const checklistProgressRelations = relations(
  checklistProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [checklistProgress.userId],
      references: [user.id],
    }),
    item: one(lessonChecklistItems, {
      fields: [checklistProgress.itemId],
      references: [lessonChecklistItems.id],
    }),
  }),
);

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  lesson: one(lessons, {
    fields: [notes.lessonId],
    references: [lessons.id],
  }),
}));

export const milestoneSubmissionsRelations = relations(
  milestoneSubmissions,
  ({ one }) => ({
    user: one(user, {
      fields: [milestoneSubmissions.userId],
      references: [user.id],
    }),
    lesson: one(lessons, {
      fields: [milestoneSubmissions.lessonId],
      references: [lessons.id],
    }),
  }),
);

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(user, {
    fields: [quizAttempts.userId],
    references: [user.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

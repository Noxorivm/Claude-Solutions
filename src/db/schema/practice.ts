import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { lessons, techniques } from "./content";

export const practiceSessions = pgTable(
  "practice_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    techniqueId: uuid("technique_id").references(() => techniques.id, {
      onDelete: "restrict",
    }),
    lessonId: uuid("lesson_id").references(() => lessons.id, {
      onDelete: "restrict",
    }),
    durationSec: integer("duration_sec").notNull(),
    selfRating: smallint("self_rating"),
    notes: text("notes"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("practice_sessions_user_performed_idx").on(
      t.userId,
      t.performedAt.desc(),
    ),
    check("practice_sessions_duration_check", sql`${t.durationSec} >= 60`),
    check(
      "practice_sessions_self_rating_check",
      sql`${t.selfRating} between 1 and 5`,
    ),
    check(
      "practice_sessions_target_check",
      sql`${t.techniqueId} is not null or ${t.lessonId} is not null`,
    ),
  ],
);

// Estado de dominio + repaso espaciado (lib/spaced-repetition.ts, F4).
export const userTechniques = pgTable(
  "user_techniques",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    techniqueId: uuid("technique_id")
      .notNull()
      .references(() => techniques.id, { onDelete: "restrict" }),
    mastery: smallint("mastery").default(0).notNull(),
    lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    // Progresión 1,3,7,14,30,60.
    intervalDays: integer("interval_days").default(1).notNull(),
  },
  (t) => [
    primaryKey({
      name: "user_techniques_pk",
      columns: [t.userId, t.techniqueId],
    }),
    index("user_techniques_user_review_idx").on(t.userId, t.nextReviewAt),
    check("user_techniques_mastery_check", sql`${t.mastery} between 0 and 5`),
  ],
);

export const practiceSessionsRelations = relations(
  practiceSessions,
  ({ one }) => ({
    user: one(user, {
      fields: [practiceSessions.userId],
      references: [user.id],
    }),
    technique: one(techniques, {
      fields: [practiceSessions.techniqueId],
      references: [techniques.id],
    }),
    lesson: one(lessons, {
      fields: [practiceSessions.lessonId],
      references: [lessons.id],
    }),
  }),
);

export const userTechniquesRelations = relations(userTechniques, ({ one }) => ({
  user: one(user, {
    fields: [userTechniques.userId],
    references: [user.id],
  }),
  technique: one(techniques, {
    fields: [userTechniques.techniqueId],
    references: [techniques.id],
  }),
}));

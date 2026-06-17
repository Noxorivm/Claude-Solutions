import { relations } from "drizzle-orm";
import {
  date,
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
import { lessons } from "./content";

export const xpReason = pgEnum("xp_reason", [
  "lesson",
  "quiz",
  "milestone",
  "practice",
  "achievement",
  "adjust",
]);

// Log inmutable; user.xp = SUM(amount), docs/05.
export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: xpReason("reason").notNull(),
    lessonId: uuid("lesson_id").references(() => lessons.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("xp_events_user_created_idx").on(t.userId, t.createdAt)],
);

// Agregado diario (zona Europe/Madrid) para racha y heatmap.
export const activityDays = pgTable(
  "activity_days",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    lessonsCompleted: integer("lessons_completed").default(0).notNull(),
    practiceSec: integer("practice_sec").default(0).notNull(),
    xp: integer("xp").default(0).notNull(),
  },
  (t) => [primaryKey({ name: "activity_days_pk", columns: [t.userId, t.day] })],
);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  // p.ej. {"type":"streak","days":7} (motor de criterios en F4).
  criteria: jsonb("criteria").notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "restrict" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "user_achievements_pk",
      columns: [t.userId, t.achievementId],
    }),
  ],
);

export const xpEventsRelations = relations(xpEvents, ({ one }) => ({
  user: one(user, {
    fields: [xpEvents.userId],
    references: [user.id],
  }),
  lesson: one(lessons, {
    fields: [xpEvents.lessonId],
    references: [lessons.id],
  }),
}));

export const activityDaysRelations = relations(activityDays, ({ one }) => ({
  user: one(user, {
    fields: [activityDays.userId],
    references: [user.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(user, {
      fields: [userAchievements.userId],
      references: [user.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

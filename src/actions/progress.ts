"use server";

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  activityDays,
  checklistProgress,
  courses,
  lessonChecklistItems,
  lessonProgress,
  lessons,
  milestoneSubmissions,
  modules,
  notes,
  practiceSessions,
  quizAttempts,
  quizzes,
  user,
  xpEvents,
} from "@/db/schema";
import { checkAndGrantAchievements } from "@/actions/achievements";
import type { AchievementGrant } from "@/lib/achievements";
import { requireUser } from "@/lib/guards";
import { toMadridDay } from "@/lib/streak";
import { strings } from "@/lib/strings";
import { xpForLessonType } from "@/lib/xp";

const t = strings.lesson;

const slugSchema = z.string().min(1).max(200);
const uuidSchema = z.string().uuid();
const noteSchema = z.object({
  lessonSlug: slugSchema,
  content: z.string().max(20000),
});

export type ProgressActionResult =
  | { ok: true; xpAwarded: number; newAchievements: AchievementGrant[] }
  | { ok: false; error: string };

type CompleteTxResult =
  | { ok: true; xpAwarded: number }
  | { ok: false; error: string };

// Evaluación de logros POST-transacción: si falla, se loguea y la
// action sigue adelante — un error aquí no puede revertir el progreso.
async function grantsAfter(userId: string): Promise<AchievementGrant[]> {
  try {
    return await checkAndGrantAchievements(userId);
  } catch (error) {
    console.error("[achievements] evaluación fallida", error);
    return [];
  }
}

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

interface PublishedLesson {
  id: string;
  type: "article" | "video" | "practice" | "quiz" | "milestone";
  xpOverride: number | null;
  courseSlug: string;
}

async function findPublishedLesson(
  slug: string,
): Promise<PublishedLesson | null> {
  const rows = await db
    .select({
      id: lessons.id,
      type: lessons.type,
      xpOverride: lessons.xpOverride,
      courseSlug: courses.slug,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(
      and(
        eq(lessons.slug, slug),
        eq(lessons.status, "published"),
        eq(courses.status, "published"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

function revalidateLessonPaths(lessonSlug: string, courseSlug: string): void {
  revalidatePath(`/app/leccion/${lessonSlug}`);
  revalidatePath(`/app/cursos/${courseSlug}`);
  revalidatePath("/app/ruta");
  revalidatePath("/app");
}

// Completar lección (docs/05 §Reglas de integridad 1): gates por tipo y
// UNA transacción para progreso + xp_events + user.xp + activity_days.
// XP idempotente: solo se otorga si no existe ya un xp_event de esa
// lección (completar→desmarcar→completar no farmea XP, docs/03 regla 5).
export async function completeLesson(
  input: unknown,
): Promise<ProgressActionResult> {
  const session = await requireUser();
  const parsed = slugSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const lesson = await findPublishedLesson(parsed.data);
  if (!lesson) {
    return { ok: false, error: t.notFound };
  }
  const userId = session.user.id;

  const result = await db.transaction(async (tx): Promise<CompleteTxResult> => {
    if (lesson.type === "practice") {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(lessonChecklistItems)
        .where(eq(lessonChecklistItems.lessonId, lesson.id));
      if (total > 0) {
        const [{ checked }] = await tx
          .select({ checked: count() })
          .from(checklistProgress)
          .innerJoin(
            lessonChecklistItems,
            eq(checklistProgress.itemId, lessonChecklistItems.id),
          )
          .where(
            and(
              eq(checklistProgress.userId, userId),
              eq(lessonChecklistItems.lessonId, lesson.id),
            ),
          );
        if (checked < total) {
          return { ok: false, error: t.gatePracticeChecklist };
        }
      }
      const [{ sessions }] = await tx
        .select({ sessions: count() })
        .from(practiceSessions)
        .where(
          and(
            eq(practiceSessions.userId, userId),
            eq(practiceSessions.lessonId, lesson.id),
          ),
        );
      if (sessions === 0) {
        return { ok: false, error: t.gatePracticeSession };
      }
    }

    if (lesson.type === "quiz") {
      const quizRows = await tx
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.lessonId, lesson.id))
        .limit(1);
      const quizId = quizRows[0]?.id;
      if (!quizId) {
        return { ok: false, error: t.gateQuiz };
      }
      const [{ passed }] = await tx
        .select({ passed: count() })
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            eq(quizAttempts.quizId, quizId),
            eq(quizAttempts.passed, true),
          ),
        );
      if (passed === 0) {
        return { ok: false, error: t.gateQuiz };
      }
    }

    if (lesson.type === "milestone") {
      const [{ submissions }] = await tx
        .select({ submissions: count() })
        .from(milestoneSubmissions)
        .where(
          and(
            eq(milestoneSubmissions.userId, userId),
            eq(milestoneSubmissions.lessonId, lesson.id),
          ),
        );
      if (submissions === 0) {
        return { ok: false, error: t.gateMilestone };
      }
    }

    const now = new Date();
    await tx
      .insert(lessonProgress)
      .values({
        userId,
        lessonId: lesson.id,
        status: "completed",
        completedAt: now,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { status: "completed", completedAt: now },
      });

    const existingXp = await tx
      .select({ id: xpEvents.id })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.userId, userId),
          eq(xpEvents.lessonId, lesson.id),
          inArray(xpEvents.reason, ["lesson", "quiz", "milestone"]),
        ),
      )
      .limit(1);

    let xpAwarded = 0;
    if (existingXp.length === 0) {
      const amount = xpForLessonType(lesson.type, lesson.xpOverride);
      const reason =
        lesson.type === "quiz"
          ? ("quiz" as const)
          : lesson.type === "milestone"
            ? ("milestone" as const)
            : ("lesson" as const);
      await tx.insert(xpEvents).values({
        userId,
        amount,
        reason,
        lessonId: lesson.id,
      });
      await tx
        .update(user)
        .set({ xp: sql`${user.xp} + ${amount}` })
        .where(eq(user.id, userId));
      const day = toMadridDay(now);
      await tx
        .insert(activityDays)
        .values({ userId, day, lessonsCompleted: 1, xp: amount })
        .onConflictDoUpdate({
          target: [activityDays.userId, activityDays.day],
          set: {
            lessonsCompleted: sql`${activityDays.lessonsCompleted} + 1`,
            xp: sql`${activityDays.xp} + ${amount}`,
          },
        });
      xpAwarded = amount;
    }

    return { ok: true, xpAwarded };
  });

  if (!result.ok) {
    return result;
  }
  const newAchievements = await grantsAfter(userId);
  revalidateLessonPaths(parsed.data, lesson.courseSlug);
  return { ...result, newAchievements };
}

// Desmarcar (docs/05 regla 3): revierte el progreso pero NO toca
// xp_events, user.xp ni activity_days (el log queda, sin XP negativo).
export async function uncompleteLesson(
  input: unknown,
): Promise<SimpleActionResult> {
  const session = await requireUser();
  const parsed = slugSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const lesson = await findPublishedLesson(parsed.data);
  if (!lesson) {
    return { ok: false, error: t.notFound };
  }

  await db
    .update(lessonProgress)
    .set({ status: "started", completedAt: null })
    .where(
      and(
        eq(lessonProgress.userId, session.user.id),
        eq(lessonProgress.lessonId, lesson.id),
      ),
    );

  revalidateLessonPaths(parsed.data, lesson.courseSlug);
  return { ok: true };
}

export type ToggleChecklistResult =
  | { ok: true; checked: boolean }
  | { ok: false; error: string };

export async function toggleChecklistItem(
  input: unknown,
): Promise<ToggleChecklistResult> {
  const session = await requireUser();
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const itemId = parsed.data;
  const userId = session.user.id;

  const existing = await db
    .select({ itemId: checklistProgress.itemId })
    .from(checklistProgress)
    .where(
      and(
        eq(checklistProgress.userId, userId),
        eq(checklistProgress.itemId, itemId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(checklistProgress)
      .where(
        and(
          eq(checklistProgress.userId, userId),
          eq(checklistProgress.itemId, itemId),
        ),
      );
    return { ok: true, checked: false };
  }

  await db
    .insert(checklistProgress)
    .values({ userId, itemId, checkedAt: new Date() })
    .onConflictDoNothing();
  return { ok: true, checked: true };
}

export async function saveNote(input: unknown): Promise<SimpleActionResult> {
  const session = await requireUser();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const lesson = await findPublishedLesson(parsed.data.lessonSlug);
  if (!lesson) {
    return { ok: false, error: t.notFound };
  }

  await db
    .insert(notes)
    .values({
      userId: session.user.id,
      lessonId: lesson.id,
      contentMd: parsed.data.content,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [notes.userId, notes.lessonId],
      set: { contentMd: parsed.data.content, updatedAt: new Date() },
    });

  return { ok: true };
}

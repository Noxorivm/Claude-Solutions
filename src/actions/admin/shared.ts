// Helpers compartidos por las actions del admin (SIN "use server": esto
// no se invoca desde el cliente, solo desde las propias actions).
import { eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";

import { db } from "@/db";
import {
  checklistProgress,
  lessonChecklistItems,
  lessonProgress,
  lessons,
  milestoneSubmissions,
  modules,
  notes,
  practiceSessions,
  quizAttempts,
  quizzes,
} from "@/db/schema";
import { strings } from "@/lib/strings";

export type FieldErrors = Record<string, string>;

export type AdminMutationResult =
  | { ok: true; slug?: string }
  | { ok: false; error?: string; fieldErrors?: FieldErrors };

export type AdminDeleteResult =
  | { ok: true }
  | { ok: false; reason: "has_progress" }
  | { ok: false; error: string };

export function flattenErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

interface PgErrorLike {
  code?: string;
  constraint_name?: string;
  cause?: unknown;
}

/** Traduce violaciones de UNIQUE a errores legibles. Drizzle envuelve el
 *  PostgresError en DrizzleQueryError, así que hay que mirar en `cause`.
 *  `messages` mapea substrings del nombre de la constraint → mensaje. */
export function uniqueViolationMessage(
  error: unknown,
  messages: Record<string, string>,
): string | null {
  let pgError = error as PgErrorLike | undefined;
  for (
    let depth = 0;
    pgError && pgError.code !== "23505" && depth < 5;
    depth++
  ) {
    pgError = pgError.cause as PgErrorLike | undefined;
  }
  if (pgError?.code !== "23505") {
    return null;
  }
  const constraint = pgError.constraint_name ?? "";
  for (const [needle, message] of Object.entries(messages)) {
    if (constraint.includes(needle)) {
      return message;
    }
  }
  return strings.common.genericError;
}

export async function lessonIdsOfCourse(courseId: string): Promise<string[]> {
  const rows = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId));
  return rows.map((row) => row.id);
}

export async function lessonIdsOfModule(moduleId: string): Promise<string[]> {
  const rows = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId));
  return rows.map((row) => row.id);
}

/** REGLA de borrado protegido (docs/03 §H1): cualquier rastro de
 *  progreso de alumnos bloquea el hard delete. */
export async function lessonsHaveProgress(
  lessonIds: string[],
): Promise<boolean> {
  if (lessonIds.length === 0) {
    return false;
  }
  const checks = await Promise.all([
    db
      .select({ one: sql`1` })
      .from(lessonProgress)
      .where(inArray(lessonProgress.lessonId, lessonIds))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(checklistProgress)
      .innerJoin(
        lessonChecklistItems,
        eq(checklistProgress.itemId, lessonChecklistItems.id),
      )
      .where(inArray(lessonChecklistItems.lessonId, lessonIds))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(notes)
      .where(inArray(notes.lessonId, lessonIds))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(inArray(quizzes.lessonId, lessonIds))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(milestoneSubmissions)
      .where(inArray(milestoneSubmissions.lessonId, lessonIds))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(practiceSessions)
      .where(inArray(practiceSessions.lessonId, lessonIds))
      .limit(1),
  ]);
  return checks.some((rows) => rows.length > 0);
}

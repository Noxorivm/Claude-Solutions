"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { techniques, userTechniques } from "@/db/schema";
import { requireUser } from "@/lib/guards";
import { scheduleFromMastery } from "@/lib/spaced-repetition";
import { strings } from "@/lib/strings";

const inputSchema = z.object({
  techniqueSlug: z.string().min(1).max(200),
  mastery: z.number().int().min(0).max(5),
});

export type UpdateMasteryResult =
  | { ok: true; nextReviewAt: string | null }
  | { ok: false; error: string };

// Editar el dominio recalcula el repaso (docs/03 §E3) con el mapping de
// lib/spaced-repetition. last_practiced_at no se toca aquí; la práctica
// no toca mastery/repaso (F3-T1): cada action escribe solo lo suyo.
export async function updateTechniqueMastery(
  input: unknown,
): Promise<UpdateMasteryResult> {
  const session = await requireUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }

  const rows = await db
    .select({ id: techniques.id })
    .from(techniques)
    .where(eq(techniques.slug, parsed.data.techniqueSlug))
    .limit(1);
  const technique = rows[0];
  if (!technique) {
    return { ok: false, error: strings.common.genericError };
  }

  const schedule = scheduleFromMastery(parsed.data.mastery, new Date());

  await db.transaction(async (tx) => {
    await tx
      .insert(userTechniques)
      .values({
        userId: session.user.id,
        techniqueId: technique.id,
        mastery: parsed.data.mastery,
        intervalDays: schedule.intervalDays,
        nextReviewAt: schedule.nextReviewAt,
      })
      .onConflictDoUpdate({
        target: [userTechniques.userId, userTechniques.techniqueId],
        set: {
          mastery: parsed.data.mastery,
          intervalDays: schedule.intervalDays,
          nextReviewAt: schedule.nextReviewAt,
        },
      });
  });

  revalidatePath("/app/tecnicas");
  revalidatePath(`/app/tecnicas/${parsed.data.techniqueSlug}`);
  return {
    ok: true,
    nextReviewAt: schedule.nextReviewAt?.toISOString() ?? null,
  };
}

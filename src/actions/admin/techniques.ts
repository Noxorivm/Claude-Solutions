"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  flattenErrors,
  uniqueViolationMessage,
  type AdminMutationResult,
} from "@/actions/admin/shared";
import { db } from "@/db";
import { practiceSessions, techniques, userTechniques } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";
import { techniqueSchema } from "@/lib/validators/content";

const t = strings.admin;

const TECHNIQUE_UNIQUE_MESSAGES = {
  slug: t.techniqueSlugTaken,
};

export type TechniqueDeleteResult =
  | { ok: true }
  | { ok: false; reason: "in_use" }
  | { ok: false; error: string };

function revalidateTechniques(slug?: string): void {
  revalidatePath("/admin/tecnicas");
  if (slug) {
    revalidatePath(`/admin/tecnicas/${slug}`);
  }
  // Listado y fichas del alumno (incluye lecciones vinculadas).
  revalidatePath("/app/tecnicas", "layout");
  revalidatePath("/app/practica");
  revalidatePath("/app");
}

export async function createTechnique(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = techniqueSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }

  try {
    await db.insert(techniques).values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      category: parsed.data.category,
      levelNumber: parsed.data.levelNumber,
      descriptionMd: parsed.data.descriptionMd?.trim() || null,
    });
  } catch (error) {
    const message = uniqueViolationMessage(error, TECHNIQUE_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateTechniques(parsed.data.slug);
  return { ok: true, slug: parsed.data.slug };
}

const updateTechniqueSchema = techniqueSchema.extend({ id: z.string().uuid() });

export async function updateTechnique(
  input: unknown,
): Promise<AdminMutationResult> {
  await requireAdmin();
  const parsed = updateTechniqueSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const existing = await db
    .select({ slug: techniques.slug })
    .from(techniques)
    .where(eq(techniques.id, parsed.data.id))
    .limit(1);
  if (!existing[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  try {
    await db
      .update(techniques)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        category: parsed.data.category,
        levelNumber: parsed.data.levelNumber,
        descriptionMd: parsed.data.descriptionMd?.trim() || null,
      })
      .where(eq(techniques.id, parsed.data.id));
  } catch (error) {
    const message = uniqueViolationMessage(error, TECHNIQUE_UNIQUE_MESSAGES);
    if (message) {
      return { ok: false, error: message };
    }
    throw error;
  }

  revalidateTechniques(existing[0].slug);
  if (existing[0].slug !== parsed.data.slug) {
    revalidateTechniques(parsed.data.slug);
  }
  return { ok: true, slug: parsed.data.slug };
}

/** Borrado (docs/03 §H1): práctica o dominio de algún alumno → bloqueado
 *  (el RESTRICT de BD es la red); solo vínculos con lecciones → permitido
 *  (cascade) tras el aviso del dialog. */
export async function deleteTechnique(
  input: unknown,
): Promise<TechniqueDeleteResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const existing = await db
    .select({ slug: techniques.slug })
    .from(techniques)
    .where(eq(techniques.id, parsed.data.id))
    .limit(1);
  if (!existing[0]) {
    return { ok: false, error: strings.common.genericError };
  }

  const [practiceRows, masteryRows] = await Promise.all([
    db
      .select({ one: sql`1` })
      .from(practiceSessions)
      .where(eq(practiceSessions.techniqueId, parsed.data.id))
      .limit(1),
    db
      .select({ one: sql`1` })
      .from(userTechniques)
      .where(eq(userTechniques.techniqueId, parsed.data.id))
      .limit(1),
  ]);
  if (practiceRows.length > 0 || masteryRows.length > 0) {
    return { ok: false, reason: "in_use" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(techniques).where(eq(techniques.id, parsed.data.id));
  });

  revalidateTechniques(existing[0].slug);
  return { ok: true };
}

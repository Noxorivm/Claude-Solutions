"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type AdminMutationResult } from "@/actions/admin/shared";
import { db } from "@/db";
import { user } from "@/db/schema";
import { canChangeRole, canDisable } from "@/lib/admin-rules";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";

const t = strings.admin.users;

/** Admins efectivos: con rol admin y no desactivados. */
async function activeAdminCount(): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(user)
    .where(and(eq(user.role, "admin"), eq(user.disabled, false)));
  return total;
}

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["student", "admin"]),
});

export async function setUserRole(
  input: unknown,
): Promise<AdminMutationResult> {
  const session = await requireAdmin();
  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const rows = await db
    .select({ id: user.id, role: user.role, disabled: user.disabled })
    .from(user)
    .where(eq(user.id, parsed.data.userId))
    .limit(1);
  const target = rows[0];
  if (!target) {
    return { ok: false, error: strings.common.genericError };
  }

  const rule = canChangeRole({
    targetIsAdmin: target.role === "admin" && !target.disabled,
    targetIsSelf: target.id === session.user.id,
    adminCount: await activeAdminCount(),
    newRole: parsed.data.role,
  });
  if (!rule.allowed) {
    return { ok: false, error: t.lastAdminError };
  }

  await db
    .update(user)
    .set({ role: parsed.data.role })
    .where(eq(user.id, parsed.data.userId));

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return { ok: true };
}

const setDisabledSchema = z.object({
  userId: z.string().min(1),
  disabled: z.boolean(),
});

export async function setUserDisabled(
  input: unknown,
): Promise<AdminMutationResult> {
  const session = await requireAdmin();
  const parsed = setDisabledSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: strings.common.genericError };
  }
  const rows = await db
    .select({ id: user.id, role: user.role, disabled: user.disabled })
    .from(user)
    .where(eq(user.id, parsed.data.userId))
    .limit(1);
  const target = rows[0];
  if (!target) {
    return { ok: false, error: strings.common.genericError };
  }

  // Reactivar siempre está permitido; desactivar pasa por la regla.
  if (parsed.data.disabled) {
    const rule = canDisable({
      targetIsAdmin: target.role === "admin" && !target.disabled,
      targetIsSelf: target.id === session.user.id,
      adminCount: await activeAdminCount(),
    });
    if (!rule.allowed) {
      return { ok: false, error: t.lastAdminError };
    }
  }

  await db
    .update(user)
    .set({ disabled: parsed.data.disabled })
    .where(eq(user.id, parsed.data.userId));

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return { ok: true };
}

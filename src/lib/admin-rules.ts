// Reglas puras de gestión de usuarios (docs/03 §H4). Sin IO; las
// actions las aplican con datos frescos de BD y la UI las reutiliza
// para deshabilitar botones. adminCount cuenta admins ACTIVOS (no
// desactivados): son los que pueden administrar de verdad.

export type UserRole = "student" | "admin";

export type RuleResult =
  | { allowed: true }
  | { allowed: false; reason: "last_admin" };

export interface RoleChangeInput {
  targetIsAdmin: boolean;
  targetIsSelf: boolean;
  adminCount: number;
  newRole: UserRole;
}

/** El único admin no puede ser degradado, por nadie (ni por sí mismo). */
export function canChangeRole(input: RoleChangeInput): RuleResult {
  if (
    input.targetIsAdmin &&
    input.newRole === "student" &&
    input.adminCount <= 1
  ) {
    return { allowed: false, reason: "last_admin" };
  }
  return { allowed: true };
}

export interface DisableInput {
  targetIsAdmin: boolean;
  targetIsSelf: boolean;
  adminCount: number;
}

/** El único admin no puede ser desactivado, por nadie (ni por sí mismo). */
export function canDisable(input: DisableInput): RuleResult {
  if (input.targetIsAdmin && input.adminCount <= 1) {
    return { allowed: false, reason: "last_admin" };
  }
  return { allowed: true };
}

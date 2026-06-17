import { describe, expect, it } from "vitest";

import { canChangeRole, canDisable } from "@/lib/admin-rules";

describe("canChangeRole", () => {
  it("bloquea degradar al único admin (incluso a sí mismo)", () => {
    expect(
      canChangeRole({
        targetIsAdmin: true,
        targetIsSelf: false,
        adminCount: 1,
        newRole: "student",
      }),
    ).toEqual({ allowed: false, reason: "last_admin" });
    expect(
      canChangeRole({
        targetIsAdmin: true,
        targetIsSelf: true,
        adminCount: 1,
        newRole: "student",
      }),
    ).toEqual({ allowed: false, reason: "last_admin" });
  });

  it("permite degradar a un admin si hay otro", () => {
    expect(
      canChangeRole({
        targetIsAdmin: true,
        targetIsSelf: true,
        adminCount: 2,
        newRole: "student",
      }),
    ).toEqual({ allowed: true });
  });

  it("permite promover a student siempre", () => {
    expect(
      canChangeRole({
        targetIsAdmin: false,
        targetIsSelf: false,
        adminCount: 1,
        newRole: "admin",
      }),
    ).toEqual({ allowed: true });
  });

  it("re-asignar admin a un admin no choca con la regla", () => {
    expect(
      canChangeRole({
        targetIsAdmin: true,
        targetIsSelf: true,
        adminCount: 1,
        newRole: "admin",
      }),
    ).toEqual({ allowed: true });
  });
});

describe("canDisable", () => {
  it("bloquea desactivar al único admin (incluso a sí mismo)", () => {
    expect(
      canDisable({ targetIsAdmin: true, targetIsSelf: true, adminCount: 1 }),
    ).toEqual({ allowed: false, reason: "last_admin" });
    expect(
      canDisable({ targetIsAdmin: true, targetIsSelf: false, adminCount: 1 }),
    ).toEqual({ allowed: false, reason: "last_admin" });
  });

  it("permite desactivar admins si hay más de uno, y students siempre", () => {
    expect(
      canDisable({ targetIsAdmin: true, targetIsSelf: true, adminCount: 2 }),
    ).toEqual({ allowed: true });
    expect(
      canDisable({ targetIsAdmin: false, targetIsSelf: false, adminCount: 1 }),
    ).toEqual({ allowed: true });
  });
});

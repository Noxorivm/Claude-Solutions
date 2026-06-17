"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setUserDisabled, setUserRole } from "@/actions/admin/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { canChangeRole, canDisable } from "@/lib/admin-rules";
import { strings } from "@/lib/strings";

const t = strings.admin.users;
const ta = strings.admin.actions;

// Acciones por fila (docs/03 §H4). Las reglas puras deshabilitan los
// botones imposibles (último admin); el action las re-aplica en servidor.
export function UserRowActions({
  userId,
  name,
  role,
  disabled,
  isSelf,
  adminCount,
}: {
  userId: string;
  name: string;
  role: "student" | "admin";
  disabled: boolean;
  isSelf: boolean;
  adminCount: number;
}) {
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isActiveAdmin = role === "admin" && !disabled;
  const newRole = role === "admin" ? "student" : "admin";
  const roleRule = canChangeRole({
    targetIsAdmin: isActiveAdmin,
    targetIsSelf: isSelf,
    adminCount,
    newRole,
  });
  const disableRule = disabled
    ? ({ allowed: true } as const)
    : canDisable({
        targetIsAdmin: isActiveAdmin,
        targetIsSelf: isSelf,
        adminCount,
      });

  function handleRole(): void {
    startTransition(async () => {
      const result = await setUserRole({ userId, role: newRole });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(t.roleSaved);
      setRoleOpen(false);
      router.refresh();
    });
  }

  function handleState(): void {
    startTransition(async () => {
      const result = await setUserDisabled({ userId, disabled: !disabled });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(disabled ? t.enabledSaved : t.disabledSaved);
      setStateOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => setRoleOpen(true)}
        disabled={!roleRule.allowed}
        title={!roleRule.allowed ? t.lastAdminError : undefined}
        className="h-8 text-[13px]"
      >
        {role === "admin" ? t.makeStudent : t.makeAdmin}
      </Button>
      <Button
        variant="outline"
        onClick={() => setStateOpen(true)}
        disabled={!disableRule.allowed}
        title={!disableRule.allowed ? t.lastAdminError : undefined}
        className="h-8 text-[13px]"
      >
        {disabled ? t.enable : t.disable}
      </Button>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.roleDialogTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {t.roleDialogBody(name, t.roleLabels[newRole] ?? newRole)}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRoleOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            <Button onClick={handleRole} disabled={pending} className="h-10">
              {t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={stateOpen} onOpenChange={setStateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {disabled ? t.enableDialogTitle : t.disableDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {disabled ? t.enableDialogBody(name) : t.disableDialogBody(name)}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setStateOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            <Button
              variant={disabled ? "default" : "destructive"}
              onClick={handleState}
              disabled={pending}
              className="h-10"
            >
              {t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

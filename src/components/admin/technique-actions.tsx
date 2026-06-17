"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTechnique } from "@/actions/admin/techniques";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { strings } from "@/lib/strings";

const t = strings.admin.techniques.actions;
const ta = strings.admin.actions;

// Borrado con tres variantes (docs/03 §H1): en uso (práctica/dominio) →
// bloqueado; vinculada a lecciones → advertencia de cascada; limpia →
// confirmación normal. Los counts vienen del server; el action re-valida.
export function TechniqueActions({
  techniqueId,
  name,
  lessonLinks,
  inUse,
}: {
  techniqueId: string;
  name: string;
  lessonLinks: number;
  inUse: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete(): void {
    startTransition(async () => {
      const result = await deleteTechnique({ id: techniqueId });
      if (!result.ok) {
        if ("reason" in result && result.reason === "in_use") {
          setBlocked(true);
          return;
        }
        toast.error(
          "error" in result ? result.error : strings.common.genericError,
        );
        return;
      }
      toast.success(t.deleted);
      router.push("/admin/tecnicas");
    });
  }

  const showBlocked = inUse || blocked;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          setBlocked(false);
          setOpen(true);
        }}
        className="h-10 text-danger-ink hover:text-danger-ink"
      >
        {t.deleteTechnique}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {showBlocked
              ? t.inUseBody
              : lessonLinks > 0
                ? t.deleteLinkedBody(name, lessonLinks)
                : t.deleteCleanBody(name)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            {!showBlocked ? (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
                className="h-10"
              >
                {ta.confirmDelete}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

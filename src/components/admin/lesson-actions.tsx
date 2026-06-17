"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  archiveLesson,
  deleteLesson,
  setLessonStatus,
} from "@/actions/admin/lessons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { strings } from "@/lib/strings";

const t = strings.admin.lessonActions;
const ta = strings.admin.actions;

// Mismo patrón que CourseActions (F5-T1): confirmación SIEMPRE; si hay
// progreso de alumnos, el dialog lo explica y ofrece archivar.
export function LessonActions({
  lessonId,
  title,
  status,
  itemCount,
  resourceCount,
}: {
  lessonId: string;
  title: string;
  status: "draft" | "published" | "archived";
  itemCount: number;
  resourceCount: number;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [pending, startTransition] = useTransition();

  function handlePublish(): void {
    startTransition(async () => {
      const result = await setLessonStatus({
        id: lessonId,
        status: "published",
      });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(t.statusSaved);
      router.refresh();
    });
  }

  function handleArchive(): void {
    startTransition(async () => {
      const result = await archiveLesson({ id: lessonId });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(t.archived);
      setArchiveOpen(false);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  function handleDelete(): void {
    startTransition(async () => {
      const result = await deleteLesson({ id: lessonId });
      if (!result.ok) {
        if ("reason" in result && result.reason === "has_progress") {
          setHasProgress(true);
          return;
        }
        toast.error(
          "error" in result ? result.error : strings.common.genericError,
        );
        return;
      }
      toast.success(t.deleted);
      router.push("/admin/lecciones");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" ? (
        <Button onClick={handlePublish} disabled={pending} className="h-10">
          {t.publish}
        </Button>
      ) : null}
      {status !== "archived" ? (
        <Button
          variant="outline"
          onClick={() => setArchiveOpen(true)}
          className="h-10"
        >
          {t.archive}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        onClick={() => {
          setHasProgress(false);
          setDeleteOpen(true);
        }}
        className="h-10 text-danger-ink hover:text-danger-ink"
      >
        {t.deleteLesson}
      </Button>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.archive}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">{t.archiveBody(title)}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            <Button onClick={handleArchive} disabled={pending} className="h-10">
              {t.archive}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {hasProgress
              ? t.hasProgressBody
              : t.deleteBody(title, itemCount, resourceCount)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            {hasProgress ? (
              <Button
                onClick={handleArchive}
                disabled={pending}
                className="h-10"
              >
                {t.archiveInstead}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
                className="h-10"
              >
                {ta.confirmDelete}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  archiveCourse,
  deleteCourse,
  setCourseStatus,
} from "@/actions/admin/courses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { strings } from "@/lib/strings";

const t = strings.admin.actions;

// Publicar / archivar / borrar con confirmación SIEMPRE; si hay progreso
// de alumnos, el dialog lo explica y ofrece archivar (docs/03 §H1).
export function CourseActions({
  courseId,
  title,
  status,
  moduleCount,
  lessonCount,
}: {
  courseId: string;
  title: string;
  status: "draft" | "published" | "archived";
  moduleCount: number;
  lessonCount: number;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [pending, startTransition] = useTransition();

  function handlePublish(): void {
    startTransition(async () => {
      const result = await setCourseStatus({
        id: courseId,
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
      const result = await archiveCourse({ id: courseId });
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
      const result = await deleteCourse({ id: courseId });
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
      toast.success(t.courseDeleted);
      router.push("/admin/cursos");
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
        {t.deleteCourse}
      </Button>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.archive}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">{`«${title}» dejará de verse en el catálogo de los alumnos; su progreso se conserva.`}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              className="h-10"
            >
              {t.cancel}
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
            <DialogTitle>{t.deleteCourseTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {hasProgress
              ? t.hasProgressBody
              : t.deleteCourseBody(title, moduleCount, lessonCount)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="h-10"
            >
              {t.cancel}
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
                {t.confirmDelete}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import Link from "next/link";

import {
  createModule,
  deleteModule,
  updateModule,
} from "@/actions/admin/courses";
import { moveLesson, moveModule } from "@/actions/admin/reorder";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminModuleRow } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.modulesSection;
const ta = strings.admin.actions;

function ModuleRow({
  module: mod,
  isFirst,
  isLast,
}: {
  module: AdminModuleRow;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(mod.title);
  const [order, setOrder] = useState(mod.order);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave(): void {
    startTransition(async () => {
      const result = await updateModule({ id: mod.id, title, order });
      if (!result.ok) {
        toast.error(
          result.error ??
            Object.values(result.fieldErrors ?? {})[0] ??
            strings.common.genericError,
        );
        return;
      }
      toast.success(t.saved);
      router.refresh();
    });
  }

  function handleDelete(): void {
    startTransition(async () => {
      const result = await deleteModule({ id: mod.id });
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
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <li className="py-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <MoveButtons
          id={mod.id}
          title={mod.title}
          isFirst={isFirst}
          isLast={isLast}
          action={moveModule}
        />
        <Input
          type="number"
          min={1}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          aria-label={t.colOrder}
          className="h-9 w-16 font-mono"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t.colTitle}
          className="h-9 min-w-0 flex-1"
        />
        <span className="w-20 shrink-0 font-mono text-[13px] text-muted-foreground">
          {mod.lessonCount} {t.colLessons.toLowerCase()}
        </span>
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={pending}
          className="h-9"
        >
          {t.saveRow}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setHasProgress(false);
            setConfirmOpen(true);
          }}
          className="h-9 text-danger-ink hover:text-danger-ink"
        >
          {t.deleteRow}
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ta.deleteModuleTitle}</DialogTitle>
            </DialogHeader>
            <p className="text-[15px]">
              {hasProgress
                ? ta.hasProgressBody
                : ta.deleteModuleBody(mod.title, mod.lessonCount)}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                className="h-10"
              >
                {ta.cancel}
              </Button>
              {!hasProgress ? (
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
      </div>

      {/* Estructura: lecciones del módulo con reorden ↑/↓ (docs/03 §H3) */}
      {mod.lessons.length === 0 ? (
        <p className="mt-1 pl-20 text-[13px] text-muted-foreground">
          {strings.admin.reorder.structureLessonsEmpty}
        </p>
      ) : (
        <ul className="mt-1 space-y-1 pl-20">
          {mod.lessons.map((lesson, index) => (
            <li key={lesson.id} className="flex flex-wrap items-center gap-2">
              <MoveButtons
                id={lesson.id}
                title={lesson.title}
                isFirst={index === 0}
                isLast={index === mod.lessons.length - 1}
                action={moveLesson}
              />
              <span className="w-6 text-right font-mono text-[13px] text-muted-foreground">
                {lesson.order}
              </span>
              <Link
                href={`/admin/lecciones/${lesson.slug}`}
                className="min-w-0 flex-1 truncate text-[14px] text-info underline underline-offset-2 hover:text-foreground"
              >
                {lesson.title}
              </Link>
              <span className="text-[12px] text-muted-foreground">
                {strings.admin.courses.statusLabel[
                  lesson.status as "draft" | "published" | "archived"
                ] ?? lesson.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function ModuleManager({
  courseId,
  modules,
}: {
  courseId: string;
  modules: AdminModuleRow[];
}) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(): void {
    startTransition(async () => {
      const result = await createModule({ courseId, title: newTitle });
      if (!result.ok) {
        toast.error(
          result.error ??
            Object.values(result.fieldErrors ?? {})[0] ??
            strings.common.genericError,
        );
        return;
      }
      toast.success(t.created);
      setNewTitle("");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="modulos-title" className="mt-8">
      <h2 id="modulos-title" className="text-lg font-bold tracking-tight">
        {t.title}
      </h2>
      {modules.length === 0 ? (
        <p className="mt-2 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {modules.map((mod, index) => (
            <ModuleRow
              key={mod.id}
              module={mod}
              isFirst={index === 0}
              isLast={index === modules.length - 1}
            />
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t.addTitlePlaceholder}
          aria-label={t.addTitlePlaceholder}
          className="h-9 min-w-0 flex-1"
        />
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={pending || newTitle.trim().length === 0}
          className="h-9"
        >
          {t.add}
        </Button>
      </div>
    </section>
  );
}

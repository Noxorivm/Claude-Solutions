"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addResource,
  deleteResource,
  moveResource,
  updateResource,
} from "@/actions/admin/lessons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminResource } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.resourcesEditor;
const ta = strings.admin.actions;

const KIND_VALUES = ["pdf", "image", "link", "file"] as const;

const selectClass =
  "border-input bg-background h-9 rounded-md border px-2 text-[14px]";

function ResourceRow({
  resource,
  isFirst,
  isLast,
}: {
  resource: AdminResource;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState(resource.kind);
  const [title, setTitle] = useState(resource.title);
  const [url, setUrl] = useState(resource.url);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleMove(direction: "up" | "down"): void {
    startTransition(async () => {
      const result = await moveResource({ id: resource.id, direction });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      router.refresh();
    });
  }

  function handleSave(): void {
    startTransition(async () => {
      const result = await updateResource({
        id: resource.id,
        kind,
        title,
        url,
      });
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
      const result = await deleteResource({ id: resource.id });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      toast.success(t.deleted);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-1.5">
      <span className="w-6 text-right font-mono text-[13px] text-muted-foreground">
        {resource.order}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={pending || isFirst}
          onClick={() => handleMove("up")}
          aria-label={`${t.moveUp}: ${resource.title}`}
          className="size-8"
        >
          ↑
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={pending || isLast}
          onClick={() => handleMove("down")}
          aria-label={`${t.moveDown}: ${resource.title}`}
          className="size-8"
        >
          ↓
        </Button>
      </div>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        aria-label={t.kindLabel}
        className={selectClass}
      >
        {KIND_VALUES.map((value) => (
          <option key={value} value={value}>
            {t.kinds[value]}
          </option>
        ))}
      </select>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label={t.titlePlaceholder}
        className="h-9 w-40 min-w-0 flex-1"
      />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        aria-label={t.urlPlaceholder}
        className="h-9 w-48 min-w-0 flex-1 font-mono text-[13px]"
      />
      <Button
        variant="outline"
        onClick={handleSave}
        disabled={pending}
        className="h-9"
      >
        {t.save}
      </Button>
      <Button
        variant="ghost"
        onClick={() => setConfirmOpen(true)}
        className="h-9 text-danger-ink hover:text-danger-ink"
      >
        {t.remove}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">{t.deleteBody(resource.title)}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
              className="h-10"
            >
              {ta.confirmDelete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}

export function ResourcesEditor({
  lessonId,
  resources,
}: {
  lessonId: string;
  resources: AdminResource[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<string>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(): void {
    startTransition(async () => {
      const result = await addResource({ lessonId, kind, title, url });
      if (!result.ok) {
        toast.error(
          result.error ??
            Object.values(result.fieldErrors ?? {})[0] ??
            strings.common.genericError,
        );
        return;
      }
      toast.success(t.created);
      setTitle("");
      setUrl("");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="resources-editor-title" className="mt-8">
      <h2
        id="resources-editor-title"
        className="text-lg font-bold tracking-tight"
      >
        {t.title}
      </h2>
      {resources.length === 0 ? (
        <p className="mt-2 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {resources.map((resource, index) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              isFirst={index === 0}
              isLast={index === resources.length - 1}
            />
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          aria-label={t.kindLabel}
          className={selectClass}
        >
          {KIND_VALUES.map((value) => (
            <option key={value} value={value}>
              {t.kinds[value]}
            </option>
          ))}
        </select>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
          aria-label={t.titlePlaceholder}
          className="h-9 w-40 min-w-0 flex-1"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.urlPlaceholder}
          aria-label={t.urlPlaceholder}
          className="h-9 w-48 min-w-0 flex-1 font-mono text-[13px]"
        />
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={
            pending || title.trim().length === 0 || url.trim().length === 0
          }
          className="h-9"
        >
          {t.add}
        </Button>
      </div>
    </section>
  );
}

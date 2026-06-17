"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  updateChecklistItemText,
} from "@/actions/admin/lessons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminChecklistItem } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.checklistEditor;
const ta = strings.admin.actions;

function ItemRow({
  item,
  isFirst,
  isLast,
}: {
  item: AdminChecklistItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState(item.text);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleMove(direction: "up" | "down"): void {
    startTransition(async () => {
      const result = await moveChecklistItem({ id: item.id, direction });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      router.refresh();
    });
  }

  function handleSave(): void {
    startTransition(async () => {
      const result = await updateChecklistItemText({ id: item.id, text });
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
      const result = await deleteChecklistItem({ id: item.id });
      if (!result.ok) {
        if ("reason" in result && result.reason === "has_progress") {
          setBlocked(true);
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
    <li className="flex flex-wrap items-center gap-2 py-1.5">
      <span className="w-6 text-right font-mono text-[13px] text-muted-foreground">
        {item.order}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={pending || isFirst}
          onClick={() => handleMove("up")}
          aria-label={`${t.moveUp}: ${item.text}`}
          className="size-8"
        >
          ↑
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={pending || isLast}
          onClick={() => handleMove("down")}
          aria-label={`${t.moveDown}: ${item.text}`}
          className="size-8"
        >
          ↓
        </Button>
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={`${t.title}: ${item.order}`}
        className="h-9 min-w-0 flex-1"
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
        onClick={() => {
          setBlocked(false);
          setConfirmOpen(true);
        }}
        className="h-9 text-danger-ink hover:text-danger-ink"
      >
        {t.remove}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-[15px]">
            {blocked ? t.blockedBody : t.deleteBody(item.text)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="h-10"
            >
              {ta.cancel}
            </Button>
            {!blocked ? (
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
    </li>
  );
}

export function ChecklistEditor({
  lessonId,
  items,
}: {
  lessonId: string;
  items: AdminChecklistItem[];
}) {
  const router = useRouter();
  const [newText, setNewText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(): void {
    startTransition(async () => {
      const result = await addChecklistItem({ lessonId, text: newText });
      if (!result.ok) {
        toast.error(
          result.error ??
            Object.values(result.fieldErrors ?? {})[0] ??
            strings.common.genericError,
        );
        return;
      }
      toast.success(t.created);
      setNewText("");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="checklist-editor-title" className="mt-8">
      <h2
        id="checklist-editor-title"
        className="text-lg font-bold tracking-tight"
      >
        {t.title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            />
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={t.addPlaceholder}
          aria-label={t.addPlaceholder}
          className="h-9 min-w-0 flex-1"
        />
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={pending || newText.trim().length === 0}
          className="h-9"
        >
          {t.add}
        </Button>
      </div>
    </section>
  );
}

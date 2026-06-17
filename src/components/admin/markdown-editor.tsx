"use client";

import { useDeferredValue, useRef, useState } from "react";
import { toast } from "sonner";

import { MarkdownContent } from "@/components/lesson/markdown-content";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin.lessonForm;

// Editor markdown del admin (docs/06 §Admin: preview a la derecha).
// La vista previa usa EXACTAMENTE el componente del alumno
// (MarkdownContent): lo que ves es lo que se publica. useDeferredValue
// hace de debounce breve para no re-renderizar el markdown por tecla.
export function MarkdownEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const deferredValue = useDeferredValue(value);

  async function handleFile(file: File): Promise<void> {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
      });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        toast.error(json.error ?? strings.admin.uploads.failed);
        return;
      }
      insertAtCursor(`![${t.imageAltPlaceholder}](${json.url})`);
      toast.success(strings.admin.uploads.uploaded);
    } catch {
      toast.error(strings.admin.uploads.failed);
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  function insertAtCursor(snippet: string): void {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(
        value + (value.endsWith("\n") || value === "" ? "" : "\n") + snippet,
      );
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  const tabClass = (active: boolean) =>
    cn(
      "h-8 rounded-md px-3 text-[13px] font-bold",
      active
        ? "bg-secondary text-secondary-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {/* Tabs solo por debajo de 1024px; en lg+ los dos paneles conviven */}
        <div role="tablist" aria-label={t.contentLabel} className="lg:hidden">
          <button
            type="button"
            role="tab"
            id={`${id}-tab-edit`}
            aria-selected={tab === "edit"}
            aria-controls={`${id}-panel-edit`}
            onClick={() => setTab("edit")}
            className={tabClass(tab === "edit")}
          >
            {t.editTab}
          </button>
          <button
            type="button"
            role="tab"
            id={`${id}-tab-preview`}
            aria-selected={tab === "preview"}
            aria-controls={`${id}-panel-preview`}
            onClick={() => setTab("preview")}
            className={tabClass(tab === "preview")}
          >
            {t.previewTab}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="h-8 text-[13px]"
        >
          {uploading ? t.uploading : t.uploadImage}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div
          role="tabpanel"
          id={`${id}-panel-edit`}
          aria-labelledby={`${id}-tab-edit`}
          className={cn(tab === "edit" ? "block" : "hidden", "lg:block")}
        >
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={18}
            className="w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-[13px] leading-relaxed"
          />
        </div>
        <div
          role="tabpanel"
          id={`${id}-panel-preview`}
          aria-labelledby={`${id}-tab-preview`}
          aria-label={t.previewTab}
          className={cn(tab === "preview" ? "block" : "hidden", "lg:block")}
        >
          <div
            data-testid="md-preview"
            className="max-h-[480px] overflow-y-auto rounded-md border bg-card p-4"
          >
            {deferredValue.trim() === "" ? (
              <p className="text-[14px] text-muted-foreground">
                {t.previewEmpty}
              </p>
            ) : (
              <MarkdownContent markdown={deferredValue} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

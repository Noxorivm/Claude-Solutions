"use client";

import { NotebookPen } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { saveNote } from "@/actions/progress";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { strings } from "@/lib/strings";

const t = strings.lesson;

type SaveState = "idle" | "saving" | "saved" | "error";

// Notas privadas con autosave (docs/03 §C4): debounce manual de ~1s,
// estado anunciado con aria-live (docs/06 §A11y-4).
export function NotesSheet({
  lessonSlug,
  initialContent,
}: {
  lessonSlug: string;
  initialContent: string | null;
}) {
  const [content, setContent] = useState(initialContent ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleChange(value: string) {
    setContent(value);
    setSaveState("saving");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void (async () => {
        const result = await saveNote({ lessonSlug, content: value });
        setSaveState(result.ok ? "saved" : "error");
      })();
    }, 1000);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <NotebookPen className="size-4" strokeWidth={1.75} aria-hidden />
          {t.notes}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="heading-eyebrow">{t.notesLabel}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
          <label htmlFor="lesson-note" className="sr-only">
            {t.notesLabel}
          </label>
          <textarea
            id="lesson-note"
            value={content}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={t.notesPlaceholder}
            className="min-h-0 w-full flex-1 resize-none rounded-lg border border-input bg-background p-3 text-[15px] placeholder:text-muted-foreground"
          />
          <p
            aria-live="polite"
            className="min-h-5 text-[13px] text-muted-foreground"
          >
            {saveState === "saving"
              ? t.notesSaving
              : saveState === "saved"
                ? t.notesSaved
                : saveState === "error"
                  ? t.notesError
                  : ""}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

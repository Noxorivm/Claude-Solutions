"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { completeLesson, uncompleteLesson } from "@/actions/progress";
import { showAchievementToasts } from "@/components/achievement-toasts";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

const t = strings.lesson;

export interface LessonBarNeighbor {
  slug: string;
  locked: boolean;
}

// Barra inferior fija de la lección (docs/06 §Layout-Lección):
// ← anterior · Marcar completada/Desmarcar · siguiente →. El estado
// optimista habilita "Siguiente" al instante tras completar.
export function LessonBar({
  lessonSlug,
  completed,
  previous,
  next,
}: {
  lessonSlug: string;
  completed: boolean;
  previous: LessonBarNeighbor | null;
  next: LessonBarNeighbor | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useState(completed);

  const nextUnlocked = next ? !next.locked || optimisticCompleted : false;

  function handleToggle() {
    startTransition(async () => {
      if (optimisticCompleted) {
        const result = await uncompleteLesson(lessonSlug);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setOptimisticCompleted(false);
        toast(t.uncompletedToast);
      } else {
        const result = await completeLesson(lessonSlug);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setOptimisticCompleted(true);
        toast.success(
          result.xpAwarded > 0
            ? t.completedToast(result.xpAwarded)
            : t.completedToastNoXp,
        );
        showAchievementToasts(result.newAchievements);
      }
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 backdrop-blur md:bottom-0 md:left-60">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-3 md:px-8">
        {previous ? (
          <Button asChild variant="outline">
            {/* aria-label: en móvil el texto va oculto y el chevron es
                aria-hidden; sin esto el link queda sin nombre (F6-T3). */}
            <Link
              href={`/app/leccion/${previous.slug}`}
              aria-label={t.previous}
            >
              <ChevronLeft aria-hidden />
              <span className="hidden sm:inline">{t.previous}</span>
            </Link>
          </Button>
        ) : (
          <span aria-hidden />
        )}

        <Button
          onClick={handleToggle}
          disabled={pending}
          variant={optimisticCompleted ? "outline" : "default"}
        >
          {optimisticCompleted ? (
            t.unmark
          ) : (
            <>
              <Check aria-hidden />
              {pending ? t.completing : t.markComplete}
            </>
          )}
        </Button>

        {next ? (
          nextUnlocked ? (
            <Button asChild variant="outline">
              <Link href={`/app/leccion/${next.slug}`} aria-label={t.next}>
                <span className="hidden sm:inline">{t.next}</span>
                <ChevronRight aria-hidden />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled aria-label={t.nextLockedReason}>
              <span className="hidden sm:inline">{t.next}</span>
              <ChevronRight aria-hidden />
            </Button>
          )
        ) : (
          <span aria-hidden />
        )}
      </div>
    </div>
  );
}

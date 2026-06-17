import { Lock } from "lucide-react";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { strings } from "@/lib/strings";
import type { CourseStatus } from "@/lib/unlock";
import { cn } from "@/lib/utils";

const t = strings.routeMap;

export interface CourseCardProps {
  slug: string;
  title: string;
  summary: string;
  status: CourseStatus;
  completionPct: number;
  /** Qué falta para desbloquear (solo naipes bloqueados). */
  lockedHint?: string;
}

function statusText(status: CourseStatus, pct: number): string {
  switch (status) {
    case "completed":
      return t.statusCompleted;
    case "in_progress":
      return t.statusInProgress(pct);
    case "available":
      return t.statusAvailable;
    case "locked":
      return t.statusLocked;
  }
}

// Naipe 5:7 con radio 12px (docs/06 §Espaciado). El volteo es CSS puro
// gobernado por el estado: bloqueado = boca abajo (rotateY 180). 350ms
// ease-out; instantáneo bajo prefers-reduced-motion.
export function CourseCard({
  slug,
  title,
  summary,
  status,
  completionPct,
  lockedHint,
}: CourseCardProps) {
  const locked = status === "locked";

  const card = (
    <div
      className={cn(
        "relative size-full transition-transform duration-[350ms] ease-out [transform-style:preserve-3d] motion-reduce:transition-none",
        locked && "[transform:rotateY(180deg)]",
      )}
    >
      <div
        data-face="front"
        aria-hidden={locked || undefined}
        className="ornate-frame-sutil felt-texture absolute inset-0 flex flex-col overflow-hidden p-3 [backface-visibility:hidden]"
      >
        <h3 className="font-display text-lg leading-snug">{title}</h3>
        <p className="mt-1 line-clamp-4 text-[13px] text-muted-foreground">
          {summary}
        </p>
        <div className="mt-auto space-y-2 pt-3">
          <Progress
            value={completionPct}
            aria-label={t.progressLabel(title)}
            className="h-1.5"
          />
          <p
            className={cn(
              "text-[13px]",
              status === "completed"
                ? "font-bold text-success-ink"
                : "text-muted-foreground",
            )}
          >
            {statusText(status, completionPct)}
          </p>
        </div>
      </div>
      <div
        data-face="back"
        aria-hidden={!locked || undefined}
        className="naipe-back ornate-frame-sutil absolute inset-0 flex [transform:rotateY(180deg)] flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center [backface-visibility:hidden]"
      >
        <Lock className="size-5" strokeWidth={1.75} aria-hidden />
        <p className="text-[13px] font-bold">
          {statusText(status, completionPct)}
        </p>
        {lockedHint ? (
          <p className="text-[13px] text-muted-foreground">{lockedHint}</p>
        ) : null}
      </div>
    </div>
  );

  if (locked) {
    return (
      <div
        tabIndex={0}
        className="naipe-tilt aspect-[5/7] rounded-[12px] [perspective:1000px]"
      >
        {card}
      </div>
    );
  }

  return (
    <Link
      href={`/app/cursos/${slug}`}
      className="group naipe-tilt block aspect-[5/7] rounded-[12px] [perspective:1000px]"
    >
      {card}
    </Link>
  );
}

import {
  Check,
  CircleHelp,
  FileText,
  Lock,
  Play,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CourseDetailModule } from "@/db/queries/course-detail";
import type { LessonFlowStatus } from "@/lib/lesson-flow";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.courseDetail;

// Iconos consistentes por tipo de lección (docs/06 §Layout-Curso).
const TYPE_ICONS: Record<keyof typeof t.lessonTypes, LucideIcon> = {
  article: FileText,
  video: Play,
  practice: Timer,
  quiz: CircleHelp,
  milestone: Trophy,
};

export interface CourseModulesProps {
  modules: CourseDetailModule[];
  /** Estado de secuencia por slug de lección (lib/lesson-flow + nivel). */
  statusBySlug: Map<string, LessonFlowStatus>;
  /** Módulo abierto por defecto (el de la siguiente lección pendiente). */
  defaultOpenModuleId: string | null;
}

export function CourseModules({
  modules,
  statusBySlug,
  defaultOpenModuleId,
}: CourseModulesProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenModuleId ? [defaultOpenModuleId] : []}
      className="space-y-3"
    >
      {modules.map((mod, index) => (
        <AccordionItem
          key={mod.id}
          value={mod.id}
          style={{ "--enter-i": index } as CSSProperties}
          className="ornate-frame-sutil felt-texture section-enter px-4"
        >
          <AccordionTrigger className="font-display text-[17px]">
            {mod.title}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1">
              {mod.lessons.map((lesson) => {
                const status = statusBySlug.get(lesson.slug) ?? "locked";
                const TypeIcon = TYPE_ICONS[lesson.type];
                const row = (
                  <>
                    <TypeIcon
                      className="size-5 shrink-0 text-muted-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[15px]",
                        status === "locked" && "text-muted-foreground",
                      )}
                    >
                      {lesson.title}
                    </span>
                    <span className="sr-only">
                      {t.lessonTypes[lesson.type]}
                      {" · "}
                      {status === "completed"
                        ? t.lessonCompleted
                        : status === "locked"
                          ? `${t.lessonLocked}. ${t.lessonLockedReason}`
                          : strings.routeMap.statusAvailable}
                    </span>
                    {lesson.durationMin ? (
                      <span className="shrink-0 text-[13px] text-muted-foreground">
                        {t.minutes(lesson.durationMin)}
                      </span>
                    ) : null}
                    {status === "completed" ? (
                      <Check
                        className="size-5 shrink-0 text-primary"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : status === "locked" ? (
                      <Lock
                        className="size-4 shrink-0 text-muted-foreground"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : null}
                  </>
                );

                return (
                  <li key={lesson.id}>
                    {status === "locked" ? (
                      <div className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5">
                        {row}
                      </div>
                    ) : (
                      <Link
                        href={`/app/leccion/${lesson.slug}`}
                        className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent"
                      >
                        {row}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

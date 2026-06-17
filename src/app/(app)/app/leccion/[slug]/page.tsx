import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChecklistPanel } from "@/components/lesson/checklist-panel";
import { LessonBar } from "@/components/lesson/lesson-bar";
import { MarkdownContent } from "@/components/lesson/markdown-content";
import { NotesSheet } from "@/components/lesson/notes-sheet";
import { QuizPanel } from "@/components/lesson/quiz-panel";
import { RubricForm } from "@/components/lesson/rubric-form";
import { VideoEmbed } from "@/components/lesson/video-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLessonDetail } from "@/db/queries/lesson-detail";
import {
  getMilestoneSubmissions,
  type MilestoneSubmissionRow,
} from "@/db/queries/milestone";
import { getQuizForLesson, type QuizForLesson } from "@/db/queries/quiz";
import { getRouteMapData } from "@/db/queries/route-map";
import { formatMadridDate } from "@/lib/format";
import { requireUser } from "@/lib/guards";
import { computeLessonFlow } from "@/lib/lesson-flow";
import { ratingsAverage } from "@/lib/milestone";
import { shuffle } from "@/lib/quiz";
import { strings } from "@/lib/strings";
import { computeRouteState } from "@/lib/unlock";
import { parseVideoUrl } from "@/lib/video";

const t = strings.lesson;
const tc = strings.courseDetail;

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  link: LinkIcon,
  file: Paperclip,
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireUser();
  const detail = await getLessonDetail(slug, session.user.id);
  if (!detail) {
    notFound();
  }

  const freeRoam = Boolean(session.user.free_roam);

  // Mismo gating de nivel que la página de curso (URL directa a una
  // lección de un nivel bloqueado no debe saltarse docs/03 §B3).
  const routeData = await getRouteMapData(session.user.id);
  const states = computeRouteState(
    routeData.levels.map((level) => ({
      id: level.id,
      courses: routeData.courses
        .filter((course) => course.levelId === level.id)
        .map((course) => ({
          id: course.id,
          isRequired: course.isRequired,
          publishedLessons: course.publishedLessons,
          completedLessons: course.completedLessons,
        })),
    })),
    { freeRoam },
  );
  const levelState = states.find((s) => s.id === detail.course.levelId);
  const levelLocked = !(levelState?.unlocked ?? false);

  // La decisión de secuencia sale de lesson-flow (no se reimplementa).
  const flow = computeLessonFlow(
    detail.course.modules.map((mod) => ({
      order: mod.order,
      lessons: mod.lessons.map((lesson) => ({
        slug: lesson.slug,
        order: lesson.order,
        completed: lesson.completed,
      })),
    })),
    { freeRoam },
  );

  const allLessons = detail.course.modules.flatMap((mod) => mod.lessons);
  const titleBySlug = new Map(
    allLessons.map((lesson) => [lesson.slug, lesson.title]),
  );
  const completed =
    allLessons.find((lesson) => lesson.slug === slug)?.completed ?? false;

  const index = flow.lessons.findIndex((lesson) => lesson.slug === slug);
  const current = flow.lessons[index];
  const previous = index > 0 ? flow.lessons[index - 1] : null;
  const next =
    index >= 0 && index < flow.lessons.length - 1
      ? flow.lessons[index + 1]
      : null;

  if (levelLocked || current.status === "locked") {
    const previousTitle = previous
      ? (titleBySlug.get(previous.slug) ?? null)
      : null;
    return (
      <>
        <h1 className="heading-gilded font-display text-3xl tracking-tight">
          {detail.lesson.title}
        </h1>
        <div
          role="status"
          className="mt-6 flex max-w-prose items-start gap-3 rounded-xl border border-destructive/40 bg-card p-4"
        >
          <Lock
            className="mt-0.5 size-5 shrink-0 text-destructive"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-[15px]">
            {levelLocked
              ? tc.levelLockedBanner
              : previousTitle
                ? t.lockedNotice(previousTitle)
                : t.lockedNoticeFirst}
          </p>
        </div>
        <Button asChild className="mt-6">
          <Link href={`/app/cursos/${detail.course.slug}`}>{t.goToCourse}</Link>
        </Button>
      </>
    );
  }

  const video = parseVideoUrl(detail.lesson.videoUrl);
  const showChecklist =
    detail.checklist.length > 0 &&
    (detail.lesson.type === "video" || detail.lesson.type === "practice");

  let milestoneHistory: MilestoneSubmissionRow[] = [];
  if (detail.lesson.type === "milestone") {
    milestoneHistory = await getMilestoneSubmissions(
      detail.lesson.id,
      session.user.id,
    );
  }

  // Quiz: preguntas barajadas en servidor; opciones solo en 'single'
  // (las truefalse mantienen Verdadero/Falso). Las soluciones nunca
  // entran en las props.
  let quiz: QuizForLesson | null = null;
  if (detail.lesson.type === "quiz") {
    quiz = await getQuizForLesson(detail.lesson.id, session.user.id);
    if (quiz) {
      quiz = {
        ...quiz,
        questions: shuffle(quiz.questions, Math.random).map((question) => ({
          ...question,
          options:
            question.kind === "single"
              ? shuffle(question.options, Math.random)
              : question.options,
        })),
      };
    }
  }

  return (
    <div className="pb-20">
      <nav aria-label={t.breadcrumb}>
        <ol className="flex flex-wrap items-center gap-x-2 text-[15px] text-muted-foreground">
          <li>
            <Link href="/app/ruta" className="hover:text-foreground">
              {strings.routeMap.title}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`/app/cursos/${detail.course.slug}`}
              className="hover:text-foreground"
            >
              {detail.course.title}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {detail.lesson.title}
          </li>
        </ol>
      </nav>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="heading-gilded font-display text-3xl tracking-tight">
            {detail.lesson.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-[15px] text-muted-foreground">
            <Badge variant="secondary">
              {tc.lessonTypes[detail.lesson.type]}
            </Badge>
            {detail.lesson.durationMin ? (
              <span>{tc.minutes(detail.lesson.durationMin)}</span>
            ) : null}
          </div>
        </div>
        <NotesSheet lessonSlug={slug} initialContent={detail.noteContent} />
      </header>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <div>
          {video ? (
            <div className="mt-6 max-w-[68ch]">
              <VideoEmbed video={video} title={detail.lesson.title} />
            </div>
          ) : null}

          {detail.lesson.contentMd ? (
            // Padding sumado al max-width (calc): el ancho interior queda
            // EXACTAMENTE en 68ch, sin estrechar la medida del markdown.
            <div className="reading-surface mt-6 max-w-[calc(68ch+3rem)] rounded-2xl border p-6">
              <MarkdownContent markdown={detail.lesson.contentMd} />
            </div>
          ) : null}

          {detail.lesson.type === "milestone" ? (
            <div className="mt-8 max-w-[68ch] space-y-6">
              <RubricForm
                lessonSlug={slug}
                lessonCompleted={completed}
                hasSubmissions={milestoneHistory.length > 0}
                items={detail.checklist.map((item) => ({
                  id: item.id,
                  text: item.text,
                }))}
              />

              {milestoneHistory.length > 0 ? (
                <section aria-labelledby="rubric-history-title">
                  <h2
                    id="rubric-history-title"
                    className="font-display text-2xl tracking-tight"
                  >
                    {strings.milestone.historyTitle}
                  </h2>
                  <ul className="mt-3 space-y-4">
                    {milestoneHistory.map((submission) => (
                      <li
                        key={submission.id}
                        className="rounded-xl border bg-card p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[13px] text-muted-foreground">
                            {formatMadridDate(submission.createdAt)}
                          </span>
                          <span className="font-mono text-[15px]">
                            {strings.milestone.averageLabel(
                              ratingsAverage(submission.ratings)
                                .toFixed(1)
                                .replace(".", ","),
                            )}
                          </span>
                        </div>
                        <ul className="mt-3 space-y-1 text-[13px] text-muted-foreground">
                          {detail.checklist.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-baseline justify-between gap-3"
                            >
                              <span className="min-w-0 flex-1">
                                {item.text}
                              </span>
                              <span className="shrink-0 font-mono">
                                {submission.ratings[item.id] ?? "—"}/5
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[15px]">
                          {submission.reflection ??
                            strings.milestone.noReflection}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          {detail.lesson.type === "quiz" ? (
            <div className="mt-8 max-w-[68ch]">
              {!quiz || quiz.questions.length === 0 ? (
                <EmptyState
                  role="status"
                  eyebrow={strings.quiz.noQuestionsEyebrow}
                  message={strings.quiz.noQuestions}
                />
              ) : (
                <>
                  {quiz.attemptsCount > 0 && quiz.bestScorePct !== null ? (
                    <p className="mb-4 font-mono text-[13px] text-muted-foreground">
                      {strings.quiz.bestAttempt(
                        quiz.bestScorePct,
                        quiz.attemptsCount,
                      )}
                    </p>
                  ) : null}
                  <QuizPanel
                    lessonSlug={slug}
                    lessonCompleted={completed}
                    initialQuestions={quiz.questions}
                  />
                </>
              )}
            </div>
          ) : null}

          {detail.resources.length > 0 ? (
            <section aria-labelledby="recursos" className="mt-10 max-w-[68ch]">
              <h2
                id="recursos"
                className="font-display text-2xl tracking-tight"
              >
                {t.resources}
              </h2>
              <ul className="mt-3 space-y-1">
                {detail.resources.map((resource) => {
                  const Icon = RESOURCE_ICONS[resource.kind] ?? Paperclip;
                  return (
                    <li key={resource.id}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-[15px] hover:bg-accent"
                      >
                        <Icon
                          className="size-5 shrink-0 text-primary"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {resource.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        {showChecklist ? (
          <aside className="mt-8 xl:mt-6">
            <div className="xl:sticky xl:top-8">
              <ChecklistPanel
                items={detail.checklist}
                isPractice={detail.lesson.type === "practice"}
              />
            </div>
          </aside>
        ) : null}
      </div>

      <LessonBar
        lessonSlug={slug}
        completed={completed}
        previous={
          previous
            ? { slug: previous.slug, locked: previous.status === "locked" }
            : null
        }
        next={
          next ? { slug: next.slug, locked: next.status === "locked" } : null
        }
      />
    </div>
  );
}

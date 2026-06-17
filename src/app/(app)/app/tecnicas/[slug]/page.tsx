import { Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/lesson/markdown-content";
import { MasteryDial } from "@/components/practice/mastery-dial";
import { MasteryEditor } from "@/components/practice/mastery-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTechniqueDetail } from "@/db/queries/techniques";
import { formatMadridDate, formatMadridDateShort } from "@/lib/format";
import { requireUser } from "@/lib/guards";
import { madridDayRange } from "@/lib/streak";
import { strings } from "@/lib/strings";

const t = strings.techniques;
const tp = strings.practice;
const CATEGORY_LABELS = strings.techniques.categories;

export default async function TecnicaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireUser();
  const detail = await getTechniqueDetail(slug, session.user.id);
  if (!detail) {
    notFound();
  }

  const reviewOverdue =
    detail.nextReviewAt !== null &&
    detail.nextReviewAt < madridDayRange(new Date()).end;

  return (
    <>
      <Link
        href="/app/tecnicas"
        className="text-[15px] text-muted-foreground hover:text-foreground"
      >
        ← {t.title}
      </Link>

      <div className="ornate-glow mt-4">
        <header className="ornate-frame-strong felt-texture flex flex-wrap items-start justify-between gap-6 p-6">
        <div>
          <h1 className="heading-gilded font-display text-3xl tracking-tight">
            {detail.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[15px] text-muted-foreground">
            <Badge variant="secondary">
              {CATEGORY_LABELS[detail.category] ?? detail.category}
            </Badge>
            <span>
              {t.curriculumLevel(detail.levelNumber, detail.levelName)}
            </span>
          </div>
          <dl className="mt-4 space-y-1 text-[15px] text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <dt className="font-bold">{t.nextReview}:</dt>
              <dd className="flex items-center gap-2">
                {detail.nextReviewAt
                  ? formatMadridDate(detail.nextReviewAt)
                  : t.never}
                {reviewOverdue ? (
                  <Badge
                    variant="outline"
                    className="border-destructive text-danger-ink"
                  >
                    {t.overdueBadge}
                  </Badge>
                ) : null}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold">{t.lastPracticed}:</dt>
              <dd>
                {detail.lastPracticedAt
                  ? formatMadridDate(detail.lastPracticedAt)
                  : t.never}
              </dd>
            </div>
          </dl>
        </div>
        <MasteryDial mastery={detail.mastery} size="lg" />
        </header>
      </div>

      <div className="mt-6">
        <MasteryEditor
          techniqueSlug={detail.slug}
          initialMastery={detail.mastery}
        />
      </div>

      <section className="reading-surface mt-8 max-w-[calc(68ch+3rem)] rounded-2xl border p-6">
        {detail.descriptionMd ? (
          <MarkdownContent markdown={detail.descriptionMd} />
        ) : (
          <p className="text-[15px] text-muted-foreground">{t.noDescription}</p>
        )}
      </section>

      <section aria-labelledby="lecciones-title" className="mt-10">
        <h2
          id="lecciones-title"
          className="font-display text-2xl tracking-tight"
        >
          {t.lessonsTitle}
        </h2>
        {detail.lessons.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            {t.lessonsEmpty}
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {detail.lessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={`/app/leccion/${lesson.slug}`}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-[15px] hover:bg-accent"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {lesson.title}
                  </span>
                  {lesson.completed ? (
                    <>
                      <Check
                        className="size-5 shrink-0 text-primary"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span className="sr-only">
                        {strings.courseDetail.lessonCompleted}
                      </span>
                    </>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="historial-title" className="mt-10">
        <h2
          id="historial-title"
          className="font-display text-2xl tracking-tight"
        >
          {t.historyTitle}
        </h2>
        {detail.sessions.length === 0 ? (
          <div className="mt-2 space-y-3">
            <p className="text-[15px] text-muted-foreground">
              {t.historyEmpty}
            </p>
            <Button asChild variant="outline" className="h-11">
              <Link href="/app/practica">{t.historyCta}</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {detail.sessions.map((session_) => (
              <li
                key={session_.id}
                className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[15px]"
              >
                <span className="shrink-0 font-mono text-muted-foreground">
                  {formatMadridDateShort(session_.performedAt)}
                </span>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {tp.minutesShort(Math.round(session_.durationSec / 60))}
                </span>
                {session_.selfRating ? (
                  <span className="shrink-0 font-mono text-muted-foreground">
                    {tp.ratingOf(session_.selfRating)}
                  </span>
                ) : null}
                {session_.notes ? (
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {session_.notes}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

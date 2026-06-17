import { ManualSessionForm } from "@/components/practice/manual-session-form";
import { FocusTimerButton } from "@/components/practice/focus-timer-button";
import { PracticeTimer } from "@/components/practice/practice-timer";
import {
  getPracticeFormOptions,
  getPracticeHistory,
  type PracticeHistoryRow,
} from "@/db/queries/practice";
import { requireUser } from "@/lib/guards";
import { strings } from "@/lib/strings";

const t = strings.practice;

const HOUR_FORMAT = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  hour: "2-digit",
  minute: "2-digit",
});

const DAY_FORMAT = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  weekday: "short",
  day: "numeric",
});

function SessionList({
  rows,
  withDay,
}: {
  rows: PracticeHistoryRow[];
  withDay?: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[15px]"
        >
          <span className="shrink-0 font-mono text-muted-foreground">
            {withDay ? `${DAY_FORMAT.format(row.performedAt)} · ` : ""}
            {HOUR_FORMAT.format(row.performedAt)}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {row.techniqueName ?? row.lessonTitle ?? "—"}
          </span>
          <span className="shrink-0 font-mono text-muted-foreground">
            {t.minutesShort(Math.round(row.durationSec / 60))}
          </span>
          {row.selfRating ? (
            <span className="shrink-0 font-mono text-muted-foreground">
              {t.ratingOf(row.selfRating)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function PracticaPage() {
  const session = await requireUser();
  const [options, history] = await Promise.all([
    getPracticeFormOptions(session.user.id),
    getPracticeHistory(session.user.id),
  ]);
  const isEmpty =
    history.todaySessions.length === 0 && history.weekSessions.length === 0;

  return (
    <>
      <h1 className="section-enter heading-gilded font-display text-3xl tracking-tight">
        {t.title}
      </h1>
      <p
        className="section-enter mt-2 text-muted-foreground"
        style={{ "--enter-i": 1 } as React.CSSProperties}
      >
        {t.intro}
      </p>

      <div className="mt-6 space-y-4">
        <div
          className="section-enter"
          style={{ "--enter-i": 2 } as React.CSSProperties}
        >
          <PracticeTimer options={options} />
        </div>

        <div
          className="section-enter"
          style={{ "--enter-i": 3 } as React.CSSProperties}
        >
          <ManualSessionForm options={options} />
        </div>

        <section
          aria-labelledby="history-title"
          style={{ "--enter-i": 4 } as React.CSSProperties}
          className="section-enter ornate-frame-sutil felt-texture p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="history-title" className="heading-eyebrow">
              {t.historyTitle}
            </h2>
            <p className="font-mono text-[13px] text-muted-foreground">
              {t.totalToday}:{" "}
              {t.minutesShort(Math.round(history.todaySec / 60))} ·{" "}
              {t.totalWeek}: {t.minutesShort(Math.round(history.weekSec / 60))}
            </p>
          </div>

          {isEmpty ? (
            <div className="mt-4 space-y-3">
              <p className="text-[15px] text-muted-foreground">
                {t.emptyHistory}
              </p>
              <FocusTimerButton />
            </div>
          ) : (
            <div className="mt-3 space-y-5">
              {history.todaySessions.length > 0 ? (
                <div>
                  <h3 className="heading-eyebrow">{t.historyToday}</h3>
                  <SessionList rows={history.todaySessions} />
                </div>
              ) : null}
              {history.weekSessions.length > 0 ? (
                <div>
                  <h3 className="heading-eyebrow">{t.historyWeek}</h3>
                  <SessionList rows={history.weekSessions} withDay />
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

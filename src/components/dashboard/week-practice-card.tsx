import type { WeekBar } from "@/lib/progress";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.dashboard;

const WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

// Mini-gráfica real de la semana (docs/03 §D1): 7 barras L–D con hoy
// destacado y días futuros atenuados. HTML/CSS propio, sin librerías.
export function WeekPracticeCard({
  bars,
  totalMinutes,
}: {
  bars: WeekBar[];
  totalMinutes: number;
}) {
  const max = Math.max(...bars.map((bar) => bar.minutes), 1);

  return (
    <section
      aria-labelledby="week-practice-title"
      className="card-lift rounded-2xl border bg-card p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="week-practice-title" className="heading-eyebrow">
          {t.practiceTitle}
        </h2>
        <p className="font-mono text-[15px]">
          {strings.practice.minutesShort(totalMinutes)}
        </p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        {bars.map((bar, index) => (
          <div
            key={bar.date}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className="flex h-16 w-full items-end"
              aria-label={`${WEEKDAY_LETTERS[index]}: ${strings.practice.minutesShort(bar.minutes)}`}
              role="img"
            >
              <div
                data-today={bar.isToday || undefined}
                className={cn(
                  "w-full rounded-t-sm",
                  bar.isToday ? "bg-primary" : "bg-primary/45",
                  bar.future && "bg-secondary opacity-40",
                )}
                style={{
                  height: `${bar.minutes > 0 ? Math.max(12, (bar.minutes / max) * 100) : 6}%`,
                }}
              />
            </div>
            <span
              aria-hidden
              className={cn(
                "text-[11px]",
                bar.isToday
                  ? "font-bold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {WEEKDAY_LETTERS[index]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

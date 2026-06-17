import { StreakFlameIcon } from "@/components/dashboard/streak-flame-icon";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.dashboard;

export function StreakCard({ streak }: { streak: number }) {
  return (
    <section
      aria-labelledby="streak-title"
      className="card-lift rounded-2xl border bg-card p-5"
    >
      <h2 id="streak-title" className="heading-eyebrow">
        {t.streakTitle}
      </h2>
      <div className="mt-2 flex items-center gap-3">
        <span className="hex-medallion" aria-hidden>
          <StreakFlameIcon
            className={cn(
              "size-6",
              streak > 0 ? "text-primary" : "text-muted-foreground",
            )}
          />
        </span>
        <p className="font-mono text-4xl">{streak}</p>
        <p className="text-[15px] text-muted-foreground">
          {t.streakDays(streak)}
        </p>
      </div>
      {streak === 0 ? (
        <p className="mt-3 text-[13px] text-muted-foreground">
          {t.streakEmpty}
        </p>
      ) : null}
    </section>
  );
}

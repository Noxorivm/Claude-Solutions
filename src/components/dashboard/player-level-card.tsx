import { Star } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { playerLevel } from "@/lib/xp";
import { strings } from "@/lib/strings";

const t = strings.dashboard;

export function PlayerLevelCard({ xp }: { xp: number }) {
  const level = playerLevel(xp);
  return (
    <section
      aria-labelledby="level-title"
      className="card-lift rounded-2xl border bg-card p-5"
    >
      <h2 id="level-title" className="heading-eyebrow">
        {t.levelTitle}
      </h2>
      <div className="mt-2 flex items-center gap-3">
        <span className="hex-medallion" aria-hidden>
          <Star className="size-5 text-primary" strokeWidth={1.75} />
        </span>
        <p className="heading-gilded font-display text-2xl tracking-tight">
          {level.name}
        </p>
      </div>
      <p className="mt-1 font-mono text-[15px] text-muted-foreground">
        {t.xpValue(xp)}
      </p>
      {level.nextThreshold !== null ? (
        <>
          <Progress
            value={level.progressPct}
            aria-label={t.levelProgressLabel}
            className="mt-3 h-2"
          />
          <p className="mt-2 font-mono text-[13px] text-muted-foreground">
            {t.levelProgress(xp, level.nextThreshold)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-muted-foreground">{t.levelMax}</p>
      )}
    </section>
  );
}

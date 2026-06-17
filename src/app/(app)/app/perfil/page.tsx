import {
  Award,
  Clock,
  Crown,
  Flame,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { getAchievementShowcase } from "@/db/queries/achievements";
import { formatMadridDate } from "@/lib/format";
import { requireUser } from "@/lib/guards";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.achievements;

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  trophy: Trophy,
  flame: Flame,
  clock: Clock,
  crown: Crown,
};

export default async function PerfilPage() {
  const session = await requireUser();
  const showcase = await getAchievementShowcase(session.user.id);
  const earnedCount = showcase.filter((entry) => entry.earnedAt).length;

  return (
    <>
      <h1 className="heading-gilded font-display text-3xl tracking-tight">
        {strings.pages.perfil}
      </h1>
      <p className="mt-2 text-muted-foreground">{t.profileEditPending}</p>

      <section
        aria-labelledby="vitrina-title"
        className="ornate-frame-sutil felt-texture mt-6 p-5"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="vitrina-title" className="heading-eyebrow">
            {t.showcaseTitle}
          </h2>
          <span className="font-mono text-[13px] text-muted-foreground">
            {t.counter(earnedCount, showcase.length)}
          </span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {showcase.map((achievement) => {
            const Icon = ICONS[achievement.icon ?? ""] ?? Award;
            const earned = achievement.earnedAt !== null;
            return (
              <li
                key={achievement.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card/60 p-4",
                  !earned && "opacity-60",
                )}
              >
                <span className="hex-medallion" aria-hidden>
                  <Icon
                    className={cn(
                      "size-5",
                      earned ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={1.75}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold">{achievement.name}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {achievement.description}
                  </p>
                  {achievement.earnedAt ? (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {t.earnedOn(formatMadridDate(achievement.earnedAt))}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

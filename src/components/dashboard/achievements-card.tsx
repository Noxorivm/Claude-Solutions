import {
  Award,
  Clock,
  Crown,
  Flame,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import type { RecentAchievement } from "@/db/queries/achievements";
import { formatRelativeDays } from "@/lib/format";
import { strings } from "@/lib/strings";

const t = strings.dashboard;

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  trophy: Trophy,
  flame: Flame,
  clock: Clock,
  crown: Crown,
};

// Fila 3 del dashboard (docs/03 §D1): últimos logros reales; sin logros,
// el estado vacío orientativo enlaza a la vitrina del perfil.
export function AchievementsCard({ recent }: { recent: RecentAchievement[] }) {
  const now = new Date();
  return (
    <section
      aria-labelledby="achievements-title"
      className="card-lift rounded-2xl border bg-card p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="achievements-title" className="heading-eyebrow">
          {t.achievementsTitle}
        </h2>
        <Link
          href="/app/perfil"
          className="text-[13px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {strings.achievements.seeProfile}
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="mt-2 text-[15px] text-muted-foreground">
          {t.achievementsEmpty}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {recent.map((achievement) => {
            const Icon = ICONS[achievement.icon ?? ""] ?? Award;
            return (
              <li
                key={achievement.slug}
                className="flex items-center gap-3 text-[15px]"
              >
                <Icon
                  className="size-5 shrink-0 text-primary"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">
                  {achievement.name}
                </span>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  {formatRelativeDays(achievement.earnedAt, now)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

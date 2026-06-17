import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { ContinueCard } from "@/components/dashboard/continue-card";
import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { PlayerLevelCard } from "@/components/dashboard/player-level-card";
import { ReviewsCard } from "@/components/dashboard/reviews-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { WeekPracticeCard } from "@/components/dashboard/week-practice-card";
import { getRecentAchievements } from "@/db/queries/achievements";
import { getDashboardData } from "@/db/queries/dashboard";
import { getDueTechniques } from "@/db/queries/practice";
import { buildWeekBars, weekMinutes } from "@/lib/progress";
import { requireUser } from "@/lib/guards";
import { currentStreak, toMadridDay } from "@/lib/streak";
import { strings } from "@/lib/strings";

const t = strings.dashboard;

export default async function AppHomePage() {
  const session = await requireUser();
  const data = await getDashboardData(
    session.user.id,
    Boolean(session.user.free_roam),
  );
  const today = toMadridDay(new Date());
  const streak = currentStreak(data.activeDays, today);
  const totalWeekMinutes = weekMinutes(today, data.weekActivity);
  const weekBars = buildWeekBars(today, data.weekActivity);
  const recentAchievements = await getRecentAchievements(session.user.id, 3);
  const dueTechniques = await getDueTechniques(session.user.id);

  return (
    <>
      <h1 className="section-enter heading-gilded font-display text-4xl tracking-tight">
        {strings.app.greeting(session.user.name)}
      </h1>

      <div
        className="section-enter mt-8 grid gap-4 md:grid-cols-3"
        style={{ "--enter-i": 1 } as React.CSSProperties}
      >
        <div className="ornate-glow md:col-span-2">
          <ContinueCard target={data.continueTarget} />
        </div>
        <div className="grid content-start gap-4">
          <StreakCard streak={streak} />
          <PlayerLevelCard xp={data.xp} />
        </div>
      </div>

      <div
        className="section-enter mt-4 grid gap-4 md:grid-cols-2"
        style={{ "--enter-i": 2 } as React.CSSProperties}
      >
        <ReviewsCard due={dueTechniques} />
        {totalWeekMinutes > 0 ? (
          <WeekPracticeCard bars={weekBars} totalMinutes={totalWeekMinutes} />
        ) : (
          <PlaceholderCard title={t.practiceTitle} message={t.practiceEmpty} />
        )}
      </div>

      <div
        className="section-enter mt-4"
        style={{ "--enter-i": 3 } as React.CSSProperties}
      >
        <AchievementsCard recent={recentAchievements} />
      </div>
    </>
  );
}

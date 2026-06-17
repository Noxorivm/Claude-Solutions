import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { achievements, userAchievements } from "@/db/schema";

export interface ShowcaseAchievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  earnedAt: Date | null;
}

export async function getAchievementShowcase(
  userId: string,
): Promise<ShowcaseAchievement[]> {
  const rows = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      earnedAt: userAchievements.earnedAt,
    })
    .from(achievements)
    .leftJoin(
      userAchievements,
      and(
        eq(userAchievements.achievementId, achievements.id),
        eq(userAchievements.userId, userId),
      ),
    );

  return rows.sort((a, b) => {
    if (a.earnedAt && b.earnedAt) {
      return b.earnedAt.getTime() - a.earnedAt.getTime();
    }
    if (a.earnedAt) return -1;
    if (b.earnedAt) return 1;
    return a.name.localeCompare(b.name, "es");
  });
}

export interface RecentAchievement {
  slug: string;
  name: string;
  icon: string | null;
  earnedAt: Date;
}

export async function getRecentAchievements(
  userId: string,
  limit: number,
): Promise<RecentAchievement[]> {
  return db
    .select({
      slug: achievements.slug,
      name: achievements.name,
      icon: achievements.icon,
      earnedAt: userAchievements.earnedAt,
    })
    .from(userAchievements)
    .innerJoin(
      achievements,
      eq(userAchievements.achievementId, achievements.id),
    )
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.earnedAt))
    .limit(limit);
}

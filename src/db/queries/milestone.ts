import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { milestoneSubmissions } from "@/db/schema";

export interface MilestoneSubmissionRow {
  id: string;
  createdAt: Date;
  ratings: Record<string, number>;
  reflection: string | null;
}

function parseRatings(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "number") {
      result[key] = raw;
    }
  }
  return result;
}

export async function getMilestoneSubmissions(
  lessonId: string,
  userId: string,
): Promise<MilestoneSubmissionRow[]> {
  const rows = await db
    .select({
      id: milestoneSubmissions.id,
      createdAt: milestoneSubmissions.createdAt,
      ratings: milestoneSubmissions.ratings,
      reflection: milestoneSubmissions.reflection,
    })
    .from(milestoneSubmissions)
    .where(
      and(
        eq(milestoneSubmissions.lessonId, lessonId),
        eq(milestoneSubmissions.userId, userId),
      ),
    )
    .orderBy(desc(milestoneSubmissions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    ratings: parseRatings(row.ratings),
    reflection: row.reflection,
  }));
}

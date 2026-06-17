"use client";

import { toast } from "sonner";

import type { AchievementGrant } from "@/lib/achievements";
import { strings } from "@/lib/strings";

/** Un toast por logro recién otorgado, tras el toast principal. */
export function showAchievementToasts(
  grants: AchievementGrant[] | undefined,
): void {
  for (const grant of grants ?? []) {
    toast(strings.achievements.toast(grant.name));
  }
}

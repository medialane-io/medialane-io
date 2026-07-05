"use client";

import Link from "next/link";
import { LevelBadge, BadgeShelf } from "@medialane/ui";
import { useRewards } from "@/hooks/use-rewards";

interface CreatorScoreInlineProps {
  address: string | null | undefined;
  size?: "sm" | "md" | "lg";
  /** Also show the earned badges under the chip (creator/profile pages). */
  showBadges?: boolean;
  /** Max badges when showBadges is set. */
  maxBadges?: number;
  className?: string;
}

/** Level chip (+ optional badge row) for an address, linking to /rewards.
 *  Renders nothing while loading, on failure, or for addresses with no XP —
 *  rewards must never add error states or noise to non-rewards pages. */
export function CreatorScoreInline({ address, size = "sm", showBadges = false, maxBadges = 6, className }: CreatorScoreInlineProps) {
  const { data } = useRewards(address);
  if (!data || data.totalXp <= 0) return null;

  return (
    <div className={className}>
      <Link href="/rewards" className="inline-flex active:opacity-80">
        <LevelBadge level={data.currentLevel} name={data.currentLevelName} badgeColor={data.badgeColor} size={size} />
      </Link>
      {showBadges && data.badges.length > 0 && (
        <BadgeShelf badges={data.badges.slice(0, maxBadges)} className="mt-2" />
      )}
    </div>
  );
}

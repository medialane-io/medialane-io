"use client";

import { ShieldCheck } from "lucide-react";
import { LevelBadge, LevelLadder } from "@medialane/ui";
import { useRewardsConfig } from "@/hooks/use-rewards";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Gamified header for /connect's email step. Reads the real, public rewards
 * config (works before sign-up — no auth required) and previews the actual
 * level progression, framing sign-up as the start of a creator's journey.
 * Purely decorative: on any failure to load real data it falls back to a
 * plain icon rather than block or visually break the email form beneath it.
 */
export function JourneyPanel() {
  const { data: config, isLoading } = useRewardsConfig();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-14 w-full max-w-[280px] rounded-lg" />
      </div>
    );
  }

  const firstLevel = config?.levels?.[0];
  if (!firstLevel) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-6 w-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <LevelBadge level={firstLevel.level} name={firstLevel.name} badgeColor={firstLevel.badgeColor} size="md" />
      <p className="text-xs text-muted-foreground">Every creator starts here.</p>
      <LevelLadder levels={config.levels} currentLevel={firstLevel.level} className="w-full max-w-[280px]" />
    </div>
  );
}

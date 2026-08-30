"use client";

import type React from "react";
import Link from "next/link";
import { ArrowUpRight, Gem, LayoutGrid, Tag, Trophy } from "lucide-react";
import { LevelBadge } from "@medialane/ui";
import { useRewards } from "@/hooks/use-rewards";

function SnapshotStat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground/70">
        <Icon className="h-3 w-3" />
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function PortfolioSnapshot({ assets, listings, collections }: { assets: number; listings: number; collections: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Portfolio</p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">What you own on Medialane</p>
      </div>
      <div className="flex items-center border-t border-border/60 pt-4">
        <SnapshotStat icon={Gem} value={assets} label="Assets" />
        <SnapshotStat icon={Tag} value={listings} label="Listed" />
        <SnapshotStat icon={LayoutGrid} value={collections} label="Collections" />
      </div>
      <Link
        href="/portfolio"
        className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View portfolio
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function RewardsSnapshot({ address }: { address?: string | null }) {
  const { data: rewards } = useRewards(address);
  if (!rewards) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rewards</p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">Your creator journey</p>
        </div>
        <Trophy className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="border-t border-border/60 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} />
          <span className="text-xs tabular-nums text-muted-foreground">{rewards.totalXp.toLocaleString()} XP</span>
        </div>
        <div className="h-2 rounded-full bg-muted-foreground/15 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${rewards.progressPct}%`, backgroundColor: rewards.badgeColor }}
          />
        </div>
        {rewards.nextLevel && (
          <p className="text-[10.5px] text-muted-foreground">
            {rewards.nextLevel.xpRequired - rewards.totalXp} XP to Lv.{rewards.nextLevel.level} {rewards.nextLevel.name}
          </p>
        )}
      </div>
      <Link
        href="/rewards"
        className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View rewards
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

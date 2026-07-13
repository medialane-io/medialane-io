"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, RefreshCw, Sparkles, Zap, Palette, ShoppingBag, MessageSquare } from "lucide-react";
import { useActivities } from "@/hooks/use-activities";
import { useRewardsBatch } from "@/hooks/use-rewards";
import { useWallet } from "@/hooks/use-wallet";
import { ActivityRow } from "@/components/shared/activity-row";
import { LeaderboardPanel } from "@/components/rewards/leaderboard-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, cn } from "@/lib/utils";

const FEED_LIMIT = 8;

function ColumnHeader({
  icon,
  iconBg,
  title,
  caption,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  caption?: React.ReactNode;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shadow-md shrink-0", iconBg)}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold leading-none">{title}</h2>
          {caption && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">{caption}</p>}
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
      >
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function CommunitySection() {
  const { activities, isLoading } = useActivities({ limit: FEED_LIMIT });
  const { address } = useWallet();
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (!isLoading) setLastUpdated(new Date().toISOString());
  }, [activities, isLoading]);

  const actors = useMemo(
    () =>
      activities
        .map((a) => a.offerer ?? a.fulfiller ?? (a.type === "mint" ? a.to : a.from))
        .filter((a): a is string => Boolean(a)),
    [activities],
  );
  const { data: actorLevels } = useRewardsBatch(actors);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Left — recent on-chain activity */}
      <div className="lg:col-span-7 space-y-4 sm:space-y-5">
        <ColumnHeader
          icon={<Activity className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-gradient-to-br from-brand-indigo to-brand-blue shadow-brand-indigo/20"
          title="Activities"
          caption={
            !isLoading && (
              <>
                <RefreshCw className="h-2.5 w-2.5" />
                Updated {timeAgo(lastUpdated)}
              </>
            )
          }
          href="/activities"
          linkLabel="View all"
        />
        <div>
          {isLoading ? (
            <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <Skeleton className="h-9 w-9 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className={cn("rounded-xl border border-border py-12 text-center")}>
              <p className="text-sm text-muted-foreground">No activity yet. Be the first to trade on Medialane!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
              {activities.map((activity, i) => {
                const actor = activity.offerer ?? activity.fulfiller ?? (activity.type === "mint" ? activity.to : activity.from);
                return (
                  <ActivityRow
                    key={activity.txHash ? `${activity.txHash}-${activity.type}-${activity.nftTokenId ?? ""}` : `activity-${i}`}
                    activity={activity}
                    showActor
                    showExplorer
                    actorLevel={actor ? actorLevels?.get(actor) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right — Rewards scoreboard */}
      <div className="lg:col-span-5 space-y-4 sm:space-y-5">
        <ColumnHeader
          icon={<Sparkles className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-gradient-to-br from-brand-rose to-brand-orange"
          title="Rewards"
          href="/rewards"
          linkLabel="Scoreboard"
        />

        {/* Compact pitch */}
        <div className="relative rounded-xl border border-border/40 bg-card overflow-hidden px-4 py-4 space-y-3">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-rose to-brand-orange" />
          <p className="text-sm font-semibold leading-snug">
            Earn XP. Share the Creator&apos;s Fund.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {([
              [Zap, "Mint"], [Palette, "Create"],
              [ShoppingBag, "Trade"], [MessageSquare, "Engage"],
            ] as const).map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Icon className="h-2.5 w-2.5" />
                {label}
              </div>
            ))}
          </div>
          <Link
            href="/rewards"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-rose to-brand-orange rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            Start earning XP <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <LeaderboardPanel myAddress={address} limit={8} showHeading={false} />
      </div>
    </section>
  );
}

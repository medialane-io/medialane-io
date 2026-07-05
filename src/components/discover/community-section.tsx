"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, RefreshCw, Trophy } from "lucide-react";
import { useActivities } from "@/hooks/use-activities";
import { useRewardsBatch } from "@/hooks/use-rewards";
import { useWallet } from "@/hooks/use-wallet";
import { ActivityRow } from "@/components/shared/activity-row";
import { LeaderboardPanel } from "@/components/rewards/leaderboard-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, cn } from "@/lib/utils";

const FEED_LIMIT = 8;

/** A small header shared by both columns — icon chip + title (+ optional
 *  caption) on the left, a link on the right. Keeps the two panels reading
 *  as a paired "what's happening right now" dashboard rather than one panel
 *  with a caption and one without. */
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

/** Discover page's Community section — replaced the old horizontal
 *  activity-card carousel with the /activities page's list language
 *  (ActivityRow) on the left and the Rewards scoreboard on the right, each
 *  with its own "Activities" / "Rewards" header, so the pairing reads as two
 *  distinct, titled panels. Ported from medialane-starknet (2026-07-05). */
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
      {/* Left — recent on-chain activity, /activities-page list language */}
      <div className="lg:col-span-7 space-y-4 sm:space-y-5">
        <ColumnHeader
          icon={<Activity className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20"
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
          icon={<Trophy className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
          title="Rewards"
          href="/rewards"
          linkLabel="Scoreboard"
        />
        <LeaderboardPanel myAddress={address} limit={8} showHeading={false} />
      </div>
    </section>
  );
}

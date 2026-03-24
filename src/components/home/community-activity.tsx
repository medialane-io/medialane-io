"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-activities";
import { ActivityRow } from "@/components/shared/activity-row";
import { timeAgo } from "@/lib/utils";

export function CommunityActivity() {
  const { activities, isLoading } = useActivities({ limit: 10 });
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  // Tick every 15s so the "updated X ago" label refreshes visually
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isLoading) setLastUpdated(new Date().toISOString());
  }, [activities, isLoading]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Icon with live pulse */}
          <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Activity className="h-4 w-4 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black leading-none">
              Market & Community
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <RefreshCw className="h-2.5 w-2.5" />
              Updated {timeAgo(lastUpdated)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/activities"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Activities <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="bento-cell overflow-hidden divide-y divide-border/40">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
              <Skeleton className="h-7 w-7 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-2.5 w-8" />
              </div>
              <Skeleton className="h-3 w-10 hidden sm:block" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Be the first to trade on Medialane!
            </p>
          </div>
        ) : (
          activities.map((act, i) => {
            const key = act.txHash
              ? `${act.txHash}-${act.type}-${act.nftTokenId ?? ""}`
              : `activity-${i}`;
            return (
              <ActivityRow
                key={key}
                activity={act}
                showActor
                showExplorer={false}
                compact
              />
            );
          })
        )}
      </div>
    </section>
  );
}

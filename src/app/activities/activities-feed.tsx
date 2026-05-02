"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useActivities } from "@/hooks/use-activities";
import type { ApiActivitiesQuery, ApiActivity } from "@medialane/sdk";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Megaphone, ArrowRight, Pin } from "lucide-react";
import { ACTIVITY_TYPE_CONFIG, TYPE_FILTERS } from "@/lib/activity";
import { ActivityRow } from "@/components/shared/activity-row";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/notification";

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements");
  if (!res.ok) return [];
  return res.json();
}

function AnnouncementsBanner({ announcements }: { announcements: Announcement[] }) {
  const pinned = announcements.filter((a) => a.pinned);
  if (pinned.length === 0) return null;
  return (
    <div className="space-y-2">
      {pinned.map((ann) => (
        <Link
          key={ann.id}
          href={ann.href}
          className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 hover:bg-purple-500/10 transition-colors group"
        >
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Megaphone className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Pin className="h-2.5 w-2.5 text-purple-400/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/60">Announcement</span>
            </div>
            <p className="text-sm font-semibold leading-snug">{ann.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{ann.body}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
        </Link>
      ))}
    </div>
  );
}

const PAGE_SIZE = 30;

export function ActivitiesFeed() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [allActivities, setAllActivities] = useState<ApiActivity[]>([]);
  const { data: announcements = [] } = useSWR<Announcement[]>(
    "announcements",
    fetchAnnouncements,
    { revalidateOnFocus: false }
  );

  const prevType = useRef(typeFilter);
  useEffect(() => {
    if (prevType.current !== typeFilter) {
      prevType.current = typeFilter;
      setPage(1);
      setAllActivities([]);
    }
  }, [typeFilter]);

  const { activities, meta, isLoading } = useActivities({
    limit: PAGE_SIZE,
    page,
    type: (typeFilter as ApiActivitiesQuery["type"]) || undefined,
  });

  useEffect(() => {
    if (isLoading) return;
    if (page === 1) {
      setAllActivities(activities);
    } else {
      setAllActivities((prev) => {
        const existing = new Set(
          prev.map((a) => `${a.txHash}-${a.type}-${a.nftTokenId ?? ""}`)
        );
        const newItems = activities.filter(
          (a) => !existing.has(`${a.txHash}-${a.type}-${a.nftTokenId ?? ""}`)
        );
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    }
  }, [activities, isLoading, page]);

  const isInitialLoading = isLoading && allActivities.length === 0;
  const isLoadingMore = isLoading && allActivities.length > 0;
  const hasMore = meta?.total != null ? allActivities.length < meta.total : false;
  const total = meta?.total ?? null;

  return (
    <div className="space-y-5">
      <AnnouncementsBanner announcements={announcements} />

      {/* Live stats bar */}
      {total != null && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground tabular-nums">
              {total.toLocaleString()}
            </span>
            {typeFilter ? `${typeFilter} events` : "total events"}
          </span>
          {typeFilter && allActivities.length > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{allActivities.length.toLocaleString()} loaded</span>
            </>
          )}
        </div>
      )}

      {/* Type filter chips with icons */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const typeConfig = f.value ? ACTIVITY_TYPE_CONFIG[f.value] : null;
          const Icon = typeConfig?.icon;
          const isActive = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-3 w-3",
                    isActive ? typeConfig?.colorClass : ""
                  )}
                />
              )}
              {f.label}
            </button>
          );
        })}
      </div>

      {isInitialLoading ? (
        <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-card">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
                <Skeleton className="h-2.5 w-12 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      ) : allActivities.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {typeFilter ? `No ${typeFilter} events yet.` : "No activity yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
            {allActivities.map((activity, i) => (
              <ActivityRow
                key={`${activity.txHash}-${activity.type}-${activity.nftTokenId ?? i}`}
                activity={activity}
                showActor
                showExplorer
              />
            ))}
          </div>

          {(hasMore || isLoadingMore) && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={isLoadingMore}
                onClick={() => setPage((p) => p + 1)}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading…
                  </>
                ) : (
                  `Load more${
                    meta?.total
                      ? ` (${meta.total - allActivities.length} remaining)`
                      : ""
                  }`
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

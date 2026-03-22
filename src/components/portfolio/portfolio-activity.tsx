"use client";

import { useState, useMemo } from "react";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { Activity } from "lucide-react";
import { ACTIVITY_TYPE_CONFIG, TYPE_FILTERS } from "@/lib/activity";
import { ActivityRow } from "@/components/shared/activity-row";
import { cn } from "@/lib/utils";

export function PortfolioActivity({ address }: { address: string | null }) {
  const { activities, isLoading, error, mutate } = useActivitiesByAddress(address);
  const [typeFilter, setTypeFilter] = useState("");

  const displayed = typeFilter
    ? activities.filter((a) => a.type === typeFilter)
    : activities;

  // Per-type counts for the filter chip badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activities) {
      counts[a.type] = (counts[a.type] ?? 0) + 1;
    }
    return counts;
  }, [activities]);

  return (
    <div className="space-y-4">
      {/* Filter chips with icons + per-type counts */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const typeConfig = f.value ? ACTIVITY_TYPE_CONFIG[f.value] : null;
          const Icon = typeConfig?.icon;
          const count = f.value ? typeCounts[f.value] : activities.length;
          const isActive = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-3 w-3",
                    isActive ? "text-primary-foreground" : typeConfig?.colorClass
                  )}
                />
              )}
              {f.label}
              {!isLoading && count != null && count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold tabular-nums",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground/60"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={displayed.length === 0}
        onRetry={mutate}
        emptyTitle={typeFilter ? `No ${typeFilter} events yet` : "No activity yet"}
        emptyDescription="Start by listing or buying an asset on the marketplace."
        emptyCta={{ label: "Browse marketplace", href: "/marketplace" }}
        emptyIcon={<Activity className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={8}
      >
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/50">
          {displayed.map((activity, i) => (
            <ActivityRow
              key={`${activity.txHash}-${activity.type}-${i}`}
              activity={activity}
              showActor={false}
              showExplorer
            />
          ))}
        </div>
      </EmptyOrError>
    </div>
  );
}

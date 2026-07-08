"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { useLeaderboard } from "@/hooks/use-rewards";
import { cn } from "@/lib/utils";

export interface LeaderboardPanelProps {
  myAddress?: string | null;
  limit?: number;
  showHeading?: boolean;
  viewAllHref?: string;
  className?: string;
}

export function LeaderboardPanel({
  myAddress,
  limit = 20,
  showHeading = true,
  viewAllHref,
  className,
}: LeaderboardPanelProps) {
  const { data, isLoading } = useLeaderboard(1, limit);
  const rows = data?.data ?? [];

  return (
    <div className={cn("space-y-3", className)}>
      {showHeading && (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-rose to-brand-orange text-white shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-black">Community Rewards</h2>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Nobody&apos;s earned points yet — be the first.
        </p>
      ) : (
        <div className="space-y-1">
          {rows.map((entry) => {
            const isMe = myAddress?.toLowerCase() === entry.address.toLowerCase();
            return (
              <Link
                key={entry.address}
                href={`/account/${entry.address}`}
                className={cn(
                  "group relative flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40",
                  isMe && "bg-muted/30"
                )}
              >
                {/* Rose→orange left accent */}
                <div className="absolute left-0 inset-y-2 w-[2px] rounded-full bg-gradient-to-b from-brand-rose to-brand-orange opacity-0 group-hover:opacity-100 transition-opacity" />

                <AddressDisplay
                  address={entry.address}
                  chars={4}
                  showCopy={false}
                  className={cn(
                    "text-xs font-medium transition-colors group-hover:text-foreground",
                    isMe ? "text-foreground" : "text-muted-foreground"
                  )}
                />

                <span className={cn(
                  "shrink-0 text-sm font-black tabular-nums",
                  isMe ? "text-foreground" : "text-foreground/80"
                )}>
                  {entry.totalXp.toLocaleString()}
                  <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">XP</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {viewAllHref && rows.length > 0 && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          View scoreboard →
        </Link>
      )}
    </div>
  );
}

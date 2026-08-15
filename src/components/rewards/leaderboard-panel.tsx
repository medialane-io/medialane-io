"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LeaderboardTable } from "@medialane/ui";
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
        <LeaderboardTable
          entries={rows}
          highlightAddress={myAddress}
          renderAddress={(address) => (
            <Link href={`/account/${address}`} className="hover:text-foreground transition-colors">
              <AddressDisplay address={address} chars={4} showCopy={false} className="text-base font-bold" />
            </Link>
          )}
        />
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

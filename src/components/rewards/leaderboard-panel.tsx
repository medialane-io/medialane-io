"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { LeaderboardTable } from "@medialane/ui";
import { useLeaderboard } from "@/hooks/use-rewards";
import { cn } from "@/lib/utils";

export interface LeaderboardPanelProps {
  myAddress?: string | null;
  /** Rows to fetch/show. Discover's sidebar uses a shorter list than /rewards. */
  limit?: number;
  /** Page heading — discover uses its own section header, so it can be hidden. */
  showHeading?: boolean;
  /** Link to the full scoreboard — shown when the list is truncated. */
  viewAllHref?: string;
  className?: string;
}

/** Shared "people taking part" scoreboard — built on @medialane/ui's
 *  LeaderboardTable (address/level/points row, no ranking) so /rewards and
 *  the discover page's Activities+Rewards section render identical rows,
 *  just at different depths. This is participation, not a competition —
 *  no position numbers, no podium colors. */
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
    <section className={cn("space-y-3 sm:space-y-4", className)}>
      {showHeading && (
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          People taking part
        </h2>
      )}

      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">Nobody&apos;s earned points yet — be the first.</p>
      ) : (
        <LeaderboardTable
          entries={rows}
          highlightAddress={myAddress?.toLowerCase() ?? null}
          renderAddress={(address) => (
            <Link href={`/account/${address}`} className="hover:text-primary transition-colors">
              <AddressDisplay address={address} chars={4} showCopy={false} />
            </Link>
          )}
        />
      )}

      {viewAllHref && rows.length > 0 && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View scoreboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </section>
  );
}

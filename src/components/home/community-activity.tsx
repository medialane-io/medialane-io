"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-activities";
import { AddressDisplay } from "@/components/shared/address-display";
import { timeAgo } from "@/lib/utils";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";

export function CommunityActivity() {
  const { activities, isLoading } = useActivities({ limit: 10 });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Community Activity</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/discover" className="flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="bento-cell divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-6">
            No activity yet. Be the first to trade on Medialane!
          </p>
        ) : (
          activities.map((act, i) => {
            // Use ACTIVITY_TYPE_CONFIG for consistent labels and badge variants
            const config =
              ACTIVITY_TYPE_CONFIG[act.type] ?? ACTIVITY_TYPE_CONFIG.transfer;
            // Correct ApiActivity field names: .from / .to (not fromAddress/toAddress)
            const actorAddress = act.from ?? act.to ?? null;
            const contract = act.nftContract ?? act.contractAddress ?? null;
            const tokenId = act.nftTokenId ?? act.tokenId ?? null;
            // Correct key field: act.txHash (not transactionHash)
            const key = act.txHash ? `${act.txHash}-${i}` : `activity-${i}`;

            return (
              <div
                key={key}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-sm"
              >
                <Badge
                  variant={config.variant}
                  className="shrink-0 text-[10px] font-semibold"
                >
                  {config.label}
                </Badge>

                {actorAddress ? (
                  <Link
                    href={`/creator/${actorAddress}`}
                    className="text-muted-foreground hover:text-primary transition-colors font-mono text-xs shrink-0"
                  >
                    <AddressDisplay address={actorAddress} />
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-xs shrink-0">—</span>
                )}

                {contract && tokenId ? (
                  <Link
                    href={`/asset/${contract}/${tokenId}`}
                    className="text-foreground hover:text-primary transition-colors truncate flex-1 font-medium font-mono text-xs"
                  >
                    {`${contract.slice(0, 8)}…#${tokenId}`}
                  </Link>
                ) : (
                  <span className="flex-1 text-muted-foreground text-xs">—</span>
                )}

                {/* act.timestamp is an ISO string — timeAgo(string) works directly */}
                <span className="text-muted-foreground text-xs shrink-0 hidden sm:block">
                  {timeAgo(act.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

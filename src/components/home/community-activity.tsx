"use client";

import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-activities";
import { useToken } from "@/hooks/use-tokens";
import { AddressDisplay } from "@/components/shared/address-display";
import { timeAgo, formatDisplayPrice } from "@/lib/utils";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import type { ApiActivity } from "@medialane/sdk";

function ActivityRow({ act }: { act: ApiActivity }) {
  const config = ACTIVITY_TYPE_CONFIG[act.type] ?? ACTIVITY_TYPE_CONFIG.transfer;
  const actorAddress = act.offerer ?? act.fulfiller ?? act.from ?? act.to ?? null;
  const contract = act.nftContract ?? act.contractAddress ?? null;
  const tokenId = act.nftTokenId ?? act.tokenId ?? null;

  const { token } = useToken(contract, tokenId);
  const tokenName = token?.metadata?.name ?? (tokenId ? `#${tokenId}` : "—");

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-sm">
      {/* Type badge */}
      <Badge
        variant={config.variant}
        className="shrink-0 text-[10px] font-bold tracking-wide"
      >
        {config.label}
      </Badge>

      {/* Actor */}
      {actorAddress ? (
        <Link
          href={`/creator/${actorAddress}`}
          className="text-muted-foreground hover:text-primary transition-colors font-mono text-xs shrink-0 hover:underline underline-offset-2"
        >
          <AddressDisplay address={actorAddress} />
        </Link>
      ) : (
        <span className="text-muted-foreground text-xs shrink-0">—</span>
      )}

      {/* Asset link */}
      {contract && tokenId ? (
        <Link
          href={`/asset/${contract}/${tokenId}`}
          className="text-foreground hover:text-primary transition-colors truncate flex-1 text-xs font-medium hover:underline underline-offset-2"
        >
          {tokenName}
        </Link>
      ) : (
        <span className="flex-1 text-muted-foreground text-xs">—</span>
      )}

      {/* Price (if any) */}
      {act.price?.formatted && (
        <span className="price-value text-xs shrink-0 hidden sm:block">
          {formatDisplayPrice(act.price.formatted)} {act.price.currency}
        </span>
      )}

      {/* Timestamp */}
      <span className="text-muted-foreground text-xs shrink-0 tabular-nums hidden sm:block">
        {timeAgo(act.timestamp)}
      </span>
    </div>
  );
}

export function CommunityActivity() {
  const { activities, isLoading } = useActivities({ limit: 10 });

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Community Activity</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activities" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="bento-cell overflow-hidden divide-y divide-border/60">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-5 w-14 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-14 shrink-0" />
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
            return <ActivityRow key={key} act={act} />;
          })
        )}
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useActivities } from "@/hooks/use-activities";
import type { ApiActivitiesQuery } from "@medialane/sdk";
import { useToken } from "@/hooks/use-tokens";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddressDisplay } from "@/components/shared/address-display";
import Link from "next/link";
import { EXPLORER_URL } from "@/lib/constants";
import { ExternalLink, Loader2 } from "lucide-react";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { timeAgo , formatDisplayPrice} from "@/lib/utils";
import type { ApiActivity } from "@medialane/sdk";

const PAGE_SIZE = 30;

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Sales", value: "sale" },
  { label: "Listings", value: "listing" },
  { label: "Offers", value: "offer" },
  { label: "Transfers", value: "transfer" },
  { label: "Cancelled", value: "cancelled" },
];

function ActivityRow({ activity }: { activity: ApiActivity }) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type] ?? {
    label: activity.type,
    variant: "outline" as const,
    icon: ExternalLink,
  };
  const Icon = config.icon;

  const contract = activity.nftContract ?? activity.contractAddress ?? null;
  const tokenId = activity.nftTokenId ?? activity.tokenId ?? null;
  const actor = activity.offerer ?? activity.fulfiller ?? activity.from ?? "";
  const txLink = activity.txHash ? `${EXPLORER_URL}/tx/${activity.txHash}` : null;

  const { token } = useToken(contract, tokenId);
  const tokenName = token?.metadata?.name ?? (tokenId ? `#${tokenId}` : null);

  return (
    <div className="flex items-center justify-between p-4 gap-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={config.variant} className="text-[10px] shrink-0">{config.label}</Badge>
            {contract && tokenId && (
              <Link
                href={`/asset/${contract}/${tokenId}`}
                className="text-sm font-semibold hover:underline truncate"
              >
                {tokenName}
              </Link>
            )}
          </div>
          {actor && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Link href={`/creator/${actor}`} className="hover:text-primary transition-colors">
                <AddressDisplay address={actor} chars={4} showCopy={false} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {activity.price?.formatted && (
          <div className="text-right">
            <p className="font-bold text-sm">
              {formatDisplayPrice(activity.price.formatted)} {activity.price.currency}
            </p>
          </div>
        )}
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground" title={new Date(activity.timestamp).toLocaleString()}>
            {timeAgo(activity.timestamp)}
          </p>
        </div>
        {txLink && (
          <a href={txLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

export function ActivitiesFeed() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [allActivities, setAllActivities] = useState<ApiActivity[]>([]);

  // Reset when type filter changes
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
    type: typeFilter as ApiActivitiesQuery["type"] || undefined,
  });

  // Accumulate pages
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

  return (
    <div className="space-y-4">
      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              typeFilter === f.value
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isInitialLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : allActivities.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {typeFilter ? `No ${typeFilter} events yet.` : "No activity yet."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-border rounded-lg border">
            {allActivities.map((activity, i) => (
              <ActivityRow
                key={`${activity.txHash}-${activity.type}-${activity.nftTokenId ?? i}`}
                activity={activity}
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
                  `Load more${meta ? ` (${meta.total - allActivities.length} remaining)` : ""}`
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

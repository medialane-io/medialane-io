"use client";

import { useState } from "react";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { Badge } from "@/components/ui/badge";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import Link from "next/link";
import { ExternalLink, Activity } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { timeAgo, formatDisplayPrice, cn } from "@/lib/utils";
import type { ApiActivity } from "@medialane/sdk";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Mints", value: "mint" },
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
  const txLink = activity.txHash ? `${EXPLORER_URL}/tx/${activity.txHash}` : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
      {/* Left: icon + badge */}
      <div className="flex items-center gap-2 shrink-0 w-32">
        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>
      </div>

      {/* Middle: asset link */}
      <div className="flex-1 min-w-0">
        {contract && tokenId ? (
          <Link
            href={`/asset/${contract}/${tokenId}`}
            className="text-sm hover:text-primary transition-colors truncate block font-medium"
          >
            #{tokenId}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      {/* Right: price + timestamp + explorer */}
      <div className="flex items-center gap-3 shrink-0">
        {activity.price?.formatted && (
          <span className="text-sm font-semibold tabular-nums">
            {formatDisplayPrice(activity.price.formatted)}{" "}
            <span className="text-xs text-muted-foreground font-normal">{activity.price.currency}</span>
          </span>
        )}
        <p
          className="text-xs text-muted-foreground hidden sm:block"
          title={new Date(activity.timestamp).toLocaleString()}
        >
          {timeAgo(activity.timestamp)}
        </p>
        {txLink && (
          <a
            href={txLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors"
            aria-label="View on explorer"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

export function PortfolioActivity({ address }: { address: string | null }) {
  const { activities, isLoading, error, mutate } = useActivitiesByAddress(address);
  const [typeFilter, setTypeFilter] = useState("");

  const displayed = typeFilter
    ? activities.filter((a) => a.type === typeFilter)
    : activities;

  return (
    <div className="space-y-4">
      {/* Type filter pill chips */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "text-xs px-3 py-1 rounded-full transition-colors",
              typeFilter === f.value
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
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
        <div className="rounded-lg border border-border overflow-hidden">
          {displayed.map((activity, i) => (
            <ActivityRow key={`${activity.txHash}-${activity.type}-${i}`} activity={activity} />
          ))}
        </div>
      </EmptyOrError>
    </div>
  );
}

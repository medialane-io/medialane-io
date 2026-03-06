"use client";

import { useState } from "react";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useToken } from "@/hooks/use-tokens";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/shared/address-display";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { timeAgo } from "@/lib/utils";
import type { ApiActivity } from "@medialane/sdk";

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
  const txLink = activity.txHash ? `${EXPLORER_URL}/tx/${activity.txHash}` : null;

  const { token } = useToken(contract, tokenId);
  const tokenName = token?.metadata?.name ?? (tokenId ? `#${tokenId}` : null);

  return (
    <div className="flex items-center justify-between p-4 gap-4">
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
          <p className="text-[10px] text-muted-foreground mt-0.5" title={new Date(activity.timestamp).toLocaleString()}>
            {timeAgo(activity.timestamp)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {activity.price?.formatted && (
          <span className="text-sm font-bold">
            {activity.price.formatted} {activity.price.currency}
          </span>
        )}
        {txLink && (
          <a href={txLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

export function PortfolioActivity({ address }: { address: string }) {
  const { activities, isLoading } = useActivitiesByAddress(address);
  const [typeFilter, setTypeFilter] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const displayed = typeFilter
    ? activities.filter((a) => a.type === typeFilter)
    : activities;

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

      {displayed.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {typeFilter ? `No ${typeFilter} events yet.` : "No activity yet."}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {displayed.map((activity, i) => (
            <ActivityRow key={`${activity.txHash}-${activity.type}-${i}`} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

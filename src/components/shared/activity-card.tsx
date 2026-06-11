"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { ACTIVITY_MESSAGES } from "@/components/shared/activity-row";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { ipfsToHttp, timeAgo, formatDisplayPrice, cn } from "@/lib/utils";
import type { ApiActivity } from "@medialane/sdk";

export function ActivityCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Card-shaped activity item for horizontal carousels (Discover Community strip).
 *  Same data as ActivityRow, presented like a collection/listing card. */
export function ActivityCard({ activity }: { activity: ApiActivity }) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type] ?? {
    label: activity.type,
    variant: "outline" as const,
    icon: ExternalLink,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  };
  const Icon = config.icon;

  const contract = activity.nftContract ?? activity.contractAddress ?? null;
  const tokenId = activity.nftTokenId ?? activity.tokenId ?? null;
  const actor =
    activity.offerer ??
    activity.fulfiller ??
    (activity.type === "mint" ? activity.to : activity.from) ??
    null;

  const tokenName = activity.token?.name ?? (tokenId ? `#${tokenId}` : "—");
  const rawImage = activity.token?.image ?? null;
  const tokenImage = rawImage ? ipfsToHttp(rawImage) : null;
  const amount = activity.amount && Number(activity.amount) > 1 ? activity.amount : null;

  const shortActor = actor
    ? actor.length > 10
      ? `${actor.slice(0, 6)}…${actor.slice(-4)}`
      : actor
    : null;
  const message = ACTIVITY_MESSAGES[activity.type]?.(shortActor) ?? config.label;

  const body = (
    <>
      <div className="aspect-square relative bg-muted">
        {tokenImage ? (
          <Image
            src={tokenImage}
            alt={tokenName}
            fill
            sizes="224px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5" aria-hidden />
        )}
        {/* Activity type chip */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-background/75 backdrop-blur-sm border border-border/40">
          <Icon className={cn("h-3 w-3", config.colorClass)} aria-hidden />
          {config.label}
        </span>
        {amount && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-500 text-white">
            ×{amount}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold truncate">{tokenName}</p>
        <p className="text-xs text-muted-foreground truncate">{message}</p>
        <div className="flex items-center justify-between pt-0.5 min-h-[20px]">
          {activity.price?.formatted ? (
            <span className="text-sm font-bold tabular-nums flex items-center gap-1">
              <CurrencyIcon symbol={activity.price.currency} size={12} aria-hidden />
              {formatDisplayPrice(activity.price.formatted)}
            </span>
          ) : (
            <span />
          )}
          <span
            className="text-[10px] text-muted-foreground tabular-nums"
            title={new Date(activity.timestamp).toLocaleString()}
          >
            {timeAgo(activity.timestamp)}
          </span>
        </div>
      </div>
    </>
  );

  const className =
    "block rounded-xl border border-border/50 bg-card dark:bg-white/[0.02] overflow-hidden hover:border-border active:scale-[0.99] transition-all";

  return contract && tokenId ? (
    <Link href={`/asset/${contract}/${tokenId}`} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

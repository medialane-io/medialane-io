"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AddressDisplay } from "@/components/shared/address-display";
import { useToken } from "@/hooks/use-tokens";
import { ipfsToHttp, timeAgo, formatDisplayPrice, cn } from "@/lib/utils";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiActivity } from "@medialane/sdk";

// Human-friendly sentence for each activity type.
const ACTIVITY_MESSAGES: Record<string, (actor: string | null) => string> = {
  mint:      (actor) => actor ? `Minted by ${actor}` : "Newly minted",
  listing:   (actor) => actor ? `Listed by ${actor}` : "Listed for sale",
  sale:      (actor) => actor ? `Purchased by ${actor}` : "Sold",
  offer:     (actor) => actor ? `Offer by ${actor}` : "Offer placed",
  transfer:  (actor) => actor ? `Transferred by ${actor}` : "Transferred",
  cancelled: (actor) => actor ? `Cancelled by ${actor}` : "Listing cancelled",
};

interface ActivityRowProps {
  activity: ApiActivity;
  showActor?: boolean;
  showExplorer?: boolean;
  /** Tighter vertical padding for compact widget contexts */
  compact?: boolean;
}

export function ActivityRow({
  activity,
  showActor = true,
  showExplorer = true,
  compact = false,
}: ActivityRowProps) {
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
    ((activity.type as string) === "mint" ? activity.to : activity.from) ??
    null;
  const txLink = activity.txHash ? `${EXPLORER_URL}/tx/${activity.txHash}` : null;

  const { token } = useToken(contract, tokenId);
  const tokenName = token?.metadata?.name ?? (tokenId ? `#${tokenId}` : "—");
  const tokenImage = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;

  const messageFn = ACTIVITY_MESSAGES[activity.type];
  const shortActor = actor
    ? actor.length > 10
      ? `${actor.slice(0, 6)}…${actor.slice(-4)}`
      : actor
    : null;
  const message = messageFn ? messageFn(showActor ? shortActor : null) : config.label;

  return (
    <div
      className={cn(
        "flex items-center gap-3 hover:bg-muted/30 transition-colors group",
        compact ? "pl-4 pr-5 py-2.5" : "pl-4 pr-5 py-3.5"
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          config.bgClass,
          compact ? "h-7 w-7" : "h-8 w-8"
        )}
        title={config.label}
        aria-label={config.label}
      >
        <Icon
          className={cn("shrink-0", config.colorClass, compact ? "h-3.5 w-3.5" : "h-4 w-4")}
          aria-hidden
        />
      </div>

      {/* Token thumbnail */}
      <div
        className={cn(
          "rounded-md overflow-hidden shrink-0 bg-muted",
          compact ? "h-7 w-7" : "h-9 w-9"
        )}
      >
        {tokenImage ? (
          <Image
            src={tokenImage}
            alt={tokenName}
            width={compact ? 28 : 36}
            height={compact ? 28 : 36}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5" aria-hidden />
        )}
      </div>

      {/* Content: asset name + friendly message */}
      <div className="flex-1 min-w-0">
        {contract && tokenId ? (
          <Link
            href={`/asset/${contract}/${tokenId}`}
            className="text-sm font-semibold hover:text-primary transition-colors truncate block leading-tight"
          >
            {tokenName}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">—</span>
        )}
        <p className="text-xs text-muted-foreground leading-tight truncate mt-0.5">
          {message}
          {showActor && actor && !messageFn && (
            <Link
              href={`/creator/${actor}`}
              className="hover:text-primary transition-colors font-mono ml-1"
            >
              <AddressDisplay address={actor} chars={4} showCopy={false} />
            </Link>
          )}
        </p>
      </div>

      {/* Right: price + time + explorer */}
      <div className="flex items-center gap-2.5 shrink-0">
        {activity.price?.formatted && (
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums leading-tight">
              {formatDisplayPrice(activity.price.formatted)}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight flex items-center justify-end gap-0.5">
              <CurrencyIcon symbol={activity.price.currency} size={10} aria-hidden />
              <span className="sr-only">{activity.price.currency}</span>
            </p>
          </div>
        )}

        <span
          className="text-[10px] text-muted-foreground tabular-nums hidden sm:block w-12 text-right"
          title={new Date(activity.timestamp).toLocaleString()}
        >
          {timeAgo(activity.timestamp)}
        </span>

        {showExplorer && txLink && (
          <a
            href={txLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            aria-label="View transaction on Voyager"
            title="View on Voyager"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { assetHref } from "@/lib/routes";
import { AddressDisplay } from "@/components/shared/address-display";
import { LevelBadge } from "@medialane/ui";
import { ipfsToHttp, timeAgo, formatDisplayPrice, cn } from "@/lib/utils";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiActivity, ApiRewardsBatchEntry } from "@medialane/sdk";

export const ACTIVITY_MESSAGES: Record<string, string> = {
  mint: "Newly minted",
  listing: "Listed for sale",
  sale: "Purchased",
  offer: "Offer placed",
  transfer: "Transferred",
  cancelled: "Listing cancelled",
};

interface ActivityRowProps {
  activity: ApiActivity;
  showActor?: boolean;
  showExplorer?: boolean;
  /** Tighter vertical padding for compact widget contexts */
  compact?: boolean;
  /** Pre-fetched via the /v1/rewards/batch endpoint by the parent list — never
   *  fetched per row. Renders a level chip next to the actor when present. */
  actorLevel?: ApiRewardsBatchEntry;
}

export function ActivityRow({
  activity,
  showActor = true,
  showExplorer = true,
  compact = false,
  actorLevel,
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
    (activity.type === "mint" ? activity.to : activity.from) ??
    null;
  const txLink = activity.txHash ? `${EXPLORER_URL}/tx/${activity.txHash}` : null;

  // Use batch-enriched token data — avoids per-row API calls
  const tokenName = activity.token?.name ?? (tokenId ? `#${tokenId}` : "—");
  const rawImage = activity.token?.image ?? null;
  const tokenImage = rawImage ? ipfsToHttp(rawImage) : null;

  const is1155 = activity.tokenStandard === "ERC1155" ||
    (activity.type === "mint" || activity.type === "transfer") && Number(activity.amount ?? "1") > 1;
  const amount = activity.amount && Number(activity.amount) > 1 ? activity.amount : null;

  const message = ACTIVITY_MESSAGES[activity.type] ?? config.label;

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
          "rounded-md overflow-hidden shrink-0 bg-muted relative",
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
          <div className="w-full h-full bg-gradient-to-br from-brand-purple/15 to-brand-blue/15" aria-hidden />
        )}
        {/* ERC-1155 badge */}
        {is1155 && (
          <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-brand-purple text-white rounded px-0.5 leading-tight">
            1155
          </span>
        )}
      </div>

      {/* Content: asset name + friendly message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 leading-tight">
          {contract && tokenId ? (
            <Link
              href={assetHref("STARKNET", contract, tokenId)}
              className="text-sm font-semibold hover:text-primary transition-colors truncate block"
            >
              {tokenName}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">—</span>
          )}
          {amount && (
            <span className="text-[10px] font-medium text-brand-purple shrink-0">
              ×{amount}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-tight truncate mt-0.5 flex items-center gap-1">
          <span className="truncate">{message}</span>
          {showActor && actor && (
            <>
              <Link
                href={`/creator/${actor}`}
                className="hover:text-primary transition-colors tabular-nums shrink-0"
              >
                <AddressDisplay address={actor} chars={4} showCopy={false} />
              </Link>
              {actorLevel && actorLevel.totalXp > 0 && (
                <LevelBadge
                  level={actorLevel.currentLevel}
                  name={actorLevel.currentLevelName}
                  badgeColor={actorLevel.badgeColor}
                  size="sm"
                  className="shrink-0"
                />
              )}
            </>
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
            className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors opacity-50 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
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

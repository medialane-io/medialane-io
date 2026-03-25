"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/shared/address-display";
import { useToken } from "@/hooks/use-tokens";
import { ipfsToHttp, timeAgo, formatDisplayPrice, cn } from "@/lib/utils";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiActivity } from "@medialane/sdk";

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

  return (
    <div
      className={cn(
        "flex items-center gap-3 hover:bg-muted/30 transition-colors group",
        compact ? "pl-4 pr-5 py-2.5" : "pl-4 pr-5 py-3.5"
      )}
    >
      {/* Type icon with color-coded background */}
      <div
        className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          config.bgClass,
          compact ? "h-7 w-7" : "h-8 w-8"
        )}
      >
        <Icon
          className={cn(
            "shrink-0",
            config.colorClass,
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          )}
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
          <div className="w-full h-full bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5" />
        )}
      </div>

      {/* Content: asset name + actor */}
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
        {showActor && actor && (
          <Link
            href={`/creator/${actor}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono leading-tight"
          >
            <AddressDisplay address={actor} chars={4} showCopy={false} />
          </Link>
        )}
      </div>

      {/* Right: badge + price + time + explorer */}
      <div className="flex items-center gap-2.5 shrink-0">
        {!compact && (
          <Badge
            variant={config.variant}
            className="text-[10px] hidden sm:flex shrink-0"
          >
            {config.label}
          </Badge>
        )}

        {activity.price?.formatted && (
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums leading-tight">
              {formatDisplayPrice(activity.price.formatted)}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight flex items-center justify-end gap-0.5">
              <CurrencyIcon symbol={activity.price.currency} size={10} />
              {activity.price.currency}
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
            aria-label="View on Voyager"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { AssetPreviewDialog } from "@/components/shared/asset-preview-dialog";
import { cn, ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { RarityTier } from "@/lib/rarity";
import type { ApiToken, CollectionSource } from "@medialane/sdk";

const RARITY_STYLE: Record<RarityTier, { label: string; className: string } | null> = {
  legendary: { label: "Legendary", className: "bg-yellow-400/90 text-yellow-900" },
  epic:      { label: "Epic",      className: "bg-purple-500/85 text-white" },
  rare:      { label: "Rare",      className: "bg-blue-500/85 text-white" },
  uncommon:  { label: "Uncommon",  className: "bg-emerald-500/85 text-white" },
  common:    null,
};

interface TokenCardProps {
  token: ApiToken;
  serviceSource?: CollectionSource | string;
  isOwner?: boolean;
  rarityTier?: RarityTier;
  onList?: (token: ApiToken) => void;
  onCancel?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
}

export function TokenCard({
  token,
  serviceSource,
  isOwner = false,
  rarityTier,
  onList,
  onCancel,
  onTransfer,
}: TokenCardProps) {
  const [imgError, setImgError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const activeOrder = token.activeOrders?.[0];

  return (
    <>
      <button
        type="button"
        className="card-base relative overflow-hidden flex flex-col text-left w-full cursor-pointer"
        onClick={() => setPreviewOpen(true)}
      >
        {/* ── Image ───────────────────────────────────────────────── */}
        <div className="relative aspect-square bg-muted overflow-hidden shrink-0">
          {!imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
              <span className="text-2xl font-mono text-muted-foreground">#{token.tokenId}</span>
            </div>
          )}

          {token.metadata?.ipType && (
            <div className="absolute top-2 left-2">
              <IpTypeBadge ipType={token.metadata.ipType} size="sm" />
            </div>
          )}

          {rarityTier && RARITY_STYLE[rarityTier] && (
            <div className="absolute top-2 right-2 z-10">
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md backdrop-blur-sm text-[10px] font-bold leading-none",
                RARITY_STYLE[rarityTier]!.className
              )}>
                {RARITY_STYLE[rarityTier]!.label}
              </span>
            </div>
          )}

          {(token.metadataStatus === "PENDING" || token.metadataStatus === "FETCHING") && (
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm py-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-white/70" />
              <span className="text-[10px] text-white/70">Indexing…</span>
            </div>
          )}
        </div>

        {/* ── Info ────────────────────────────────────────────────── */}
        <div className="px-3 pt-2.5 pb-3 flex-1">
          <p className="text-xl font-bold line-clamp-2 leading-tight">{name}</p>
          {activeOrder && (
            <p className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80 mt-0.5">
              <CurrencyIcon symbol={activeOrder.price.currency ?? ""} size={11} />
              {formatDisplayPrice(activeOrder.price.formatted)}
              <span className="font-normal text-muted-foreground">{activeOrder.price.currency}</span>
            </p>
          )}
          {token.metadata?.description ? (
            <p className="text-[10px] text-muted-foreground truncate leading-snug mt-0.5">
              {token.metadata.description}
            </p>
          ) : token.metadata?.ipType ? (
            <p className="text-[10px] text-muted-foreground opacity-70 mt-0.5">
              {token.metadata.ipType}
            </p>
          ) : null}
        </div>
      </button>

      <AssetPreviewDialog
        token={token}
        serviceSource={serviceSource}
        isOwner={isOwner}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onList={onList}
        onCancel={onCancel}
        onTransfer={onTransfer}
      />
    </>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="card-base overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="px-3 pt-2.5 pb-3 space-y-1.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
    </div>
  );
}

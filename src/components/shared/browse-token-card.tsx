"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { assetHref as buildAssetHref } from "@/lib/routes";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { ApiToken } from "@medialane/sdk";

/**
 * Lightweight asset card for browse grids (e.g. /[ipType]).
 * Intentionally minimal: a single <Link> tap target, no action row,
 * no dropdown/dialog/router — just image → name → price. This keeps the
 * grid fast when many cards accumulate. Owner actions live on the richer
 * shared <TokenCard> used by the portfolio.
 */
export function BrowseTokenCard({ token }: { token: ApiToken }) {
  const [imgError, setImgError] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);

  // First listing-type active order (offer.itemType = ERC721 or ERC1155)
  const listingOrder = token.activeOrders?.find(
    (o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155"
  );

  const assetHref = buildAssetHref("STARKNET", token.contractAddress, token.tokenId);
  const isIndexing =
    token.metadataStatus === "PENDING" || token.metadataStatus === "FETCHING";

  return (
    <Link
      href={assetHref}
      className="card-base group relative flex flex-col w-full transition-colors hover:border-foreground/20"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {!imgError ? (
          <Image
            src={image}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
            <span className="text-2xl font-mono text-muted-foreground">#{token.tokenId}</span>
          </div>
        )}

        {/* Indexing indicator */}
        {isIndexing && (
          <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm py-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-white/70" />
            <span className="text-[10px] text-white/70">Indexing…</span>
          </div>
        )}
      </div>

      {/* Info — name left, price right */}
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-bold line-clamp-1 leading-snug">{name}</p>
        {listingOrder && (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold leading-none">
            <CurrencyIcon symbol={listingOrder.price.currency ?? ""} size={12} />
            {formatDisplayPrice(listingOrder.price.formatted)}
          </span>
        )}
      </div>
    </Link>
  );
}

export function BrowseTokenCardSkeleton() {
  return (
    <div className="card-base flex flex-col w-full">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="px-3 py-3 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  );
}

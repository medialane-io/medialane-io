"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionCard } from "@/components/ui/motion-primitives";
import { ShoppingCart, Tag, ArrowRightLeft, X, Loader2, HandCoins, GitBranch } from "lucide-react";
import { cn, ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import type { RarityTier } from "@/lib/rarity";
import type { ApiToken } from "@medialane/sdk";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";

const RARITY_STYLE: Record<RarityTier, { label: string; className: string } | null> = {
  legendary: { label: "Legendary", className: "bg-yellow-400/90 text-yellow-900" },
  epic:      { label: "Epic",      className: "bg-purple-500/85 text-white" },
  rare:      { label: "Rare",      className: "bg-blue-500/85 text-white" },
  uncommon:  { label: "Uncommon",  className: "bg-emerald-500/85 text-white" },
  common:    null,
};

interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
  onCancel?: (token: ApiToken) => void;
  /** Discovery pages: open an offer dialog */
  onOffer?: (token: ApiToken) => void;
  /** Discovery pages: navigate to remix creation */
  onRemix?: (token: ApiToken) => void;
  isOwner?: boolean;
  rarityTier?: RarityTier;
}

export function TokenCard({
  token,
  showBuyButton = true,
  onBuy,
  onList,
  onTransfer,
  onCancel,
  onOffer,
  onRemix,
  isOwner = false,
  rarityTier,
}: TokenCardProps) {
  const { addItem, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const activeOrder = token.activeOrders?.[0];
  const inCart = activeOrder ? items.some((i) => i.orderHash === activeOrder.orderHash) : false;

  const hasActions =
    (isOwner && (onList || onTransfer || onCancel)) ||
    (!isOwner && activeOrder && (showBuyButton || true)) ||
    (!isOwner && (onOffer || onRemix));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeOrder || inCart) return;
    addItem({
      orderHash: activeOrder.orderHash,
      nftContract: token.contractAddress,
      nftTokenId: token.tokenId,
      name,
      image,
      price: formatDisplayPrice(activeOrder.price.formatted),
      currency: activeOrder.price.currency ?? "",
      currencyDecimals: activeOrder.price.decimals,
      offerer: activeOrder.offerer ?? "",
      considerationToken: activeOrder.consideration.token ?? "",
      considerationAmount: activeOrder.consideration.startAmount ?? "",
    });
  };

  return (
    <MotionCard className="card-base group relative">
      <Link href={`/asset/${token.contractAddress}/${token.tokenId}`} className="block relative">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {!imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
          {(token.metadataStatus === "PENDING" || token.metadataStatus === "FETCHING") && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/85 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Indexing…</span>
            </div>
          )}
          {/* Rarity tier badge */}
          {rarityTier && !isOwner && RARITY_STYLE[rarityTier] && (
            <div className="absolute top-2 right-2 z-10">
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md backdrop-blur-sm text-[10px] font-bold leading-none",
                RARITY_STYLE[rarityTier]!.className
              )}>
                {RARITY_STYLE[rarityTier]!.label}
              </span>
            </div>
          )}
          {/* Listed badge — shows price + currency */}
          {isOwner && activeOrder && (
            <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary backdrop-blur-sm leading-4">
              {formatDisplayPrice(activeOrder.price.formatted)} {activeOrder.price.currency}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <p className="font-semibold text-sm truncate leading-snug">{name}</p>
          {token.metadata?.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
              {token.metadata.description}
            </p>
          )}
          {activeOrder && !isOwner && (
            <p className="text-sm font-medium pt-0.5">
              {formatDisplayPrice(activeOrder.price.formatted)}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                {activeOrder.price.currency}
              </span>
            </p>
          )}
        </div>
      </Link>

      {/* Action bar — always visible, normal flow (works on mobile) */}
      {hasActions && (
        <div className="px-2 pb-2 flex gap-2 border-t border-border/40">
          {isOwner && activeOrder && (
            <>
              {onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(token); }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              )}
              {onTransfer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTransfer(token); }}
                  aria-label="Transfer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          {isOwner && !activeOrder && (
            <>
              {onList && (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onList(token); }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  List for sale
                </Button>
              )}
              {onTransfer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTransfer(token); }}
                  aria-label="Transfer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          {!isOwner && activeOrder && !onOffer && !onRemix && (
            <>
              {showBuyButton && onBuy && (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-brand-purple text-white"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuy(token); }}
                >
                  Buy
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleAddToCart}
                disabled={inCart}
                aria-label={inCart ? "In cart" : "Add to cart"}
              >
                <ShoppingCart className={cn("h-3.5 w-3.5", inCart && "opacity-40")} />
              </Button>
            </>
          )}
          {!isOwner && (onOffer || onRemix) && (
            <>
              {onOffer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOffer(token); }}
                >
                  <HandCoins className="h-3 w-3 mr-1" />
                  Offer
                </Button>
              )}
              {onRemix && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-brand-rose/40 text-brand-rose hover:bg-brand-rose/10"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemix(token); }}
                >
                  <GitBranch className="h-3 w-3 mr-1" />
                  Remix
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </MotionCard>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="card-base">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2.5">
        <div className="space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

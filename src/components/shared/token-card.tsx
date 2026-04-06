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

  const showDiscoveryActions = !isOwner && (onOffer || onRemix);
  const showBuyActions = !isOwner && activeOrder && !onOffer && !onRemix && (showBuyButton || true);
  const showOwnerActions = isOwner && (onList || onTransfer || onCancel);

  return (
    <MotionCard className="card-base group relative overflow-hidden">
      <Link href={`/asset/${token.contractAddress}/${token.tokenId}`} className="block relative">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {!imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
              <span className="text-2xl font-mono text-muted-foreground">#{token.tokenId}</span>
            </div>
          )}

          {/* IP type badge — top left */}
          {token.metadata?.ipType && (
            <div className="absolute top-2 left-2">
              <IpTypeBadge ipType={token.metadata.ipType} size="sm" />
            </div>
          )}

          {/* Rarity badge — top right */}
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

          {/* Price pill — top right (non-owner listed) */}
          {activeOrder && !isOwner && !rarityTier && (
            <div className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
              <span className="text-[11px] font-bold text-white leading-none">
                {formatDisplayPrice(activeOrder.price.formatted)}{" "}
                <span className="text-white/60 font-normal">{activeOrder.price.currency}</span>
              </span>
            </div>
          )}

          {/* Owner listed badge */}
          {isOwner && activeOrder && (
            <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary backdrop-blur-sm leading-4 border border-primary/20">
              {formatDisplayPrice(activeOrder.price.formatted)} {activeOrder.price.currency}
            </span>
          )}

          {/* Indexing indicator */}
          {(token.metadataStatus === "PENDING" || token.metadataStatus === "FETCHING") && (
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm py-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-white/70" />
              <span className="text-[10px] text-white/70">Indexing…</span>
            </div>
          )}

          {/* Bottom gradient + name overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-10 pb-2.5 px-3 pointer-events-none">
            <p className="text-[13px] font-semibold text-white truncate leading-snug drop-shadow-sm">
              {name}
            </p>
          </div>
        </div>
      </Link>

      {/* Discovery actions: Offer + Remix */}
      {showDiscoveryActions && (
        <div className="px-2 pt-1.5 pb-2 flex gap-1.5">
          {onOffer && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs gap-1 border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 hover:border-brand-purple/60"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOffer(token); }}
            >
              <HandCoins className="h-3 w-3" />
              Offer
            </Button>
          )}
          {onRemix && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs gap-1 border-brand-rose/40 text-brand-rose hover:bg-brand-rose/10 hover:border-brand-rose/60"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemix(token); }}
            >
              <GitBranch className="h-3 w-3" />
              Remix
            </Button>
          )}
        </div>
      )}

      {/* Buy actions */}
      {showBuyActions && (
        <div className="px-2 pt-1.5 pb-2 flex gap-1.5">
          {showBuyButton && onBuy && (
            <Button
              size="sm"
              className="flex-1 h-7 text-xs bg-brand-purple text-white hover:brightness-110"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuy(token); }}
            >
              Buy
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 shrink-0"
            onClick={handleAddToCart}
            disabled={inCart}
            aria-label={inCart ? "In cart" : "Add to cart"}
          >
            <ShoppingCart className={cn("h-3 w-3", inCart && "opacity-40")} />
          </Button>
        </div>
      )}

      {/* Owner actions */}
      {showOwnerActions && (
        <div className="px-2 pt-1.5 pb-2 flex gap-1.5">
          {isOwner && activeOrder && onCancel && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(token); }}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
          {isOwner && !activeOrder && onList && (
            <Button
              size="sm"
              className="flex-1 h-7 text-xs"
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
              className="h-7 w-7 p-0 shrink-0"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTransfer(token); }}
              aria-label="Transfer"
            >
              <ArrowRightLeft className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </MotionCard>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="card-base overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-2 flex gap-1.5">
        <Skeleton className="h-7 flex-1 rounded-md" />
        <Skeleton className="h-7 flex-1 rounded-md" />
      </div>
    </div>
  );
}

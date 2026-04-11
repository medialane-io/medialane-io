"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionCard } from "@/components/ui/motion-primitives";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart, Tag, ArrowRightLeft, X, Loader2, HandCoins,
  GitBranch, Check, MoreHorizontal, Layers, Flag, ArrowUpRight,
  UserCircle2, Zap,
} from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { cn, ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { ReportDialog } from "@/components/report-dialog";
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

const BTN_BASE = "h-8 rounded-[11px] flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-[0.98] shadow-none border-0";
const BTN_SOLID = cn(BTN_BASE, "text-white hover:brightness-110");
const BTN_OUTLINE = cn(BTN_BASE, "border border-border/60 text-foreground hover:bg-muted/60");

interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
  onCancel?: (token: ApiToken) => void;
  onOffer?: (token: ApiToken) => void;
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
  const router = useRouter();
  const { addItem, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const activeOrder = token.activeOrders?.[0];
  const inCart = activeOrder ? items.some((i) => i.orderHash === activeOrder.orderHash) : false;

  const assetHref = `/asset/${token.contractAddress}/${token.tokenId}`;
  const collectionHref = `/collections/${token.contractAddress}`;
  const remixHref = `/create/remix/${token.contractAddress}/${token.tokenId}`;

  const creatorAddress = (
    token.metadata as { attributes?: { trait_type: string; value: string }[] } | undefined
  )?.attributes?.find((a) => a.trait_type === "Creator")?.value;
  const creatorHref = creatorAddress ? `/creator/${creatorAddress}` : null;
  const creatorShort = creatorAddress
    ? `${creatorAddress.slice(0, 6)}…${creatorAddress.slice(-4)}`
    : null;
  // Current holder: use first balance entry if available, fall back to legacy owner field
  const currentOwner = token.balances?.[0]?.owner ?? token.owner ?? null;
  const ownerAccountHref = currentOwner ? `/account/${currentOwner}` : null;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
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

  const handleOffer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOffer) onOffer(token); else router.push(assetHref);
  };

  const handleRemix = () => {
    if (onRemix) onRemix(token); else router.push(remixHref);
  };

  return (
    <>
      <MotionCard className="card-base group relative overflow-hidden flex flex-col">

        {/* ── Image ─────────────────────────────────────────────────── */}
        <Link href={assetHref} className="block relative shrink-0">
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

            {/* IP type badge — top left */}
            {token.metadata?.ipType && (
              <div className="absolute top-2 left-2">
                <IpTypeBadge ipType={token.metadata.ipType} size="sm" />
              </div>
            )}

            {/* Rarity — top right */}
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

            {/* Price pill */}
            {activeOrder && !rarityTier && (
              <div className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
                <span className="text-[11px] font-bold text-white leading-none">
                  {formatDisplayPrice(activeOrder.price.formatted)}{" "}
                  <span className="text-white/60 font-normal">{activeOrder.price.currency}</span>
                </span>
              </div>
            )}

            {/* Indexing */}
            {(token.metadataStatus === "PENDING" || token.metadataStatus === "FETCHING") && (
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm py-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-white/70" />
                <span className="text-[10px] text-white/70">Indexing…</span>
              </div>
            )}
          </div>
        </Link>

        {/* ── Info ──────────────────────────────────────────────────── */}
        <div className="px-3 pt-2.5 pb-1 flex-1">
          <Link href={assetHref} className="block space-y-0.5 mb-2">
            {/* Title — 2× the previous 13px → ~text-xl */}
            <p className="text-xl font-bold line-clamp-2 leading-tight">{name}</p>
            {creatorShort ? (
              <p className="text-[10px] text-muted-foreground truncate">
                by <span className="font-mono">{creatorShort}</span>
              </p>
            ) : token.metadata?.description ? (
              <p className="text-[10px] text-muted-foreground truncate leading-snug">
                {token.metadata.description}
              </p>
            ) : token.metadata?.ipType ? (
              <p className="text-[10px] text-muted-foreground opacity-70">
                {token.metadata.ipType}
              </p>
            ) : null}
          </Link>
        </div>

        {/* ── Action row ────────────────────────────────────────────── */}
        {/*
          [PRIMARY full-width CTA] [⋯ overflow]
          - Non-owner + listed   → Buy now (animated border)
          - Non-owner + unlisted → Make offer (orange)
          - Owner + listed       → Cancel listing (rose)
          - Owner + unlisted     → List for sale (blue)
          - Fallback             → View (outline)
        */}
        <div className="flex items-center gap-1.5 px-2 pb-2">

          {/* PRIMARY CTA
              Non-owner + listed   → Buy (animated) + cart icon
              Non-owner + unlisted → Make offer (orange)
              Owner + listed       → Cancel (rose)
              Owner + unlisted     → List for sale (blue)
              Fallback             → View (outline)
          */}
          {!isOwner && activeOrder && showBuyButton ? (
            <>
              {/* Animated gradient border Buy */}
              <div className="btn-border-animated p-[1.5px] rounded-[12px] flex-1 h-8">
                <button
                  className="w-full h-full rounded-[11px] bg-background flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-all active:scale-[0.98]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onBuy) onBuy(token); else router.push(assetHref);
                  }}
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  Buy
                </button>
              </div>
              {/* Cart icon button */}
              <button
                className={cn(
                  BTN_OUTLINE, "w-8 shrink-0",
                  inCart && "border-brand-orange/50 bg-brand-orange/10 text-brand-orange"
                )}
                onClick={handleAddToCart}
                disabled={inCart}
                aria-label={inCart ? "In cart" : "Add to cart"}
              >
                {inCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              </button>
            </>
          ) : !isOwner ? (
            /* Unlisted non-owner → View (primary) + Make offer icon */
            <>
              <Link href={assetHref} className={cn(BTN_OUTLINE, "flex-1")}>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                View
              </Link>
              <button
                className={cn(BTN_OUTLINE, "w-8 shrink-0 text-brand-orange border-brand-orange/40 hover:bg-brand-orange/10")}
                onClick={handleOffer}
                aria-label="Make an offer"
              >
                <HandCoins className="h-3.5 w-3.5" />
              </button>
            </>
          ) : activeOrder && onCancel ? (
            <>
              <button
                className={cn(BTN_SOLID, "flex-1 bg-brand-rose")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(token); }}
              >
                <X className="h-3.5 w-3.5 shrink-0" />
                Cancel listing
              </button>
              {onTransfer && (
                <button
                  className={cn(BTN_OUTLINE, "w-8 shrink-0")}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTransfer(token); }}
                  aria-label="Transfer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : onList ? (
            <>
              <button
                className={cn(BTN_SOLID, "flex-1 bg-brand-blue")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onList(token); }}
              >
                <Tag className="h-3.5 w-3.5 shrink-0" />
                List for sale
              </button>
              {onTransfer && (
                <button
                  className={cn(BTN_OUTLINE, "w-8 shrink-0")}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTransfer(token); }}
                  aria-label="Transfer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : (
            <Link href={assetHref} className={cn(BTN_OUTLINE, "flex-1")}>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              View
            </Link>
          )}

          {/* ⋯ OVERFLOW — all secondary actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0 rounded-[11px] text-muted-foreground/50 hover:text-foreground"
                onClick={(e) => e.preventDefault()}
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">

              {/* View asset */}
              <DropdownMenuItem asChild>
                <Link href={assetHref} className="flex items-center gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  View asset
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Non-owner market actions */}
              {!isOwner && (
                <>
                  {activeOrder && showBuyButton && (
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-brand-blue focus:text-brand-blue"
                      onClick={() => { if (onBuy) onBuy(token); else router.push(assetHref); }}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span className="flex items-center gap-1">
                        Buy —
                        <CurrencyIcon symbol={activeOrder.price.currency} size={12} />
                        {formatDisplayPrice(activeOrder.price.formatted)}
                      </span>
                    </DropdownMenuItem>
                  )}
                  {activeOrder && (
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={handleAddToCart}
                      disabled={inCart}
                    >
                      {inCart
                        ? <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />}
                      {inCart ? "In cart" : "Add to cart"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-brand-orange focus:text-brand-orange"
                    onClick={handleOffer}
                  >
                    <HandCoins className="h-3.5 w-3.5" />
                    Make an offer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
                    onClick={handleRemix}
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    Create a remix
                  </DropdownMenuItem>
                </>
              )}

              {/* Owner actions */}
              {isOwner && (
                <>
                  {!activeOrder && onList && (
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-brand-blue focus:text-brand-blue"
                      onClick={() => onList(token)}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      List for sale
                    </DropdownMenuItem>
                  )}
                  {activeOrder && onCancel && (
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onClick={() => onCancel(token)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel listing
                    </DropdownMenuItem>
                  )}
                  {onTransfer && (
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={() => onTransfer(token)}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      Transfer
                    </DropdownMenuItem>
                  )}
                </>
              )}

              <DropdownMenuSeparator />

              {/* Navigation */}
              {creatorHref && (
                <DropdownMenuItem asChild>
                  <Link href={creatorHref} className="flex items-center gap-2">
                    <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    View creator
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={collectionHref} className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  View collection
                </Link>
              </DropdownMenuItem>
              {ownerAccountHref && (
                <DropdownMenuItem asChild>
                  <Link href={ownerAccountHref} className="flex items-center gap-2">
                    <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    View owner
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="flex items-center gap-2 text-muted-foreground"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </MotionCard>

      <ReportDialog
        target={{ type: "TOKEN", contract: token.contractAddress, tokenId: token.tokenId, name }}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="card-base overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="px-3 pt-2.5 pb-2 space-y-1.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
      <div className="px-2 pb-2 flex gap-1.5">
        <Skeleton className="h-8 flex-1 rounded-[11px]" />
        <Skeleton className="h-8 w-8 rounded-[11px] shrink-0" />
        <Skeleton className="h-8 w-8 rounded-[11px] shrink-0" />
      </div>
    </div>
  );
}

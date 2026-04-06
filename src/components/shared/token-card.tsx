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
  GitBranch, Check, ExternalLink, MoreHorizontal, Layers, Flag,
} from "lucide-react";
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

  // Shared "more actions" dropdown — adapts based on context
  const MoreMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 shrink-0"
          onClick={(e) => e.preventDefault()}
          aria-label="More actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={assetHref} className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={collectionHref} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>

        {!isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
              onClick={() => { if (onOffer) onOffer(token); else router.push(assetHref); }}
            >
              <HandCoins className="h-3.5 w-3.5" />
              Make an offer
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-brand-rose focus:text-brand-rose"
              onClick={() => { if (onRemix) onRemix(token); else router.push(remixHref); }}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Remix this IP
            </DropdownMenuItem>
          </>
        )}

        {isOwner && (
          <>
            <DropdownMenuSeparator />
            {!activeOrder && onList && (
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => onList(token)}
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
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
                onClick={() => onTransfer && onTransfer(token)}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                Transfer
              </DropdownMenuItem>
            )}
          </>
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
  );

  return (
    <>
      <MotionCard className="card-base group relative overflow-hidden flex flex-col">
        {/* ── Image ──────────────────────────────────────────────────────── */}
        <Link href={assetHref} className="block relative shrink-0">
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

            {/* Price pill — top right for listed tokens */}
            {activeOrder && !rarityTier && (
              <div className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
                <span className="text-[11px] font-bold text-white leading-none">
                  {formatDisplayPrice(activeOrder.price.formatted)}{" "}
                  <span className="text-white/60 font-normal">{activeOrder.price.currency}</span>
                </span>
              </div>
            )}

            {/* Indexing indicator */}
            {(token.metadataStatus === "PENDING" || token.metadataStatus === "FETCHING") && (
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm py-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-white/70" />
                <span className="text-[10px] text-white/70">Indexing…</span>
              </div>
            )}

            {/* Name overlay — bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-10 pb-2.5 px-3 pointer-events-none">
              <p className="text-[13px] font-semibold text-white truncate leading-snug drop-shadow-sm">
                {name}
              </p>
            </div>
          </div>
        </Link>

        {/* ── Action bar — always visible ─────────────────────────────── */}
        <div className="px-2 py-2 flex items-center gap-1.5">

          {/* ── Non-owner: listed ─────────────────────────────────────── */}
          {!isOwner && activeOrder && (
            <>
              <span className="text-xs font-bold price-value mr-auto shrink-0">
                {formatDisplayPrice(activeOrder.price.formatted)}{" "}
                <span className="text-muted-foreground font-normal text-[10px]">{activeOrder.price.currency}</span>
              </span>

              {showBuyButton && (
                onBuy ? (
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 bg-brand-purple hover:brightness-110 text-white border-0"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuy(token); }}
                    title="Buy now"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" className="h-8 w-8 p-0 shrink-0 bg-brand-purple hover:brightness-110 text-white border-0" asChild title="Buy now">
                    <Link href={assetHref}><ShoppingCart className="h-3.5 w-3.5" /></Link>
                  </Button>
                )
              )}

              <Button
                size="sm"
                variant="outline"
                className={cn("h-8 w-8 p-0 shrink-0", inCart && "border-brand-orange/50 bg-brand-orange/10 text-brand-orange")}
                onClick={handleAddToCart}
                disabled={inCart}
                title={inCart ? "In cart" : "Add to cart"}
              >
                {inCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5 opacity-70" />}
              </Button>

              <MoreMenu />
            </>
          )}

          {/* ── Non-owner: unlisted ───────────────────────────────────── */}
          {!isOwner && !activeOrder && (
            <>
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" asChild>
                <Link href={assetHref}>
                  <ExternalLink className="h-3 w-3" />
                  View
                </Link>
              </Button>
              <MoreMenu />
            </>
          )}

          {/* ── Owner ─────────────────────────────────────────────────── */}
          {isOwner && (
            <>
              {activeOrder && onCancel ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(token); }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel listing
                </Button>
              ) : !activeOrder && onList ? (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onList(token); }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  List
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" asChild>
                  <Link href={assetHref}>
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Link>
                </Button>
              )}
              <MoreMenu />
            </>
          )}

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
      <div className="p-2 flex gap-1.5">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md shrink-0" />
      </div>
    </div>
  );
}

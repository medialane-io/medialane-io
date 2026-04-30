"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2, ArrowUpRight, MoreHorizontal, Zap, HandCoins, Tag,
  ShoppingCart, Check, Layers, GitBranch, Flag, UserCircle2, ArrowRightLeft, X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { ReportDialog } from "@/components/report-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { useCart } from "@/hooks/use-cart";
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
  onBuy?: (token: ApiToken) => void;
  onOffer?: (token: ApiToken) => void;
}

export function TokenCard({
  token,
  isOwner = false,
  rarityTier,
  onList,
  onCancel,
  onTransfer,
  onBuy,
  onOffer,
}: TokenCardProps) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const ipType = token.metadata?.ipType;

  // First listing-type active order (offer.itemType = ERC721 or ERC1155)
  const listingOrder = token.activeOrders?.find(
    (o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155"
  );

  const creatorAttr = token.metadata?.attributes?.find((a) => a.trait_type === "Creator");
  const creator = typeof creatorAttr?.value === "string" ? creatorAttr.value : null;
  const owner = token.balances?.[0]?.owner ?? token.owner ?? null;

  const assetHref = `/asset/${token.contractAddress}/${token.tokenId}`;
  const collectionHref = `/collections/${token.contractAddress}`;

  const inCart = listingOrder
    ? items.some((i) => i.orderHash === listingOrder.orderHash)
    : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!listingOrder || inCart) return;
    addItem({
      orderHash: listingOrder.orderHash,
      nftContract: listingOrder.nftContract ?? "",
      nftTokenId: listingOrder.nftTokenId ?? "",
      itemType: listingOrder.offer.itemType === "ERC1155" ? "ERC1155" : "ERC721",
      name,
      image: image ?? "",
      price: formatDisplayPrice(listingOrder.price.formatted),
      currency: listingOrder.price.currency ?? "",
      currencyDecimals: listingOrder.price.decimals,
      offerer: listingOrder.offerer ?? "",
      considerationToken: listingOrder.consideration.token ?? "",
      considerationAmount: listingOrder.consideration.startAmount ?? "",
    });
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBuy) onBuy(token);
    else router.push(assetHref);
  };

  const handleOffer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOffer) onOffer(token);
    else setOfferOpen(true);
  };

  return (
    <>
      <div className="card-base relative overflow-hidden flex flex-col w-full">

        {/* ── Clickable image + info ─────────────────────────────── */}
        <Link href={assetHref} className="flex flex-col flex-1">

          {/* Image */}
          <div className="relative aspect-square bg-muted overflow-hidden shrink-0">
            {!imgError ? (
              <Image
                src={image}
                alt={name}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                className="object-cover hover:scale-105 transition-transform duration-500"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
                <span className="text-2xl font-mono text-muted-foreground">#{token.tokenId}</span>
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

            {/* Price chip — bottom right overlay */}
            {listingOrder && (
              <div className="absolute bottom-2 right-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-background/90 backdrop-blur-sm border border-border/40 shadow-sm">
                  <CurrencyIcon symbol={listingOrder.price.currency ?? ""} size={10} />
                  {formatDisplayPrice(listingOrder.price.formatted)}
                  <span className="text-muted-foreground font-normal">{listingOrder.price.currency}</span>
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
          </div>

          {/* Info */}
          <div className="px-3 pt-2.5 pb-4 flex-1">
            <p className="text-base font-bold line-clamp-2 leading-snug">{name}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {ipType && <IpTypeBadge ipType={ipType} size="sm" />}
              {creator ? (
                <p className="text-[10px] font-mono text-muted-foreground/60 truncate">
                  {creator.slice(0, 8)}…{creator.slice(-6)}
                </p>
              ) : token.metadata?.description ? (
                <p className="text-[10px] text-muted-foreground truncate leading-snug">
                  {token.metadata.description}
                </p>
              ) : null}
            </div>
          </div>
        </Link>

        {/* ── Action row ────────────────────────────────────────── */}
        <div className="px-3 pb-3 flex items-center gap-1.5">

          {/* Expand */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 rounded-[9px] gap-1.5 px-3 text-xs font-semibold"
            asChild
          >
            <Link href={assetHref}>
              <ArrowUpRight className="h-3.5 w-3.5" />
              Expand
            </Link>
          </Button>

          {/* Owner: List Asset / Cancel Listing — Buyer: Buy / Make Offer */}
          {isOwner ? (
            listingOrder ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 rounded-[9px] text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel?.(token); }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel Listing
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 rounded-[9px] text-xs font-semibold text-brand-purple border-brand-purple/30 hover:bg-brand-purple/10 hover:text-brand-purple"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onList?.(token); }}
              >
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                List Asset
              </Button>
            )
          ) : listingOrder ? (
            <div className="btn-border-animated p-[1.5px] rounded-[10px] flex-1 h-8">
              <button
                className="w-full h-full rounded-[9px] bg-background flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-all active:scale-[0.98]"
                onClick={handleBuy}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                Buy
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 rounded-[9px] text-xs font-semibold text-brand-orange border-brand-orange/30 hover:bg-brand-orange/10 hover:text-brand-orange"
              onClick={handleOffer}
            >
              <HandCoins className="h-3.5 w-3.5 mr-1.5" />
              Make Offer
            </Button>
          )}

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 shrink-0 rounded-[9px]"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">

              <DropdownMenuItem asChild>
                <Link href={assetHref} className="flex items-center gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  View asset
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isOwner ? (
                <>
                  {!listingOrder && onList && (
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
                      onClick={() => onList(token)}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      List for sale
                    </DropdownMenuItem>
                  )}
                  {listingOrder && onCancel && (
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
                      Transfer asset
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <>
                  {listingOrder && (
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-brand-blue focus:text-brand-blue"
                      onClick={handleBuy}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span className="flex items-center gap-1">
                        Buy —
                        <CurrencyIcon symbol={listingOrder.price.currency} size={12} />
                        {formatDisplayPrice(listingOrder.price.formatted)}
                      </span>
                    </DropdownMenuItem>
                  )}
                  {listingOrder && (
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
                </>
              )}

              <DropdownMenuItem
                className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
                onClick={() => router.push(`/create/remix/${token.contractAddress}/${token.tokenId}`)}
              >
                <GitBranch className="h-3.5 w-3.5" />
                Create a remix
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href={collectionHref} className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  View collection
                </Link>
              </DropdownMenuItem>

              {(owner ?? creator) && (
                <DropdownMenuItem asChild>
                  <Link href={`/account/${owner ?? creator}`} className="flex items-center gap-2">
                    <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    View owner
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="flex items-center gap-2 text-muted-foreground focus:text-muted-foreground"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {offerOpen && (
        <OfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          assetContract={token.contractAddress}
          tokenId={token.tokenId}
          tokenName={token.metadata?.name ?? undefined}
          tokenImage={image ?? undefined}
          tokenStandard={token.standard ?? undefined}
        />
      )}

      {reportOpen && (
        <ReportDialog
          target={{
            type: "TOKEN",
            contract: token.contractAddress,
            tokenId: token.tokenId,
            name: token.metadata?.name ?? undefined,
          }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="card-base overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="px-3 pt-2.5 pb-3 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
      <div className="px-3 pb-3 flex gap-1.5">
        <Skeleton className="h-8 w-8 rounded-[9px]" />
        <Skeleton className="h-8 flex-1 rounded-[9px]" />
        <Skeleton className="h-8 w-8 rounded-[9px]" />
      </div>
    </div>
  );
}

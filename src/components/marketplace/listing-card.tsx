"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionCard } from "@/components/ui/motion-primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShoppingCart, Check, MoreHorizontal, ExternalLink, Layers, ArrowRightLeft, Flag } from "lucide-react";
import { cn, ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { ReportDialog } from "@/components/report-dialog";
import type { ApiOrder } from "@medialane/sdk";

interface ListingCardProps {
  order: ApiOrder;
  onBuy?: (order: ApiOrder) => void;
}

export function ListingCard({ order, onBuy }: ListingCardProps) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.orderHash === order.orderHash);
  const [imgError, setImgError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const isListing = order.offer.itemType === "ERC721";

  const name = order.token?.name ?? `Token #${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCart) return;
    addItem({
      orderHash: order.orderHash,
      nftContract: order.nftContract ?? "",
      nftTokenId: order.nftTokenId ?? "",
      name,
      image: image ?? "",
      price: formatDisplayPrice(order.price.formatted),
      currency: order.price.currency ?? "",
      currencyDecimals: order.price.decimals,
      offerer: order.offerer ?? "",
      considerationToken: order.consideration.token ?? "",
      considerationAmount: order.consideration.startAmount ?? "",
    });
  };

  return (
    <MotionCard className="card-base">
      <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="block">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {image && !imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
              <span className="text-2xl font-mono text-muted-foreground">
                #{order.nftTokenId}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-3">
          <div>
            <p className="font-semibold text-sm truncate leading-snug">{name}</p>
            {order.token?.description ? (
              <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug mt-0.5">
                {order.token.description}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">#{order.nftTokenId}</p>
            )}
          </div>

          <p className="text-base font-bold price-value leading-none">
            {formatDisplayPrice(order.price.formatted)}{" "}
            <span className="text-muted-foreground font-normal text-sm">
              {order.price.currency}
            </span>
          </p>

          {isListing && (
            <div className="flex items-center gap-1.5">
              {onBuy && (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-brand-blue hover:brightness-110 text-white border-0"
                  onClick={(e) => {
                    e.preventDefault();
                    onBuy(order);
                  }}
                >
                  Buy Now
                </Button>
              )}
              {/* Cart */}
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-8 w-8 p-0 shrink-0 transition-colors",
                  inCart && "border-brand-orange/50 bg-brand-orange/10 text-brand-orange"
                )}
                onClick={handleAddToCart}
                disabled={inCart}
                aria-label={inCart ? "Added to cart" : "Add to cart"}
              >
                {inCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              </Button>
              {/* More actions */}
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
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      View Asset
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/collections/${order.nftContract}`} className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      View Collection
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="flex items-center gap-2">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      Transfer Asset
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={(e) => { e.preventDefault(); setReportOpen(true); }}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </Link>

      {reportOpen && (
        <ReportDialog
          target={{ type: "TOKEN", contract: order.nftContract ?? "", tokenId: order.nftTokenId ?? "", name: order.token?.name ?? undefined }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </MotionCard>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card-base">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2.5">
        <div className="space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

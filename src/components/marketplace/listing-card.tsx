"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionCard } from "@/components/ui/motion-primitives";
import { ShoppingCart, Clock } from "lucide-react";
import { ipfsToHttp, timeUntil, shortenAddress } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import type { ApiOrder } from "@medialane/sdk";

interface ListingCardProps {
  order: ApiOrder;
  onBuy?: (order: ApiOrder) => void;
}

export function ListingCard({ order, onBuy }: ListingCardProps) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.orderHash === order.orderHash);
  const [imgError, setImgError] = useState(false);
  const isListing = order.offer.itemType === "ERC721";

  const name = order.token?.name ?? `Token #${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCart) return;
    addItem({
      orderHash: order.orderHash,
      nftContract: order.nftContract,
      nftTokenId: order.nftTokenId,
      name,
      image: image ?? "",
      price: order.price.formatted,
      currency: order.price.currency,
      currencyDecimals: order.price.decimals,
      offerer: order.offerer,
      considerationToken: order.consideration.token,
      considerationAmount: order.consideration.startAmount,
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
              className="object-cover"
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
        <div className="p-3 space-y-2.5">
          <div>
            <p className="font-semibold text-sm truncate leading-snug">{name}</p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {shortenAddress(order.nftContract)}
            </p>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="section-label">{isListing ? "Ask" : "Offer"}</p>
              <p className="price-value text-sm">
                {order.price.formatted}{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  {order.price.currency}
                </span>
              </p>
            </div>
            {isListing && (
              <div className="flex gap-1.5">
                {onBuy && (
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-brand-purple text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      onBuy(order);
                    }}
                  >
                    Buy
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={handleAddToCart}
                  disabled={inCart}
                  aria-label={inCart ? "In cart" : "Add to cart"}
                >
                  <ShoppingCart className={`h-3.5 w-3.5 ${inCart ? "opacity-40" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Expires {timeUntil(order.endTime)}</span>
          </div>
        </div>
      </Link>
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

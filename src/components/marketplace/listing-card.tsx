"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="block group">
      <div className="rounded-2xl border border-border bg-card overflow-hidden asset-card-hover card-glow hover:border-primary/30">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {image && !imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
              <span className="text-2xl font-mono text-muted-foreground">
                #{order.nftTokenId}
              </span>
            </div>
          )}

          {/* Cart overlay on hover for listings */}
          {isListing && (
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  if (!inCart) handleAddToCart(e);
                }}
                disabled={inCart}
              >
                <ShoppingCart className="h-3 w-3 mr-1.5" />
                {inCart ? "In cart" : "Add to cart"}
              </Button>
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

          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">{isListing ? "Ask" : "Offer"}</p>
              <p className="price-value text-sm">
                {order.price.formatted}{" "}
                <span className="text-muted-foreground font-normal">{order.price.currency}</span>
              </p>
            </div>
            {isListing && onBuy && (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onBuy(order);
                }}
              >
                Buy
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Expires {timeUntil(order.endTime)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-square w-full" />
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

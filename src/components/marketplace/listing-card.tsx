"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Clock } from "lucide-react";
import { ipfsToHttp, timeUntil, shortenAddress } from "@/lib/utils";
import type { ApiOrder } from "@medialane/sdk";

interface ListingCardProps {
  order: ApiOrder;
  onBuy?: (order: ApiOrder) => void;
}

export function ListingCard({ order, onBuy }: ListingCardProps) {
  return (
    <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="block group">
      <div className="rounded-xl border border-border bg-card overflow-hidden asset-card-hover hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Image placeholder */}
        <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
          <span className="text-2xl font-mono text-muted-foreground z-10">
            #{order.nftTokenId}
          </span>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <p className="font-semibold text-sm truncate">Token #{order.nftTokenId}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {shortenAddress(order.nftContract)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                {order.offer.itemType === "ERC721" ? "Ask" : "Offer"}
              </p>
              <p className="text-sm font-bold">
                {order.price.formatted} {order.price.currency}
              </p>
            </div>
            {onBuy && order.offer.itemType === "ERC721" && (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onBuy(order);
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Expires {timeUntil(order.endTime)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

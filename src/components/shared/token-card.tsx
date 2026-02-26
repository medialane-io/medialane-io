"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Tag } from "lucide-react";
import { ipfsToHttp, formatPrice } from "@/lib/utils";
import type { ApiToken } from "@medialane/sdk";

interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  isOwner?: boolean;
}

export function TokenCard({ token, showBuyButton = true, onBuy, onList, isOwner = false }: TokenCardProps) {
  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const activeOrder = token.activeOrders?.[0];

  return (
    <Link href={`/asset/${token.contractAddress}/${token.tokenId}`} className="block group">
      <div className="rounded-xl border border-border bg-card overflow-hidden asset-card-hover hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={image.startsWith("http")}
            onError={() => {}}
          />
          {token.metadata?.ipType && (
            <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm border-border/50">
              {token.metadata.ipType}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <p className="font-semibold text-sm truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">#{token.tokenId}</p>
          </div>

          {activeOrder && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Price</p>
                <p className="text-sm font-bold">
                  {activeOrder.price.formatted} {activeOrder.price.currency}
                </p>
              </div>
              {showBuyButton && !isOwner && onBuy && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onBuy(token);
                  }}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Buy
                </Button>
              )}
              {isOwner && onList && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onList(token);
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}

          {!activeOrder && isOwner && onList && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={(e) => {
                e.preventDefault();
                onList(token);
              }}
            >
              <Tag className="h-3 w-3 mr-1" />
              List for sale
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TokenCardSkeleton() {
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

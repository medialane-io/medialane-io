"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Tag } from "lucide-react";
import { ipfsToHttp } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import type { ApiToken } from "@medialane/sdk";

interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  isOwner?: boolean;
}

export function TokenCard({ token, showBuyButton = true, onBuy, onList, isOwner = false }: TokenCardProps) {
  const { addItem, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const activeOrder = token.activeOrders?.[0];
  const inCart = activeOrder ? items.some((i) => i.orderHash === activeOrder.orderHash) : false;
  const isListed = !!activeOrder;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    addItem({
      orderHash: activeOrder.orderHash,
      nftContract: token.contractAddress,
      nftTokenId: token.tokenId,
      name,
      image,
      price: activeOrder.price.formatted,
      currency: activeOrder.price.currency,
      currencyDecimals: activeOrder.price.decimals,
      offerer: activeOrder.offerer,
      considerationToken: activeOrder.consideration.token,
      considerationAmount: activeOrder.consideration.startAmount,
    });
  };

  return (
    <Link href={`/asset/${token.contractAddress}/${token.tokenId}`} className="block group">
      <div className="rounded-2xl border border-border bg-card overflow-hidden asset-card-hover card-glow hover:border-primary/30">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {!imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
              <span className="text-2xl font-mono text-muted-foreground">#{token.tokenId}</span>
            </div>
          )}

          {/* IP type badge */}
          {token.metadata?.ipType && (
            <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm border-border/50">
              {token.metadata.ipType}
            </Badge>
          )}

          {/* Cart overlay — appears on hover when listed and not owner */}
          {isListed && !isOwner && (
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  if (inCart) return;
                  handleAddToCart(e);
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
            <p className="text-[11px] text-muted-foreground">#{token.tokenId}</p>
          </div>

          {/* Price + buy row */}
          {activeOrder && (
            <div className="flex items-center justify-between">
              <div>
                <p className="section-label">Price</p>
                <p className="price-value text-sm">
                  {activeOrder.price.formatted}{" "}
                  <span className="text-muted-foreground font-normal">{activeOrder.price.currency}</span>
                </p>
              </div>
              <div className="flex gap-1">
                {showBuyButton && !isOwner && onBuy && (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      onBuy(token);
                    }}
                  >
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
            </div>
          )}

          {/* List for sale (unlisted owner) */}
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-square w-full" />
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

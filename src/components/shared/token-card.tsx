"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionCard } from "@/components/ui/motion-primitives";
import { ShoppingCart, Tag, ArrowRightLeft } from "lucide-react";
import { ipfsToHttp , formatDisplayPrice} from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import type { ApiToken } from "@medialane/sdk";

interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
  isOwner?: boolean;
}

export function TokenCard({
  token,
  showBuyButton = true,
  onBuy,
  onList,
  onTransfer,
  isOwner = false,
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
      currency: activeOrder.price.currency,
      currencyDecimals: activeOrder.price.decimals,
      offerer: activeOrder.offerer,
      considerationToken: activeOrder.consideration.token,
      considerationAmount: activeOrder.consideration.startAmount,
    });
  };

  return (
    <MotionCard className="card-base">
      <Link href={`/asset/${token.contractAddress}/${token.tokenId}`} className="block">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {!imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
              <span className="text-2xl font-mono text-muted-foreground">#{token.tokenId}</span>
            </div>
          )}
          {token.metadata?.ipType && (
            <Badge className="absolute top-2 left-2 text-[10px] bg-background/85 backdrop-blur-sm border-0">
              {token.metadata.ipType}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-2.5">
          <div>
            <p className="font-semibold text-sm truncate leading-snug">{name}</p>
            <p className="text-[11px] text-muted-foreground">#{token.tokenId}</p>
          </div>

          {activeOrder && (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="section-label">Price</p>
                <p className="price-value text-sm">
                  {formatDisplayPrice(activeOrder.price.formatted)}{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    {activeOrder.price.currency}
                  </span>
                </p>
              </div>
              <div className="flex gap-1.5">
                {showBuyButton && !isOwner && onBuy && (
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-brand-purple text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBuy(token);
                    }}
                  >
                    Buy
                  </Button>
                )}
                {!isOwner && (
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
                )}
                {isOwner && onList && activeOrder && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onList(token);
                    }}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {isOwner && onTransfer && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTransfer(token);
                    }}
                    aria-label="Transfer asset"
                    title="Transfer to another wallet"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {!activeOrder && isOwner && (onList || onTransfer) && (
            <div className="flex gap-1.5">
              {onList && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onList(token);
                  }}
                >
                  <Tag className="h-3 w-3 mr-1.5" />
                  List for sale
                </Button>
              )}
              {onTransfer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTransfer(token);
                  }}
                  aria-label="Transfer asset"
                  title="Transfer to another wallet"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Link>
    </MotionCard>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="card-base">
      <Skeleton className="aspect-square w-full rounded-none" />
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

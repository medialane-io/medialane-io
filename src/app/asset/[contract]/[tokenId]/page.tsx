"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToken } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { AddressDisplay } from "@/components/shared/address-display";
import { ipfsToHttp, timeUntil } from "@/lib/utils";
import { ShoppingCart, Tag, ExternalLink, Clock } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { useUser } from "@clerk/nextjs";
import type { ApiOrder } from "@medialane/sdk";

export default function AssetPage() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const { user, isSignedIn } = useUser();
  const { token, isLoading } = useToken(contract, tokenId);
  const { listings } = useTokenListings(contract, tokenId);

  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const activeListings = listings.filter((l) => l.status === "ACTIVE");
  const cheapest = activeListings.sort((a, b) =>
    BigInt(a.consideration.startAmount) < BigInt(b.consideration.startAmount) ? -1 : 1
  )[0];

  const userAddress = user?.publicMetadata?.publicKey as string | undefined;
  const isOwner = token && userAddress
    ? token.owner.toLowerCase() === userAddress.toLowerCase()
    : false;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-2xl font-bold">Asset not found</p>
        <p className="text-muted-foreground mt-2">This token hasn&apos;t been indexed yet.</p>
      </div>
    );
  }

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const description = token.metadata?.description;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              unoptimized={image.startsWith("http")}
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {token.metadata?.ipType && (
                <Badge variant="secondary" className="mb-2">{token.metadata.ipType}</Badge>
              )}
              <h1 className="text-3xl font-bold">{name}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Owned by</span>
                <AddressDisplay address={token.owner} />
              </div>
            </div>

            {description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            )}

            {/* Metadata attributes */}
            {token.metadata?.licenseType && (
              <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">License</p>
                <p className="text-sm font-medium">{token.metadata.licenseType}</p>
              </div>
            )}

            {/* Price / action */}
            {cheapest ? (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Current price</p>
                  <p className="text-3xl font-bold mt-1">
                    {cheapest.price.formatted} {cheapest.price.currency}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    Expires {timeUntil(cheapest.endTime)}
                  </div>
                </div>
                {isOwner ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setListOpen(true)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Edit listing
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => setPurchaseOrder(cheapest)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Buy now
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-muted-foreground text-sm">Not listed for sale.</p>
                {isOwner && (
                  <Button className="w-full" onClick={() => setListOpen(true)}>
                    <Tag className="h-4 w-4 mr-2" />
                    List for sale
                  </Button>
                )}
              </div>
            )}

            {/* Links */}
            <div className="flex gap-3 text-sm">
              <a
                href={`${EXPLORER_URL}/contract/${token.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Contract <ExternalLink className="h-3 w-3" />
              </a>
              <Link
                href={`/collections/${token.contractAddress}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Collection
              </Link>
            </div>
          </div>
        </div>
      </div>

      {purchaseOrder && (
        <PurchaseDialog
          order={purchaseOrder}
          open
          onOpenChange={(v) => { if (!v) setPurchaseOrder(null); }}
        />
      )}

      <ListingDialog
        open={listOpen}
        onOpenChange={setListOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={name}
      />
    </>
  );
}

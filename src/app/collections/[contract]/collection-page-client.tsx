"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressDisplay } from "@/components/shared/address-display";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { ipfsToHttp } from "@/lib/utils";

const STATS = (col: NonNullable<ReturnType<typeof useCollection>["collection"]>) => [
  { label: "Items",   value: col.totalSupply?.toLocaleString() ?? "—" },
  { label: "Holders", value: col.holderCount?.toLocaleString() ?? "—" },
  { label: "Floor",   value: col.floorPrice ?? "—" },
  { label: "Volume",  value: col.totalVolume ?? "—" },
];

function CollectionBanner({ collection, isLoading }: {
  collection: ReturnType<typeof useCollection>["collection"];
  isLoading: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection?.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection?.name ?? "?").charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="w-full aspect-[21/7]" />
        <div className="container mx-auto px-4">
          <div className="flex items-end gap-4 -mt-8 pb-6">
            <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
            <div className="space-y-2 pb-1 flex-1">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[21/7] bg-gradient-to-br from-primary/20 via-purple-500/15 to-blue-500/10 overflow-hidden">
        {showImage && (
          <Image
            src={imageUrl}
            alt={collection?.name ?? "Collection"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Back link */}
        <Link
          href="/collections"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Collections
        </Link>
      </div>

      {/* Identity — overlaps banner */}
      <div className="container mx-auto px-4">
        <div className="flex items-end gap-4 -mt-10 pb-4">
          {/* Avatar */}
          <div className="relative h-20 w-20 rounded-2xl border-4 border-background bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-3xl font-black shrink-0 overflow-hidden shadow-xl">
            {showImage && (
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                onError={() => setImgError(true)}
                unoptimized
              />
            )}
            {!showImage && <span>{initial}</span>}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 pb-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{collection?.name ?? "Unnamed Collection"}</h1>
              {collection?.symbol && (
                <Badge variant="secondary" className="font-mono text-xs shrink-0">
                  {collection.symbol}
                </Badge>
              )}
              {collection?.isKnown && (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
            <AddressDisplay
              address={collection?.contractAddress ?? ""}
              chars={6}
              className="text-xs text-muted-foreground mt-0.5"
            />
          </div>
        </div>

        {/* Description */}
        {collection?.description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed pb-2">
            {collection.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CollectionPageClient() {
  const { contract } = useParams<{ contract: string }>();
  const { collection, isLoading: colLoading } = useCollection(contract);
  const { tokens, isLoading: tokensLoading } = useCollectionTokens(contract);
  const { orders, isLoading: ordersLoading } = useOrders({
    collection: contract,
    status: "ACTIVE",
    sort: "recent",
    limit: 50,
  });

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
  const activeBids = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20");

  return (
    <div className="space-y-0">
      <CollectionBanner collection={collection} isLoading={colLoading} />

      <div className="container mx-auto px-4 space-y-8 pb-12">
        {/* Stats bar */}
        {colLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : collection ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {STATS(collection).map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {label}
                </p>
                <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">
              Items{!tokensLoading && tokens.length > 0 && ` (${tokens.length})`}
            </TabsTrigger>
            <TabsTrigger value="listings">
              Listings{!ordersLoading && activeListings.length > 0 && ` (${activeListings.length})`}
            </TabsTrigger>
            <TabsTrigger value="offers">
              Offers{!ordersLoading && activeBids.length > 0 && ` (${activeBids.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Items */}
          <TabsContent value="items" className="mt-6">
            {tokensLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
              </div>
            ) : tokens.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No items indexed yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokens.map((t) => (
                  <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Listings */}
          <TabsContent value="listings" className="mt-6">
            {ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No active listings in this collection.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
              </div>
            )}
          </TabsContent>

          {/* Offers */}
          <TabsContent value="offers" className="mt-6">
            {ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeBids.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No active offers in this collection.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeBids.map((o) => <ListingCard key={o.orderHash} order={o} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

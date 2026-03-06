"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressDisplay } from "@/components/shared/address-display";

export default function CollectionPage() {
  const { contract } = useParams<{ contract: string }>();
  const { collection, isLoading: colLoading } = useCollection(contract);
  const { tokens, isLoading: tokensLoading } = useCollectionTokens(contract);
  const { orders, isLoading: ordersLoading } = useOrders({
    collection: contract,
    status: "ACTIVE",
    sort: "recent",
    limit: 30,
  });

  const name = collection?.name || "Collection";
  const activeListings = orders.filter((o) => o.status === "ACTIVE");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-2xl font-bold shrink-0">
          {name.charAt(0)}
        </div>
        <div className="space-y-1">
          {colLoading ? (
            <>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{name}</h1>
                {collection?.isKnown && <Badge variant="secondary">Verified</Badge>}
              </div>
              <AddressDisplay address={contract} className="text-muted-foreground" />
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {collection && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Items", value: collection.totalSupply?.toLocaleString() ?? "—" },
            { label: "Holders", value: collection.holderCount?.toLocaleString() ?? "—" },
            { label: "Floor", value: collection.floorPrice ? `${collection.floorPrice}` : "—" },
            { label: "Volume", value: collection.totalVolume ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
              <p className="text-lg font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tokens + Listings tabs */}
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">
            All Items {!tokensLoading && tokens.length > 0 && `(${tokens.length})`}
          </TabsTrigger>
          <TabsTrigger value="listings">
            Listings {!ordersLoading && activeListings.length > 0 && `(${activeListings.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          {tokensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
            </div>
          ) : tokens.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No items indexed yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tokens.map((t) => (
                <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          {ordersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : activeListings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No active listings in this collection.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeListings.map((order) => (
                <ListingCard key={order.orderHash} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

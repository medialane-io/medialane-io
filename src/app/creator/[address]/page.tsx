"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { AddressDisplay } from "@/components/shared/address-display";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard } from "@/components/marketplace/listing-card";
import { User } from "lucide-react";

export default function CreatorPage() {
  const { address } = useParams<{ address: string }>();
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(address);
  const { orders, isLoading: ordersLoading } = useUserOrders(address);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Creator</h1>
            <Badge variant="secondary">Starknet</Badge>
          </div>
          <AddressDisplay address={address} chars={6} className="text-muted-foreground" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Assets owned", value: tokens.length },
          { label: "Active listings", value: activeListings.length },
          { label: "Total sales", value: orders.filter((o) => o.status === "FULFILLED").length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Assets ({tokens.length})</TabsTrigger>
          <TabsTrigger value="listings">Listings ({activeListings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-6">
          {tokensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <TokenCardSkeleton key={i} />)}
            </div>
          ) : tokens.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No assets yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tokens.map((t) => <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          {ordersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <TokenCardSkeleton key={i} />)}
            </div>
          ) : activeListings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No active listings.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

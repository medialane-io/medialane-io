"use client";

import { useParams } from "next/navigation";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { AddressDisplay } from "@/components/shared/address-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { timeAgo , formatDisplayPrice} from "@/lib/utils";
import {
  Tag,
  Handshake,
  TrendingUp,
  ArrowRightLeft,
  Activity,
} from "lucide-react";
import type { ApiActivity } from "@medialane/sdk";

// ─── Deterministic avatar gradient from address ────────────────────────────

function gradientFromAddress(address: string) {
  const seed = parseInt(address.slice(2, 10) || "0", 16);
  const h1 = seed % 360;
  const h2 = (h1 + 137) % 360; // golden angle offset
  return `hsl(${h1}, 70%, 60%), hsl(${h2}, 70%, 55%)`;
}

function AddressAvatar({ address, size = 20 }: { address: string; size?: number }) {
  const gradient = gradientFromAddress(address);
  const initial = address.slice(2, 4).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${gradient})`,
        fontSize: size * 0.3,
      }}
    >
      {initial}
    </div>
  );
}

// ─── Activity feed ─────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  listing:   Tag,
  sale:      Handshake,
  offer:     TrendingUp,
  transfer:  ArrowRightLeft,
  cancelled: ArrowRightLeft,
};

const ACTIVITY_LABEL: Record<string, string> = {
  listing:   "Listed",
  sale:      "Sold",
  offer:     "Offer",
  transfer:  "Transfer",
  cancelled: "Cancelled",
};

function ActivityRow({ event }: { event: ApiActivity }) {
  const Icon = ACTIVITY_ICON[event.type] ?? ArrowRightLeft;
  const tokenId = event.nftTokenId ?? event.tokenId;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {ACTIVITY_LABEL[event.type] ?? event.type} · Token #{tokenId ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {(event.nftContract ?? event.contractAddress)?.slice(0, 20)}…
        </p>
      </div>
      <div className="text-right shrink-0">
        {event.price?.formatted && (
          <p className="text-sm font-semibold">{formatDisplayPrice(event.price.formatted)}</p>
        )}
        <p className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CreatorPageClient() {
  const { address } = useParams<{ address: string }>();
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(address);
  const { orders, isLoading: ordersLoading } = useUserOrders(address);
  const { activities, isLoading: activitiesLoading } = useActivitiesByAddress(address);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
  const totalSales = orders.filter((o) => o.status === "FULFILLED").length;

  const STATS = [
    { label: "Assets owned",    value: tokensLoading  ? "—" : tokens.length },
    { label: "Active listings", value: ordersLoading  ? "—" : activeListings.length },
    { label: "Total sales",     value: ordersLoading  ? "—" : totalSales },
  ];

  return (
    <div className="space-y-0 pb-16">
      {/* Banner */}
      <div
        className="h-32 sm:h-48 w-full"
        style={{
          background: `linear-gradient(135deg, ${gradientFromAddress(address ?? "0x0")})`,
          opacity: 0.4,
        }}
      />

      <div className="container mx-auto px-4 space-y-8">
        {/* Identity */}
        <div className="flex items-end gap-4 -mt-10">
          <div className="shrink-0 ring-4 ring-background rounded-full shadow-xl">
            <AddressAvatar address={address ?? "0x0"} size={80} />
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-2xl font-bold">Creator</h1>
            <AddressDisplay address={address} chars={8} className="text-muted-foreground text-sm" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {STATS.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
              <p className="text-xl font-bold mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assets">
          <TabsList>
            <TabsTrigger value="assets">
              Assets{!tokensLoading && tokens.length > 0 && ` (${tokens.length})`}
            </TabsTrigger>
            <TabsTrigger value="listings">
              Listings{!ordersLoading && activeListings.length > 0 && ` (${activeListings.length})`}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-3.5 w-3.5 mr-1" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Assets */}
          <TabsContent value="assets" className="mt-6">
            {tokensLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <TokenCardSkeleton key={i} />)}
              </div>
            ) : tokens.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No assets yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokens.map((t) => <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />)}
              </div>
            )}
          </TabsContent>

          {/* Listings */}
          <TabsContent value="listings" className="mt-6">
            {ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No active listings.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
              </div>
            )}
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-6">
            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
              {activitiesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))
              ) : activities.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No activity yet.</div>
              ) : (
                activities.map((a, i) => <ActivityRow key={i} event={a} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

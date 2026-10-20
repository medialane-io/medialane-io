"use client";

import { useState } from "react";
import Link from "next/link";
import { useCreatorByUsername } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useCollectionsByOwner, useUserOrders, useActivitiesByAddress, CollectionCard, CollectionCardSkeleton, CreatorHeader, TabEmptyState } from "@medialane/ui";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { CreatorAnalytics } from "@/components/creator/creator-analytics";
import { ActivityRow } from "@/components/creator/activity-row";
import { Button } from "@medialane/ui/button";
import { Skeleton } from "@medialane/ui/skeleton";
import { ipfsToHttp } from "@/lib/utils";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import { normalizeAddress } from "@medialane/sdk";
import {
  ShoppingBag, BarChart2, Activity, LayoutGrid, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  username: string;
}

const TABS = [
  { id: "assets",      label: "Assets",      Icon: ImageIcon },
  { id: "collections", label: "Collections", Icon: LayoutGrid },
  { id: "listings",    label: "Listings",    Icon: ShoppingBag },
  { id: "analytics",   label: "Analytics",   Icon: BarChart2 },
  { id: "activity",    label: "Activity",    Icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CreatorUsernamePageClient({ username }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("assets");
  const usdPrices = useUsdPrices();

  const { creator, isLoading, error } = useCreatorByUsername(username);
  const walletAddress = creator?.walletAddress ? normalizeAddress("STARKNET", creator.walletAddress) : null;

  const { tokens: bannerTokens, meta: bannerMeta } = useTokensByOwner(walletAddress, 1, 1);
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(activeTab === "assets" ? walletAddress : null);
  const { collections, isLoading: colsLoading } = useCollectionsByOwner(walletAddress);
  const { orders, isLoading: ordersLoading } = useUserOrders(activeTab === "listings" ? walletAddress : null);
  const { activities, isLoading: activitiesLoading } = useActivitiesByAddress(walletAddress);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");

  const heroRaw = creator?.avatarImage
    || bannerTokens[0]?.metadata?.image
    || null;
  const heroImage = heroRaw ? ipfsToHttp(heroRaw) : null;


  const tabBadge: Partial<Record<TabId, number>> = {
    ...(activeTab === "assets"      && !tokensLoading      && { assets:      tokens.length }),
    ...(!colsLoading                                       && { collections: collections.length }),
    ...(activeTab === "listings"    && !ordersLoading      && { listings:    activeListings.length }),
    ...(!activitiesLoading                                 && { activity:    activities.length }),
  };

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen">
        <div className="px-6 pt-20 pb-6">
          <CreatorHeader creator={null} image={null} stats={[]} loading />
        </div>
        <div className="px-6 pt-5 space-y-4">
          <div className="flex gap-2 border-b border-border pb-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="mx-auto px-4 py-24 max-w-lg text-center space-y-4">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold">Creator not found</h1>
        <p className="text-muted-foreground">
          <span className="tabular-nums">@{username}</span> hasn&apos;t been claimed yet or doesn&apos;t exist.
        </p>
        <Button variant="outline" asChild>
          <Link href="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="pb-20 min-h-screen overflow-x-hidden">

      <div className="px-6 pt-20 pb-6">
        <CreatorHeader
          creator={creator}
          image={heroImage}
          stats={[
            { label: "Assets", value: bannerMeta?.total ?? null },
            { label: "Collections", value: colsLoading ? null : collections.length },
          ]}
        />
      </div>

      <div className="sticky top-0 z-20 px-6 bg-background/95 backdrop-blur-sm border-b border-border mt-4">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none -mb-px">
          {TABS.map(({ id, label, Icon }) => {
            const count = tabBadge[id];
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold rounded-full px-1.5 py-px min-w-[18px] text-center tabular-nums",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
                {isActive && <span className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 mt-6">

        {activeTab === "assets" && (
          tokensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
            </div>
          ) : tokens.length === 0 ? (
            <TabEmptyState icon={ImageIcon} heading="No assets yet" body="This creator hasn't minted any digital assets on Medialane yet." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tokens.map((t) => {
                const listingOrder = t.activeOrders?.find((o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155");
                return (
                  <TokenCard
                    key={`${t.contractAddress}-${t.tokenId}`}
                    token={t}
                    usdValue={usdValueFor(listingOrder?.price.formatted, listingOrder?.price.currency, usdPrices)}
                  />
                );
              })}
            </div>
          )
        )}

        {activeTab === "collections" && (
          colsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
            </div>
          ) : collections.length === 0 ? (
            <TabEmptyState icon={LayoutGrid} heading="No collections yet" body="This creator hasn't deployed any collections on Medialane yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => (
                <CollectionCard key={col.contractAddress} collection={col} />
              ))}
            </div>
          )
        )}

        {activeTab === "listings" && (
          ordersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : activeListings.length === 0 ? (
            <TabEmptyState icon={ShoppingBag} heading="No active listings" body="This creator has no digital assets listed for sale right now." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
            </div>
          )
        )}

        {activeTab === "analytics" && (
          <div className="max-w-2xl">
            <CreatorAnalytics activities={activities} isLoading={activitiesLoading} />
          </div>
        )}

        {activeTab === "activity" && (
          <div className="max-w-2xl">
            {activitiesLoading ? (
              <div className="space-y-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <Skeleton className="h-3.5 w-16" />
                      <Skeleton className="h-3 w-10 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <TabEmptyState icon={Activity} heading="No activity yet" body="On-chain events for this creator will appear here as they happen." />
            ) : (
              <div>
                {activities.map((a, i) => (
                  <ActivityRow key={i} event={a} isLast={i === activities.length - 1} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

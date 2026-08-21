"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { normalizeAddress } from "@medialane/sdk";
import type { ApiToken } from "@medialane/sdk";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { AddressDisplay } from "@/components/shared/address-display";
import { CreatorScoreInline } from "@/components/rewards/creator-score-inline";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { CollectionCard, CollectionCardSkeleton, HiddenContentBanner, TabEmptyState } from "@medialane/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import {
  Activity,
  Image as ImageIcon,
  LayoutGrid,
  ShoppingBag,
  LayoutList,
  Flag,
} from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { ActivityRow } from "@/components/creator/activity-row";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "assets",      label: "Assets",      Icon: LayoutGrid },
  { id: "listings",    label: "Listings",    Icon: ShoppingBag },
  { id: "collections", label: "Collections", Icon: LayoutList },
{ id: "activity",    label: "Activity",    Icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CreatorPageClient() {
  const { address } = useParams<{ address: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("assets");
  const usdPrices = useUsdPrices();
  const [reportOpen,    setReportOpen]    = useState(false);
  const [listTarget, setListTarget] = useState<{ contract: string; tokenId: string; name?: string; image?: string | null } | null>(null);

  const addr = address ?? null;

  const { address: walletAddress } = useWalletNativeSession();
  const isOwner = !!walletAddress && !!address &&
    normalizeAddress("STARKNET", walletAddress) === normalizeAddress("STARKNET", address);

  const { data: hiddenStatus } = useSWR<{ isHidden: boolean }>(
    address ? `/api/proxy/v1/creators/${address}/hidden` : null,
    (url: string) => fetch(url).then(r => (r.ok ? r.json() : { isHidden: false }))
  );

  const { tokens,      isLoading: tokensLoading      } = useTokensByOwner(activeTab === "assets"      ? addr : null);
  const { orders,      isLoading: ordersLoading      } = useUserOrders(activeTab === "listings"    ? addr : null);
  const { collections, isLoading: collectionsLoading } = useCollectionsByOwner(activeTab === "collections" ? addr : null);
  const { activities,  isLoading: activitiesLoading  } = useActivitiesByAddress(activeTab === "activity" ? addr : null);

  const activeListings = orders.filter(
    (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721"
  );

  const tabBadge: Partial<Record<TabId, number>> = {
    ...(activeTab === "assets"      && !tokensLoading      && { assets:      tokens.length }),
    ...(activeTab === "listings"    && !ordersLoading      && { listings:    activeListings.length }),
    ...(activeTab === "collections" && !collectionsLoading && { collections: collections.length }),
    ...(activeTab === "activity" && !activitiesLoading && { activity: activities.length }),
  };

  return (
    <div className="min-h-screen pb-20">
      {hiddenStatus?.isHidden === true && <HiddenContentBanner />}

      <div className="px-6 pt-20 pb-2 flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AddressDisplay
              address={address ?? ""}
              chars={10}
              className="text-base tabular-nums font-semibold"
            />
            <CreatorScoreInline address={address} size="sm" />
          </div>
          {(() => {
            const parts: string[] = [];
            if (tabBadge.assets      !== undefined) parts.push(`${tabBadge.assets} ${tabBadge.assets === 1 ? "asset" : "assets"}`);
            if (tabBadge.listings    !== undefined && tabBadge.listings    > 0) parts.push(`${tabBadge.listings} ${tabBadge.listings === 1 ? "listing" : "listings"}`);
            if (tabBadge.collections !== undefined && tabBadge.collections > 0) parts.push(`${tabBadge.collections} ${tabBadge.collections === 1 ? "collection" : "collections"}`);
            if (parts.length === 0) return null;
            return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
          })()}
        </div>
        <div className="flex items-center gap-1 shrink-0 pt-1">
          <ShareButton title="Creator Profile" size="icon" variant="ghost" />
          <Button variant="ghost" size="icon" onClick={() => setReportOpen(true)} aria-label="Report this profile">
            <Flag className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="px-6">

        <ReportDialog
          target={{
            type: "CREATOR",
            address: address ?? "",
            name: addr ? `${addr.slice(0, 10)}…${addr.slice(-8)}` : undefined,
          }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />

        <div className="sticky top-0 z-10 -mx-6 px-6 bg-background/75 backdrop-blur-sm border-b border-border">
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
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold rounded-full px-1.5 py-px min-w-[18px] text-center tabular-nums",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">

          {activeTab === "assets" && (
            tokensLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
              </div>
            ) : tokens.length === 0 ? (
              <TabEmptyState
                icon={ImageIcon}
                heading="No assets yet"
                body="This creator hasn't minted any digital assets on Medialane yet."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokens.map((t) => {
                  const listingOrder = t.activeOrders?.find((o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155");
                  return (
                    <TokenCard
                      key={`${t.contractAddress}-${t.tokenId}`}
                      token={t}
                      isOwner={isOwner}
                      usdValue={usdValueFor(listingOrder?.price.formatted, listingOrder?.price.currency, usdPrices)}
                      onList={isOwner ? (t: ApiToken) => setListTarget({
                        contract: t.contractAddress,
                        tokenId: t.tokenId,
                        name: t.metadata?.name ?? undefined,
                        image: t.metadata?.image ?? null,
                      }) : undefined}
                    />
                  );
                })}
              </div>
            )
          )}

          {activeTab === "listings" && (
            ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <TabEmptyState
                icon={ShoppingBag}
                heading="No active listings"
                body="This creator has no digital assets listed for sale right now."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeListings.map((o) => (
                  <ListingCard key={o.orderHash} order={o} />
                ))}
              </div>
            )
          )}

          {activeTab === "collections" && (
            collectionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
              </div>
            ) : collections.length === 0 ? (
              <TabEmptyState
                icon={LayoutList}
                heading="No collections yet"
                body="This creator hasn't deployed any collections on Medialane yet."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((c) => (
                  <CollectionCard key={c.contractAddress} collection={c} />
                ))}
              </div>
            )
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
                <TabEmptyState
                  icon={Activity}
                  heading="No activity yet"
                  body="onchain events for this creator will appear here as they happen."
                />
              ) : (
                <div>
                  {activities.map((a, i) => (
                    <ActivityRow
                      key={i}
                      event={a}
                      isLast={i === activities.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {listTarget && (
        <ListingDialog
          open={!!listTarget}
          onOpenChange={(v) => { if (!v) setListTarget(null); }}
          assetContract={listTarget.contract}
          tokenId={listTarget.tokenId}
          tokenName={listTarget.name}
          tokenImage={listTarget.image ?? null}
        />
      )}
    </div>
  );
}

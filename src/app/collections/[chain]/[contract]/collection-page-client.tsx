"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCollection, useCollectionTokens, useOrders, AssetCard, AssetCardSkeleton, LoadMoreSentinel, isLivingRenderCollection, HiddenContentBanner, CollectionHeader, ClubOwnerActions, OrderSortControl, sortOrders, type OrderSort, useCollectionProfile, CollectionActivityTab, CollectionTraitsTab } from "@medialane/ui";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { assetHref } from "@/lib/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@medialane/ui/tabs";
import { Loader2, Inbox, Lock, Unlock, Play, FileText, Link2, Sparkles, Settings, ShoppingBag, Music, Radio, UserRoundCog } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { ReportDialog } from "@/components/report-dialog";
import { CollectionFilters } from "@/components/collection/collection-filters";
import { GatedContentHero } from "@/components/collection/gated-content-hero";
import { OwnerSetupPanel } from "@medialane/ui/owner-setup-panel";
import { TransferCollectionOwnershipDialog } from "@/components/collection/transfer-ownership-dialog";
import { MakeOfferPicker } from "@/components/collection/make-offer-picker";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import { useGatedContent, type GatedContentState } from "@/hooks/use-gated-content";
import { CollectionServiceAction } from "@/components/services/collection-service-action";
import { TicketOwnerActions } from "@/components/tickets/ticket-owner-actions";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { getService, normalizeAddress } from "@medialane/sdk";
import type { ApiToken, ApiOrder, Chain, CollectionTokensSort } from "@medialane/sdk";

const PAGE_SIZE = 24;

function CollectionItems({ contract, activeListings }: { contract: string; activeListings: ApiOrder[] }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CollectionTokensSort>("recent");
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const { tokens, meta, isLoading } = useCollectionTokens(contract, page, PAGE_SIZE, sort);

  function handleSortChange(next: CollectionTokensSort) {
    setSort(next);
    setPage(1);
    setAllTokens([]);
  }

  const usdPrices = useUsdPrices();

  const listingByTokenId = useMemo(() => {
    const map = new Map<string, ApiOrder>();
    for (const o of activeListings) {
      if (o.nftTokenId) map.set(o.nftTokenId, o);
    }
    return map;
  }, [activeListings]);

  useEffect(() => {
    if (tokens.length > 0) {
      setAllTokens((prev) => {
        const ids = new Set(prev.map((t) => `${t.contractAddress}-${t.tokenId}`));
        const next = tokens.filter((t) => !ids.has(`${t.contractAddress}-${t.tokenId}`));
        return page === 1 ? tokens : [...prev, ...next];
      });
    }
  }, [tokens, page]);

  const enrichedTokens = useMemo(() => {
    if (listingByTokenId.size === 0) return allTokens;
    return allTokens.map((t) => {
      const listing = listingByTokenId.get(t.tokenId);
      if (!listing || (t.activeOrders?.length ?? 0) > 0) return t;
      return { ...t, activeOrders: [listing] };
    });
  }, [allTokens, listingByTokenId]);

  const filteredTokens = useMemo(() => {
    const filterEntries = Object.entries(selectedFilters);
    if (filterEntries.length === 0) return enrichedTokens;
    return enrichedTokens.filter((token) => {
      const attrs = Array.isArray(token.metadata?.attributes)
        ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
        : [];

      return filterEntries.every(([traitType, values]) =>
        attrs.some((a) => a.trait_type === traitType && values.includes(String(a.value)))
      );
    });
  }, [enrichedTokens, selectedFilters]);

  const hasMore = meta ? allTokens.length < meta.total! : false;

  if (isLoading && allTokens.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => <AssetCardSkeleton key={i} />)}
      </div>
    );
  }

  if (allTokens.length === 0) {
    return (
      <EmptyState
        title="No items yet"
        body="Tokens in this collection will appear here once indexed."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <CollectionFilters
            tokens={allTokens}
            selected={selectedFilters}
            onChange={setSelectedFilters}
            sort={sort}
            onSortChange={handleSortChange}
          />
        </div>
        {filteredTokens.length === 0 && Object.keys(selectedFilters).length > 0 ? (
          <EmptyState
            title="No items match these filters"
            body="Try removing some filters to see more results."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredTokens.map((t) => {
              const listing = t.activeOrders?.find(
                (o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155"
              );
              return (
                <AssetCard
                  key={`${t.contractAddress}-${t.tokenId}`}
                  href={assetHref(t.chain as Chain, t.contractAddress, t.tokenId)}
                  name={t.metadata?.name || `Token #${t.tokenId}`}
                  image={t.metadata?.image}
                  animationUrl={t.metadata?.animationUrl}
                  live={isLivingRenderCollection(t.chain as Chain, t.contractAddress)}
                  ipType={t.metadata?.ipType}
                  price={listing ? {
                    ...listing.price,
                    usdValue: usdValueFor(listing.price?.formatted, listing.price?.currency, usdPrices),
                  } : null}
                  fallbackId={t.tokenId}
                  indexing={
                    t.metadataStatus === "PENDING" || t.metadataStatus === "FETCHING"
                  }
                />
              );
            })}
          </div>
        )}
        <LoadMoreSentinel
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={() => setPage((p) => p + 1)}
        />
      </div>
    </>
  );
}

export default function CollectionPageClient() {
  const { contract } = useParams<{ contract: string }>();
  const [reportOpen, setReportOpen] = useState(false);
  const [ownershipTransferOpen, setOwnershipTransferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assets");
  const [marketSubTab, setMarketSubTab] = useState<"listings" | "offers">("listings");
  const [provenanceSubTab, setProvenanceSubTab] = useState<"activity" | "traits">("activity");
  const [listingsSort, setListingsSort] = useState<OrderSort>("recent");
  const [offersSort, setOffersSort] = useState<OrderSort>("recent");
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const handleBuy = (o: ApiOrder) => { setBuyOrder(o); setPurchaseOpen(true); };

  const { address: walletAddress } = useWalletNativeSession();
  const { collection, isLoading: colLoading } = useCollection(contract);
  const { profile } = useCollectionProfile(contract);
  const gatedState = useGatedContent(profile?.hasGatedContent ? contract : undefined);
  const { orders, isLoading: ordersLoading } = useOrders({
    collection: contract,
    status: "ACTIVE",
    sort: "recent",
    limit: 100,
  });


  const activeListings = orders.filter((o) => o.status === "ACTIVE" && (o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155"));
  const activeBids = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20");

  return (
    <div className="relative z-0 min-h-screen">
      {(collection as { isHidden?: boolean } | null | undefined)?.isHidden && <HiddenContentBanner />}

      <div className="px-4 sm:px-6 pt-20 pb-6">
        <CollectionHeader collection={collection} loading={colLoading} onReportClick={() => setReportOpen(true)}>
          {collection && walletAddress && collection.owner && normalizeAddress("STARKNET", collection.owner) === normalizeAddress("STARKNET", walletAddress) && (
            <div className="flex flex-wrap items-center gap-2">
              {getService(collection.service)?.id === "ip-tickets" && (
                <TicketOwnerActions
                  contractAddress={collection.contractAddress}
                  owner={collection.owner}
                />
              )}
              {getService(collection.service)?.id === "ip-club" && (
                <ClubOwnerActions
                  contractAddress={collection.contractAddress}
                  isOwner
                />
              )}
              {collection.standard === "ERC1155" && getService(collection.service)?.id === "mip-erc1155" && (
                <Link
                  href={`/launchpad/nfteditions/${contract}/mint`}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white bg-brand-purple hover:brightness-110 active:scale-[0.98] transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Mint editions
                </Link>
              )}
              <Link
                href={`/portfolio/collections/${contract}/settings`}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-muted active:scale-[0.98] transition text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </div>
          )}
          {collection && (
            <CollectionServiceAction
              service={collection.service}
              contractAddress={collection.contractAddress}
            />
          )}
        </CollectionHeader>
      </div>

      {collection && (
        <ReportDialog
          target={{
            type: "COLLECTION",
            contract: collection.contractAddress,
            name: collection.name ?? undefined,
          }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}

      {!colLoading && collection && profile && (
        <GatedContentHero
          profile={profile}
          gatedState={gatedState}
          onViewExclusive={() => setActiveTab("exclusive")}
        />
      )}

      <div className="px-4 sm:px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-0 z-10 pt-3 pb-1">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="assets" className="flex-1 sm:flex-none">
                Assets{collection?.totalSupply ? ` (${collection.totalSupply.toLocaleString()})` : ""}
              </TabsTrigger>
              <TabsTrigger value="market" className="flex-1 sm:flex-none">
                Market{!ordersLoading && (activeListings.length + activeBids.length) > 0 && ` (${activeListings.length + activeBids.length})`}
              </TabsTrigger>
              <TabsTrigger value="provenance" className="flex-1 sm:flex-none">
                Provenance
              </TabsTrigger>
              {profile?.hasGatedContent && (
                <TabsTrigger value="exclusive" className="flex-1 sm:flex-none gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Exclusive
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="assets" className="mt-4">
            <CollectionItems contract={contract} activeListings={activeListings} />
          </TabsContent>

          <TabsContent value="market" className="mt-4">
            <Tabs value={marketSubTab} onValueChange={(v) => setMarketSubTab(v as "listings" | "offers")}>
              <TabsList className="h-9">
                <TabsTrigger value="listings" className="text-xs px-3 py-1">
                  Listings{!ordersLoading && activeListings.length > 0 && ` (${activeListings.length})`}
                </TabsTrigger>
                <TabsTrigger value="offers" className="text-xs px-3 py-1">
                  Offers{!ordersLoading && activeBids.length > 0 && ` (${activeBids.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="mt-4">
                {ordersLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
                  </div>
                ) : activeListings.length === 0 ? (
                  <EmptyState
                    title="No active listings"
                    body="When items in this collection are listed for sale, they'll appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <OrderSortControl value={listingsSort} onChange={setListingsSort} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {sortOrders(activeListings, listingsSort).map((o) => {
                        const isOwner = !!walletAddress && !!o.offerer &&
                          normalizeAddress("STARKNET", o.offerer) === normalizeAddress("STARKNET", walletAddress);
                        return <ListingCard key={o.orderHash} order={o} onBuy={isOwner ? undefined : handleBuy} />;
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="offers" className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <div />
                  <div className="flex items-center gap-2">
                    {!ordersLoading && activeBids.length > 0 && (
                      <OrderSortControl value={offersSort} onChange={setOffersSort} />
                    )}
                    <MakeOfferPicker contract={contract} />
                  </div>
                </div>
                {ordersLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
                  </div>
                ) : activeBids.length === 0 ? (
                  <EmptyState
                    title="No active offers"
                    body="Make the first offer, or check back when collectors start bidding."
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {sortOrders(activeBids, offersSort).map((o) => (
                      <ListingCard key={o.orderHash} order={o} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="provenance" className="mt-4">
            {collection?.standard && (collection.totalSupply ?? 0) > 1 ? (
              <Tabs value={provenanceSubTab} onValueChange={(v) => setProvenanceSubTab(v as "activity" | "traits")}>
                <TabsList className="h-9">
                  <TabsTrigger value="activity" className="text-xs px-3 py-1">Activity</TabsTrigger>
                  <TabsTrigger value="traits" className="text-xs px-3 py-1">Traits</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-4">
                  <CollectionActivityTab contract={contract} />
                </TabsContent>

                <TabsContent value="traits" className="mt-4">
                  <CollectionTraitsTab contract={contract} />
                </TabsContent>
              </Tabs>
            ) : (
              <CollectionActivityTab contract={contract} />
            )}
          </TabsContent>

          {profile?.hasGatedContent && (
            <TabsContent value="exclusive" className="mt-4">
              <GatedContentPanel
                state={gatedState}
                onBrowseListings={() => { setMarketSubTab("listings"); setActiveTab("market"); }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {!colLoading && collection && walletAddress && collection.owner &&
        normalizeAddress("STARKNET", collection.owner) === normalizeAddress("STARKNET", walletAddress) && (
        <>
          <OwnerSetupPanel
            contract={contract}
            profile={profile ?? null}
          />

          {collection.collectionId &&
            collection.standard === "ERC721" &&
            collection.createdAt >= "2026-05-14" && (
            <div className="px-4 sm:px-6 -mt-2 mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOwnershipTransferOpen(true)}
                className="gap-2"
              >
                <UserRoundCog className="h-4 w-4" />
                Transfer ownership
              </Button>
              <TransferCollectionOwnershipDialog
                collectionId={collection.collectionId}
                currentOwner={collection.owner!}
                collectionName={collection.name}
                open={ownershipTransferOpen}
                onOpenChange={setOwnershipTransferOpen}
              />
            </div>
          )}
        </>
      )}

      {buyOrder && (
        <PurchaseDialog
          order={buyOrder}
          open={purchaseOpen}
          onOpenChange={(open) => { setPurchaseOpen(open); if (!open) setBuyOrder(null); }}
        />
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 max-w-xs">{body}</p>
    </div>
  );
}

const CONTENT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; cta: string }> = {
  VIDEO:    { icon: <Play className="h-5 w-5" />,     cta: "Watch now" },
  AUDIO:    { icon: <Music className="h-5 w-5" />,    cta: "Listen now" },
  STREAM:   { icon: <Radio className="h-5 w-5" />,    cta: "Watch live" },
  DOCUMENT: { icon: <FileText className="h-5 w-5" />, cta: "Open document" },
  LINK:     { icon: <Link2 className="h-5 w-5" />,    cta: "Access content" },
};

function GatedContentPanel({
  state,
  onBrowseListings,
}: {
  state: GatedContentState;
  onBrowseListings: () => void;
}) {
  if (state.status === "not_signed_in") {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-base font-semibold">Secure your account to unlock</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            This collection has exclusive content available only to verified holders.
            Secure your account so we can check your holdings.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Already a holder? We&apos;ll verify automatically.
        </p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="py-16 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Verifying your holdings…</p>
      </div>
    );
  }

  if (state.status === "not_holder") {
    return (
      <div className="py-16 flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-base font-semibold">Holders only</p>
          <p className="text-sm text-muted-foreground mt-1">
            You need at least one token from this collection to access the exclusive content.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <a
            href="#market"
            onClick={(e) => { e.preventDefault(); onBrowseListings(); }}
            className="inline-flex items-center gap-2 bg-foreground text-background hover:opacity-90 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse listings
          </a>
          <p className="text-xs text-muted-foreground">
            Get a token and come back to unlock.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t verify your holdings</p>
        <p className="text-xs text-muted-foreground">
          Something went wrong while checking your wallet. Try refreshing the page.
        </p>
      </div>
    );
  }

  const { content } = state;
  const typeConfig = content.type ? (CONTENT_TYPE_CONFIG[content.type] ?? CONTENT_TYPE_CONFIG.LINK) : CONTENT_TYPE_CONFIG.LINK;

  return (
    <div className="py-8 flex flex-col items-center gap-6 text-center max-w-md mx-auto">

      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <Unlock className="h-10 w-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-emerald-500">
          ✓ Verified holder
        </p>
        <h3 className="text-xl font-bold">{content.title ?? "Exclusive Content"}</h3>
        <p className="text-sm text-muted-foreground">
          Welcome back. Your access is verified — click below to enjoy your exclusive content.
        </p>
      </div>

      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20"
      >
        {typeConfig.icon}
        {typeConfig.cta}
      </a>

      <p className="text-[10px] text-muted-foreground/60">
        This link is exclusive to verified holders of this collection.
      </p>
    </div>
  );
}

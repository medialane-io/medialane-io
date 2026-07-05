"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { AssetCard, AssetCardSkeleton, LoadMoreSentinel } from "@medialane/ui";
import { assetHref } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressDisplay } from "@/components/shared/address-display";
import { Loader2, Flag, Inbox, Lock, Unlock, Play, FileText, Link2, Sparkles, Settings, ShoppingBag, Music, Radio, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { TraitFilter } from "@/components/collection/trait-filter";
import { GatedContentHero } from "@/components/collection/gated-content-hero";
import { OwnerSetupPanel } from "@/components/collection/owner-setup-panel";
import { CreatorScoreInline } from "@/components/rewards/creator-score-inline";
import { TransferCollectionOwnershipDialog } from "@/components/collection/transfer-ownership-dialog";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import Image from "next/image";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import { useCollectionProfile } from "@/hooks/use-profiles";
import { useGatedContent, type GatedContentState } from "@/hooks/use-gated-content";
import { CollectionServiceAction } from "@/components/services/collection-service-action";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { useSessionKey } from "@/hooks/use-session-key";
import type { ApiToken, ApiOrder, Chain } from "@medialane/sdk";

const PAGE_SIZE = 24;

const CURRENCY_ICONS: Record<string, string> = {
  STRK: "/strk.svg",
  ETH: "/eth.svg",
  USDC: "/usdc.svg",
  USDT: "/usdt.svg",
  WBTC: "/btc.svg",
};

function CurrencyIcon({ symbol, size = 16 }: { symbol: string; size?: number }) {
  const src = CURRENCY_ICONS[symbol?.toUpperCase()];
  if (!src) return <span className="text-xs font-semibold text-muted-foreground">{symbol}</span>;
  return <Image src={src} alt={symbol} width={size} height={size} className="inline-block shrink-0" />;
}

/**
 * Parse a backend price string like "0.000012000000 WBTC" into a clean display + symbol.
 * - Strips trailing zeros from the decimal part (e.g. "1.500000" → "1.50")
 * - Guards against pre-fix raw-wei values stored in the DB (> 1e12 → "—")
 */
function parsePriceDisplay(raw: string | null | undefined): { numStr: string; symbol: string | null } {
  if (!raw) return { numStr: "—", symbol: null };
  const parts = raw.trim().split(" ");
  const sym = parts.length > 1 ? parts[parts.length - 1] : null;
  const numericPart = sym ? parts.slice(0, -1).join(" ") : raw;
  const num = Number(numericPart);
  if (isNaN(num)) return { numStr: "—", symbol: sym };
  // Implausibly large → likely raw wei stored before the stats fix
  if (num > 1e12) return { numStr: "—", symbol: null };
  // Format with adaptive decimals, then strip trailing zeros after decimal point
  const formatted = formatDisplayPrice(numericPart);
  if (!formatted || formatted === "—") return { numStr: "—", symbol: sym };
  // Remove trailing zeros: "0.000012000000" → "0.000012", "1.500000" → "1.50"
  const clean = formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return { numStr: clean || "—", symbol: sym };
}

function CollectionItems({ contract, activeListings }: { contract: string; activeListings: ApiOrder[] }) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const { tokens, meta, isLoading } = useCollectionTokens(contract, page, PAGE_SIZE);

  // Build tokenId → listing map so listed items can show their price
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

  // Enrich tokens with listing data so listed items show Buy button
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
      return filterEntries.every(([traitType, value]) =>
        attrs.some((a) => a.trait_type === traitType && String(a.value) === value)
      );
    });
  }, [enrichedTokens, selectedFilters]);

  const hasMore = meta ? allTokens.length < meta.total! : false;

  if (isLoading && allTokens.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
      <div className="space-y-4">
        <TraitFilter
          tokens={allTokens}
          selected={selectedFilters}
          onChange={setSelectedFilters}
        />
        {filteredTokens.length === 0 && Object.keys(selectedFilters).length > 0 ? (
          <EmptyState
            title="No items match these filters"
            body="Try removing some filters to see more results."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  ipType={t.metadata?.ipType}
                  price={listing ? listing.price : null}
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
  const [activeTab, setActiveTab] = useState("items");
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const handleBuy = (o: ApiOrder) => { setBuyOrder(o); setPurchaseOpen(true); };
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const { walletAddress } = useSessionKey();
  const { collection, isLoading: colLoading } = useCollection(contract);
  const { profile } = useCollectionProfile(contract);
  const gatedState = useGatedContent(profile?.hasGatedContent ? contract : undefined);
  const { orders, isLoading: ordersLoading } = useOrders({
    collection: contract,
    status: "ACTIVE",
    sort: "recent",
    limit: 100,
  });

  const bannerUrl = collection?.image ? ipfsToHttp(collection.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(bannerUrl);

  useEffect(() => {
    const el = descRef.current;
    if (!el || !collection?.description) return;
    setDescOverflows(el.scrollHeight > 80);
    setDescClamped(true);
  }, [collection?.description]);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && (o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155"));
  const activeBids = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20");

  const floorParsed = parsePriceDisplay(collection?.floorPrice);
  const volumeParsed = parsePriceDisplay(collection?.totalVolume);

  const stats = [
    { label: "Items",   display: collection?.totalSupply != null ? String(collection.totalSupply) : "—", symbol: null },
    { label: "Holders", display: collection?.holderCount  != null ? String(collection.holderCount)  : "—", symbol: null },
    { label: "Floor",   display: floorParsed.numStr,  symbol: floorParsed.symbol },
    { label: "Volume",  display: volumeParsed.numStr, symbol: volumeParsed.symbol },
  ];

  return (
    <div
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
      className="relative z-0 min-h-screen"
    >
      {/* Atmospheric blur background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: dynamicTheme
              ? `hsl(var(--dynamic-primary) / 0.08)`
              : "transparent",
          }}
        />
      </div>

      {(collection as { isHidden?: boolean } | null | undefined)?.isHidden && <HiddenContentBanner />}

      {/* Hidden extraction img for dominant color */}
      {bannerUrl && (
        <img
          ref={imgRef}
          src={bannerUrl}
          crossOrigin="anonymous"
          aria-hidden
          alt=""
          style={{ display: "none" }}
        />
      )}

      {/* ── Full-bleed hero banner ── */}
      {colLoading ? (
        <Skeleton className="w-full h-[50svh]" />
      ) : (
        <div className="relative w-full overflow-hidden h-[50svh]">
          {/* Parallax / gradient fill */}
          <ParallaxBanner imageUrl={bannerUrl} contract={contract} />

          {/* Bottom overlay: title + stat chips — backdrop blur only, no borders, no scrim */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 z-10">

            {/* Title — plain text with a subtle shadow, no background box */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight"
              style={{ textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}>
              {collection?.name ?? "Unnamed Collection"}
            </h1>

            {/* Stat chips — theme-aware frosted glass so they read in both light and
                dark (was hardcoded dark). Floor/Volume show the currency icon only. */}
            <div className="flex gap-2 flex-wrap">
              {stats.map(({ label, display, symbol }) => (
                <div
                  key={label}
                  className={cn(
                    "bg-background/75 backdrop-blur-md rounded-xl px-3 py-2 flex flex-col justify-center shrink-0",
                    symbol ? "min-w-[80px]" : "min-w-[60px] items-center text-center"
                  )}
                >
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                  {symbol ? (
                    <div className="flex items-center gap-1.5">
                      <CurrencyIcon symbol={symbol} size={15} />
                      <p className="text-sm sm:text-base font-bold text-foreground tabular-nums leading-tight truncate">
                        {display}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg font-bold text-foreground tabular-nums leading-tight">
                      {display}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Meta section — flat layout (no boxed panel, no extra padding); identity
          on the left, a lightweight right-aligned utility cluster fills the width ── */}
      {!colLoading && collection && (
        <div className="px-4 sm:px-6 pt-5 pb-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            {/* Left — identity & description */}
            <div className="space-y-3 min-w-0 lg:max-w-2xl">
              {/* Type + symbol badges (moved down out of the hero, grouped with the meta) */}
              {(collection.symbol || collection.standard) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {collection.standard === "ERC1155" ? (
                    <span className="text-[11px] font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-300 rounded-full px-2.5 py-0.5">
                      Multi-edition NFT
                    </span>
                  ) : collection.standard === "ERC721" ? (
                    <span className="text-[11px] font-semibold bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
                      Single NFT
                    </span>
                  ) : null}
                  {collection.symbol && (
                    <span className="font-mono text-[11px] bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
                      {collection.symbol}
                    </span>
                  )}
                </div>
              )}

              {/* By owner — links to the address-based account route
                  (/creator/[slug] is username-only; addresses 404 there) */}
              {collection.owner && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>by</span>
                  <Link href={`/account/${collection.owner}`} className="hover:underline underline-offset-2">
                    <AddressDisplay
                      address={collection.owner}
                      chars={6}
                      showCopy={false}
                      className="font-medium text-foreground"
                    />
                  </Link>
                  <CreatorScoreInline address={collection.owner} size="sm" />
                </div>
              )}

              {collection.description && (
                <>
                  <p
                    ref={descRef}
                    className={cn(
                      "text-sm text-muted-foreground leading-relaxed",
                      descClamped && !descExpanded && "line-clamp-3"
                    )}
                  >
                    {collection.description}
                  </p>
                  {descOverflows && (
                    <button
                      onClick={() => setDescExpanded((e) => !e)}
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {descExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </>
              )}

              {/* Service action slot (POP claim, Drop mint, etc.) */}
              <CollectionServiceAction
                service={collection.service}
                contractAddress={collection.contractAddress}
              />
            </div>

            {/* Right — flat utility cluster (no panel/chrome); owner actions,
                contract, share & report, right-aligned on desktop */}
            <div className="flex flex-col gap-2.5 shrink-0 lg:items-end">
              {walletAddress && collection.owner?.toLowerCase() === walletAddress.toLowerCase() && (
                <div className="flex items-center gap-2">
                  {collection.standard === "ERC1155" && (
                    <Link
                      href={`/launchpad/nfteditions/${contract}/mint`}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-700 active:scale-[0.98] transition"
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

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground/50">Contract</span>
                <AddressDisplay
                  address={collection.contractAddress ?? ""}
                  chars={6}
                  className="text-xs text-muted-foreground"
                />
                <ShareButton title={collection.name ?? "Collection"} variant="ghost" size="icon" />
                <button
                  onClick={() => setReportOpen(true)}
                  title="Report this collection"
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <ReportDialog
            target={{
              type: "COLLECTION",
              contract: collection.contractAddress,
              name: collection.name ?? undefined,
            }}
            open={reportOpen}
            onOpenChange={setReportOpen}
          />
        </div>
      )}

      {/* ── Gated content hero — visible to all visitors ── */}
      {!colLoading && collection && profile && (
        <GatedContentHero
          profile={profile}
          gatedState={gatedState}
          onViewExclusive={() => setActiveTab("exclusive")}
        />
      )}

      {/* ── Owner setup panel — visible only to collection owner ── */}
      {!colLoading && collection && walletAddress &&
        collection.owner?.toLowerCase() === walletAddress.toLowerCase() && (
        <>
          <OwnerSetupPanel
            contract={contract}
            profile={profile ?? null}
          />
          {/* Per-collection ownership handoff — audited MIP registry only.
              Cutover gate avoids surfacing on legacy v2 collections. */}
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

      {/* ── Tabs ── */}
      <div className="px-4 sm:px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-0 z-10 pt-3 pb-1">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="items" className="flex-1 sm:flex-none">
                Items{collection?.totalSupply ? ` (${collection.totalSupply.toLocaleString()})` : ""}
              </TabsTrigger>
              <TabsTrigger value="listings" className="flex-1 sm:flex-none">
                Listings{!ordersLoading && activeListings.length > 0 && ` (${activeListings.length})`}
              </TabsTrigger>
              <TabsTrigger value="offers" className="flex-1 sm:flex-none">
                Offers{!ordersLoading && activeBids.length > 0 && ` (${activeBids.length})`}
              </TabsTrigger>
              {profile?.hasGatedContent && (
                <TabsTrigger value="exclusive" className="flex-1 sm:flex-none gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Exclusive
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="items" className="mt-4">
            <CollectionItems contract={contract} activeListings={activeListings} />
          </TabsContent>

          <TabsContent value="listings" className="mt-4">
            {ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <EmptyState
                title="No active listings"
                body="When items in this collection are listed for sale, they'll appear here."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {activeListings.map((o) => {
                  const isOwner = !!walletAddress && !!o.offerer &&
                    o.offerer.toLowerCase() === walletAddress.toLowerCase();
                  return <ListingCard key={o.orderHash} order={o} isOwner={isOwner} onBuy={isOwner ? undefined : handleBuy} />;
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="mt-4">
            {ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeBids.length === 0 ? (
              <EmptyState
                title="No active offers"
                body="Collection-wide offers will appear here when placed."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {activeBids.map((o) => {
                  const isOwner = !!walletAddress && !!o.offerer &&
                    o.offerer.toLowerCase() === walletAddress.toLowerCase();
                  return <ListingCard key={o.orderHash} order={o} isOwner={isOwner} />;
                })}
              </div>
            )}
          </TabsContent>

          {profile?.hasGatedContent && (
            <TabsContent value="exclusive" className="mt-4">
              <GatedContentPanel state={gatedState} contract={contract} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Inline buy for listed items (Listings tab) */}
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ParallaxBanner({ imageUrl, contract }: { imageUrl: string | null; contract: string }) {
  const { scrollY } = useScroll();
  const shouldReduce = useReducedMotion();
  const y = useTransform(scrollY, [0, 500], [0, shouldReduce ? 0 : 150]);

  if (!imageUrl) {
    return <div className="absolute inset-0 w-full h-full bg-muted" />;
  }

  return (
    <motion.img
      src={imageUrl}
      alt=""
      aria-hidden
      style={{ y }}
      className="absolute inset-0 w-full h-full object-cover scale-110"
    />
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

function GatedContentPanel({ state, contract }: { state: GatedContentState; contract: string }) {
  if (state.status === "not_signed_in") {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-base font-semibold">Sign in to unlock</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            This collection has exclusive content available only to verified holders.
            Sign in so we can check your wallet.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Already a holder? Sign in and we&apos;ll verify automatically.
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
            href="#listings"
            onClick={(e) => { e.preventDefault(); document.querySelector('[data-value="listings"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })); }}
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
      {/* Unlock badge */}
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <Unlock className="h-10 w-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
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

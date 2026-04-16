"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressDisplay } from "@/components/shared/address-display";
import { ArrowLeft, Loader2, Flag, Inbox, Lock, Unlock, Play, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { TraitFilter } from "@/components/collection/trait-filter";
import { SweepBar } from "@/components/collection/sweep-bar";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import Image from "next/image";
import { ipfsToHttp, formatDisplayPrice, cn, checkIsOwner } from "@/lib/utils";
import { computeRarity } from "@/lib/rarity";
import { useCollectionProfile } from "@/hooks/use-profiles";
import { useGatedContent, type GatedContentState } from "@/hooks/use-gated-content";
import { CollectionServiceAction } from "@/components/services/collection-service-action";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { CancelOrderDialog } from "@/components/marketplace/cancel-order-dialog";
import { useSessionKey } from "@/hooks/use-session-key";
import type { ApiToken, ApiOrder } from "@medialane/sdk";

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
  if (!src) return <span className="text-xs font-semibold text-white/70">{symbol}</span>;
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
  const { tokens, meta, isLoading, mutate } = useCollectionTokens(contract, page, PAGE_SIZE);
  // SWR deduplicates — the parent also calls this hook; no extra network request.
  const { collection } = useCollection(contract);

  // Build tokenId → listing map so Items tab can show Buy buttons for listed tokens
  const listingByTokenId = useMemo(() => {
    const map = new Map<string, ApiOrder>();
    for (const o of activeListings) {
      if (o.nftTokenId) map.set(o.nftTokenId, o);
    }
    return map;
  }, [activeListings]);

  // Ownership + dialogs — same pattern as portfolio/assets-grid
  const { walletAddress } = useSessionKey();
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cancelToken, setCancelToken] = useState<ApiToken | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleList = (token: ApiToken) => { setSelectedToken(token); setListOpen(true); };
  const handleTransfer = (token: ApiToken) => { setTransferToken(token); setTransferOpen(true); };
  const handleCancelRequest = (token: ApiToken) => { setCancelToken(token); setCancelOpen(true); };

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

  const rarityMap = useMemo(() => computeRarity(allTokens), [allTokens]);
  const hasMore = meta ? allTokens.length < meta.total! : false;

  if (isLoading && allTokens.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
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
              // For ERC-1155 list responses, balances and owner are always null —
              // the API doesn't return per-holder data in collection token lists.
              // Show owner actions for all tokens when the user has a wallet;
              // the on-chain call will revert if they hold none.
              const isOwner = collection?.standard === "ERC1155"
                ? !!walletAddress
                : checkIsOwner(t, walletAddress);
              return (
                <TokenCard
                  key={`${t.contractAddress}-${t.tokenId}`}
                  token={t}
                  rarityTier={rarityMap.get(t.tokenId)?.tier}
                  isOwner={isOwner}
                  onList={isOwner ? handleList : undefined}
                  onTransfer={isOwner ? handleTransfer : undefined}
                  onCancel={isOwner ? handleCancelRequest : undefined}
                />
              );
            })}
          </div>
        )}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Load more
            </Button>
          </div>
        )}
      </div>

      {/* Owner dialogs */}
      {selectedToken && (
        <ListingDialog
          open={listOpen}
          onOpenChange={(o) => { setListOpen(o); if (!o) setSelectedToken(null); }}
          assetContract={selectedToken.contractAddress}
          tokenId={selectedToken.tokenId}
          tokenName={selectedToken.metadata?.name ?? undefined}
          tokenStandard={collection?.standard}
          onSuccess={() => { setListOpen(false); setSelectedToken(null); setPage(1); setAllTokens([]); mutate(); }}
        />
      )}
      {transferToken && (
        <TransferDialog
          open={transferOpen}
          onOpenChange={(o) => { setTransferOpen(o); if (!o) setTransferToken(null); }}
          contractAddress={transferToken.contractAddress}
          tokenId={transferToken.tokenId}
          tokenName={transferToken.metadata?.name ?? undefined}
          hasActiveListing={!!transferToken.activeOrders?.[0]}
          tokenStandard={collection?.standard}
          onSuccess={() => { setTransferOpen(false); setTransferToken(null); setPage(1); setAllTokens([]); mutate(); }}
        />
      )}
      <CancelOrderDialog
        order={cancelToken?.activeOrders?.[0] ?? null}
        open={cancelOpen}
        onOpenChange={(v) => { setCancelOpen(v); if (!v) setCancelToken(null); }}
        onSuccess={() => { setPage(1); setAllTokens([]); mutate(); }}
        variant="listing"
      />
    </>
  );
}

export default function CollectionPageClient() {
  const { contract } = useParams<{ contract: string }>();
  const [reportOpen, setReportOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

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

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
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

      {(collection as any)?.isHidden && <HiddenContentBanner />}

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
        <Skeleton className="w-full h-48 sm:aspect-video" />
      ) : (
        <div className="relative w-full overflow-hidden h-[80svh] sm:h-auto sm:aspect-video">
          {/* Parallax / gradient fill */}
          <ParallaxBanner imageUrl={bannerUrl} contract={contract} />

          {/* Back link — top-right */}
          <Link
            href="/collections"
            className="absolute top-12 sm:top-14 right-4 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white bg-black/20 hover:bg-black/35 dark:bg-black/30 dark:hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all z-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Collections
          </Link>

          {/* Bottom overlay: title + badges + stat chips, all glass, no scrim */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4 sm:pb-6 space-y-2.5 z-10">

            {/* Title — plain text with shadow, no background box */}
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}>
                {collection?.name ?? "Unnamed Collection"}
              </h1>
              {/* Symbol + Verified as small separate pills, not grouped in the title */}
              {collection?.symbol && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="font-mono text-[11px] bg-black/20 dark:bg-black/40 text-white/90 border border-white/15 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                    {collection.symbol}
                  </span>
                </div>
              )}
            </div>

            {/* Stat chips */}
            <div className="flex gap-2 flex-wrap">
              {stats.map(({ label, display, symbol }) => (
                <div
                  key={label}
                  className={cn(
                    "bg-black/25 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex flex-col justify-center shrink-0",
                    symbol ? "min-w-[88px]" : "min-w-[60px] items-center text-center"
                  )}
                >
                  <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">{label}</p>
                  {symbol ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <CurrencyIcon symbol={symbol} size={14} />
                        <p className="text-sm sm:text-base font-bold text-white tabular-nums leading-tight truncate">
                          {display}
                        </p>
                      </div>
                      <p className="text-[9px] text-white/40 mt-0.5 leading-none">{symbol}</p>
                    </>
                  ) : (
                    <p className="text-base sm:text-lg font-bold text-white tabular-nums leading-tight">
                      {display}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Meta section ── */}
      {!colLoading && collection && (
        <div className="px-4 sm:px-6 pt-4 pb-2 space-y-1.5">
          {collection.owner && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              <Link href={`/creator/${collection.owner}`} className="hover:underline underline-offset-2">
                <AddressDisplay
                  address={collection.owner}
                  chars={6}
                  showCopy={false}
                  className="font-medium text-foreground"
                />
              </Link>
            </div>
          )}

          {collection.description && (
            <>
              <p
                ref={descRef}
                className={cn(
                  "text-sm text-muted-foreground max-w-2xl leading-relaxed",
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
            source={collection.source}
            contractAddress={collection.contractAddress}
          />

          <div className="flex items-center gap-2 pt-0.5">
            <AddressDisplay
              address={collection.contractAddress ?? ""}
              chars={6}
              className="text-xs text-muted-foreground/70"
            />
            <ShareButton title={collection.name ?? "Collection"} variant="ghost" size="icon" />
            <button
              onClick={() => setReportOpen(true)}
              title="Report this collection"
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
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

      {/* ── Tabs ── */}
      <div className="px-4 sm:px-6 pb-12">
        <Tabs defaultValue="items">
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
            <SweepBar contract={contract} />
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
                {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
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
                {activeBids.map((o) => <ListingCard key={o.orderHash} order={o} />)}
              </div>
            )}
          </TabsContent>

          {profile?.hasGatedContent && (
            <TabsContent value="exclusive" className="mt-4">
              <GatedContentPanel state={gatedState} />
            </TabsContent>
          )}
        </Tabs>
      </div>
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
    const hex = contract.replace(/^0x/i, "");
    const a = `#${hex.slice(-6, -3).padStart(6, "a")}`;
    const b = `#${hex.slice(-3).padStart(6, "5")}`;
    return (
      <div
        className="absolute inset-0 w-full h-full"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      />
    );
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

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO: <Play className="h-5 w-5" />,
  AUDIO: <Play className="h-5 w-5" />,
  STREAM: <Play className="h-5 w-5" />,
  DOCUMENT: <FileText className="h-5 w-5" />,
  LINK: <Link2 className="h-5 w-5" />,
};

function GatedContentPanel({ state }: { state: GatedContentState }) {
  if (state.status === "not_signed_in") {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-center">
        <Lock className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Sign in to access exclusive content</p>
        <p className="text-xs text-muted-foreground/70 max-w-xs">
          This collection has exclusive content available to verified holders.
        </p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (state.status === "not_holder" || state.status === "error") {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-center">
        <Lock className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Holders only</p>
        <p className="text-xs text-muted-foreground/70 max-w-xs">
          You need to own at least one token from this collection to access exclusive content.
        </p>
      </div>
    );
  }

  const { content } = state;
  const icon = content.type ? (CONTENT_TYPE_ICONS[content.type] ?? <Link2 className="h-5 w-5" />) : <Link2 className="h-5 w-5" />;

  return (
    <div className="py-8 flex flex-col items-center gap-6 text-center max-w-sm mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
        <Unlock className="h-7 w-7" />
      </div>
      <div>
        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Holder exclusive</p>
        <h3 className="text-lg font-bold">{content.title ?? "Exclusive Content"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You&apos;re a verified holder. Click below to access.
        </p>
      </div>
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        {icon}
        {content.type === "VIDEO" || content.type === "STREAM" ? "Watch now"
          : content.type === "AUDIO" ? "Listen now"
          : content.type === "DOCUMENT" ? "Open document"
          : "Access content"}
      </a>
    </div>
  );
}

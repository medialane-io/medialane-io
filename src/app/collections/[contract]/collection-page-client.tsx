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
import { ArrowLeft, Loader2, Flag, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "@/components/report-dialog";
import { TraitFilter } from "@/components/collection/trait-filter";
import { SweepBar } from "@/components/collection/sweep-bar";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import { computeRarity } from "@/lib/rarity";
import type { ApiToken } from "@medialane/sdk";

const PAGE_SIZE = 24;

function CollectionItems({ contract }: { contract: string }) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const { tokens, meta, isLoading } = useCollectionTokens(contract, page, PAGE_SIZE);

  useEffect(() => {
    if (tokens.length > 0) {
      setAllTokens((prev) => {
        const ids = new Set(prev.map((t) => `${t.contractAddress}-${t.tokenId}`));
        const next = tokens.filter((t) => !ids.has(`${t.contractAddress}-${t.tokenId}`));
        return page === 1 ? tokens : [...prev, ...next];
      });
    }
  }, [tokens, page]);

  const filteredTokens = useMemo(() => {
    const filterEntries = Object.entries(selectedFilters);
    if (filterEntries.length === 0) return allTokens;
    return allTokens.filter((token) => {
      const attrs = Array.isArray(token.metadata?.attributes)
        ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
        : [];
      return filterEntries.every(([traitType, value]) =>
        attrs.some((a) => a.trait_type === traitType && String(a.value) === value)
      );
    });
  }, [allTokens, selectedFilters]);

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
          {filteredTokens.map((t) => (
            <TokenCard
              key={`${t.contractAddress}-${t.tokenId}`}
              token={t}
              rarityTier={rarityMap.get(t.tokenId)?.tier}
            />
          ))}
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

  const stats = [
    { label: "Items",   display: collection?.totalSupply != null ? String(collection.totalSupply) : "—" },
    { label: "Holders", display: collection?.holderCount  != null ? String(collection.holderCount)  : "—" },
    { label: "Floor",   display: formatDisplayPrice(collection?.floorPrice)  || "—" },
    { label: "Volume",  display: formatDisplayPrice(collection?.totalVolume) || "—" },
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

            {/* Stat chips — compact squares */}
            <div className="flex gap-2 flex-wrap">
              {stats.map(({ label, display }) => (
                <div
                  key={label}
                  className="bg-black/25 backdrop-blur-md border border-white/10 rounded-xl w-[72px] h-[72px] sm:w-20 sm:h-20 flex flex-col items-center justify-center text-center shrink-0"
                >
                  <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm sm:text-base font-semibold text-white tabular-nums leading-tight">
                    {display}
                  </p>
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

          <div className="flex items-center gap-2 pt-0.5">
            <AddressDisplay
              address={collection.contractAddress ?? ""}
              chars={6}
              className="text-xs text-muted-foreground/70"
            />
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
            </TabsList>
          </div>

          <TabsContent value="items" className="mt-4">
            <CollectionItems contract={contract} />
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

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion, useInView } from "framer-motion";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressDisplay } from "@/components/shared/address-display";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { ApiToken } from "@medialane/sdk";
import type { DynamicTheme } from "@/lib/theme-utils";

const PAGE_SIZE = 24;

function CollectionItems({ contract }: { contract: string }) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
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

  const hasMore = meta ? allTokens.length < meta.total! : false;

  if (isLoading && allTokens.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
      </div>
    );
  }

  if (allTokens.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">No items indexed yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {allTokens.map((t) => (
          <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />
        ))}
      </div>
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
  const { collection, isLoading: colLoading } = useCollection(contract);
  const { orders, isLoading: ordersLoading } = useOrders({
    collection: contract,
    status: "ACTIVE",
    sort: "recent",
    limit: 100,
  });

  const bannerUrl = collection?.image ? ipfsToHttp(collection.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(bannerUrl);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
  const activeBids = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20");

  return (
    <div
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
      className="relative space-y-0"
    >
      {/* Hidden extraction img */}
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

      {/* Full-bleed collection banner */}
      {colLoading ? (
        <Skeleton className="w-full" style={{ height: "45vh", minHeight: "250px" }} />
      ) : (
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "45vh", minHeight: "250px" }}
        >
          {/* Parallax image */}
          <ParallaxBanner imageUrl={bannerUrl} />

          {/* Gradient overlay using dynamic color */}
          <div
            className="absolute inset-0"
            style={{
              background: dynamicTheme
                ? `linear-gradient(to bottom, hsl(var(--dynamic-primary) / 0.3) 0%, hsl(var(--background) / 0.95) 100%)`
                : `linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.95) 100%)`,
            }}
          />

          {/* Back link */}
          <Link
            href="/collections"
            className="absolute top-14 left-4 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all z-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Collections
          </Link>

          {/* Collection identity over the banner */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">
              {collection?.name ?? "Unnamed Collection"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {collection?.symbol && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {collection.symbol}
                </Badge>
              )}
              {collection?.isKnown && (
                <Badge className="mt-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {colLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : collection ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-5 bg-background/80 backdrop-blur-sm">
            {[
              {
                label: "Items",
                value: collection.totalSupply ?? null,
                display: collection.totalSupply != null ? String(collection.totalSupply) : "—",
                currency: undefined,
              },
              {
                label: "Holders",
                value: null,
                display: collection.holderCount != null ? String(collection.holderCount) : "—",
                currency: undefined,
              },
              {
                label: "Floor",
                value: null,
                display: formatDisplayPrice(collection.floorPrice) || "—",
                currency: undefined,
              },
              {
                label: "Volume",
                value: null,
                display: formatDisplayPrice(collection.totalVolume) || "—",
                currency: undefined,
              },
            ].map(({ label, value, display, currency }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                <CountUpStat value={value} display={display} currency={currency} dynamicTheme={dynamicTheme} />
              </div>
            ))}
          </div>

          {/* Creator credit */}
          {collection.owner && (
            <div className="px-6 py-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              <Link
                href={`/creator/${collection.owner}`}
                className="font-medium hover:underline text-foreground"
              >
                {collection.owner.slice(0, 6)}...{collection.owner.slice(-4)}
              </Link>
            </div>
          )}

          {/* Description */}
          {collection.description && (
            <p className="px-6 pb-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          )}

          {/* Contract address */}
          <div className="px-6 pb-2">
            <AddressDisplay
              address={collection.contractAddress ?? ""}
              chars={6}
              className="text-xs text-muted-foreground"
            />
          </div>
        </>
      ) : null}

      {/* Tabs */}
      <div className="px-6 pb-12">
        <Tabs defaultValue="items">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <TabsList>
              <TabsTrigger value="items">
                Items{collection?.totalSupply ? ` (${collection.totalSupply.toLocaleString()})` : ""}
              </TabsTrigger>
              <TabsTrigger value="listings">
                Listings{!ordersLoading && activeListings.length > 0 && ` (${activeListings.length})`}
              </TabsTrigger>
              <TabsTrigger value="offers">
                Offers{!ordersLoading && activeBids.length > 0 && ` (${activeBids.length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Items */}
          <TabsContent value="items" className="mt-6">
            <CollectionItems contract={contract} />
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ParallaxBanner({ imageUrl }: { imageUrl: string | null }) {
  const { scrollY } = useScroll();
  const shouldReduce = useReducedMotion();
  const y = useTransform(scrollY, [0, 500], [0, shouldReduce ? 0 : 150]);
  if (!imageUrl) return null;
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

function CountUpStat({
  value,
  display,
  currency,
  dynamicTheme,
}: {
  value: number | null;
  display: string;
  currency?: string;
  dynamicTheme: DynamicTheme | null;
}) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [shown, setShown] = useState(shouldReduce || value === null ? display : "0");

  useEffect(() => {
    if (shouldReduce || value === null || !isInView) return;
    let start = 0;
    const duration = 1000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setShown(String(Math.floor(progress * value)));
      if (progress < 1) requestAnimationFrame(step);
      else setShown(display);
    };
    requestAnimationFrame(step);
  }, [isInView, shouldReduce, value, display]);

  return (
    <p
      className="text-2xl font-bold tabular-nums"
      style={dynamicTheme ? { color: `hsl(var(--dynamic-primary))` } : {}}
    >
      <span ref={ref}>{shown}</span>
      {currency && (
        <span className="text-sm font-normal ml-1 text-muted-foreground">{currency}</span>
      )}
    </p>
  );
}

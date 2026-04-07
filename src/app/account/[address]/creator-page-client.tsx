"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useDominantColor } from "@/hooks/use-dominant-color";
import Link from "next/link";
import NextImage from "next/image";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMarketplace } from "@/hooks/use-marketplace";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import type { ApiToken } from "@medialane/sdk";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { AddressDisplay } from "@/components/shared/address-display";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, formatDisplayPrice, ipfsToHttp } from "@/lib/utils";
import {
  Tag,
  Handshake,
  TrendingUp,
  ArrowRightLeft,
  Activity,
  Image as ImageIcon,
  LayoutGrid,
  ShoppingBag,
  LayoutList,
  Flag,
  Sparkles,
} from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import type { ApiActivity } from "@medialane/sdk";
import { cn } from "@/lib/utils";

// ─── Address color identity ──────────────────────────────────────────────────

function addressPalette(address: string) {
  const seed = parseInt(address.slice(2, 10) || "a1b2c3d4", 16);
  const h1 = seed % 360;
  const h2 = (h1 + 137) % 360;
  const h3 = (h1 + 73) % 360;
  return { h1, h2, h3 };
}

function AddressAvatar({
  address,
  image,
  size = 88,
  borderColor,
}: {
  address: string;
  image?: string | null;
  size?: number;
  borderColor?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const { h1, h2 } = addressPalette(address);
  const initials = address.slice(2, 4).toUpperCase();
  const showImage = image && image !== "/placeholder.svg" && !imgError;

  return (
    <div
      className="rounded-full shrink-0 ring-[3px] ring-background overflow-hidden flex items-center justify-center text-white font-bold"
      style={{
        width: size,
        height: size,
        background: showImage
          ? "transparent"
          : `linear-gradient(145deg, hsl(${h1}, 72%, 60%), hsl(${h2}, 72%, 50%))`,
        fontSize: size * 0.33,
        boxShadow: borderColor
          ? `0 0 0 3px ${borderColor}, 0 8px 32px rgba(0,0,0,0.3)`
          : `0 0 0 2px hsl(${h1}, 72%, 60% / 0.4), 0 8px 24px rgba(0,0,0,0.25)`,
      }}
    >
      {showImage ? (
        <NextImage
          src={image!}
          alt="Creator"
          width={size}
          height={size}
          className="w-full h-full object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── Activity feed ───────────────────────────────────────────────────────────

const ACTIVITY_META: Record<
  string,
  { label: string; textColor: string; bg: string }
> = {
  mint:      { label: "Minted",    textColor: "text-yellow-400",  bg: "bg-yellow-500/8 border-yellow-500/15" },
  listing:   { label: "Listed",    textColor: "text-violet-400",  bg: "bg-violet-500/8 border-violet-500/15" },
  sale:      { label: "Sold",      textColor: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
  offer:     { label: "Offer",     textColor: "text-amber-400",   bg: "bg-amber-500/8 border-amber-500/15" },
  transfer:  { label: "Transfer",  textColor: "text-blue-400",    bg: "bg-blue-500/8 border-blue-500/15" },
  cancelled: { label: "Cancelled", textColor: "text-muted-foreground", bg: "bg-muted/30 border-border" },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  mint:      Sparkles,
  listing:   Tag,
  sale:      Handshake,
  offer:     TrendingUp,
  transfer:  ArrowRightLeft,
  cancelled: ArrowRightLeft,
};

function ActivityRow({ event, isLast }: { event: ApiActivity; isLast: boolean }) {
  const meta = ACTIVITY_META[event.type] ?? ACTIVITY_META.transfer;
  const Icon = ACTIVITY_ICONS[event.type] ?? ArrowRightLeft;
  const tokenId = event.nftTokenId ?? event.tokenId;
  const contract = event.nftContract ?? event.contractAddress;

  return (
    <div className="flex gap-4 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 w-9">
        <div
          className={cn(
            "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            meta.bg
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", meta.textColor)} />
        </div>
        {!isLast && <div className="flex-1 w-px bg-border/50 mt-1.5 min-h-4" />}
      </div>

      {/* Row body */}
      <div className="flex-1 pb-5 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider", meta.textColor)}>
                {meta.label}
              </span>
              {contract && tokenId ? (
                <Link
                  href={`/asset/${contract}/${tokenId}`}
                  className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors"
                >
                  Token #{tokenId}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">
                  Token #{tokenId ?? "—"}
                </span>
              )}
            </div>
            {contract && (
              <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5 truncate">
                {contract.slice(0, 10)}…{contract.slice(-6)}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {event.price?.formatted && (
              <p className="text-sm font-semibold price-value leading-none">
                {formatDisplayPrice(event.price.formatted)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {timeAgo(event.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "assets",      label: "Assets",      Icon: LayoutGrid },
  { id: "listings",    label: "Listings",    Icon: ShoppingBag },
  { id: "collections", label: "Collections", Icon: LayoutList },
{ id: "activity",    label: "Activity",    Icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  heading,
  body,
}: {
  icon: React.ElementType;
  heading: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="h-14 w-14 rounded-2xl border border-border/60 bg-muted/40 flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">{heading}</p>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreatorPageClient() {
  const { address } = useParams<{ address: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("assets");
  const [reportOpen,    setReportOpen]    = useState(false);
  const [offerTarget,   setOfferTarget]   = useState<{ contract: string; tokenId: string; name?: string } | null>(null);
  const [listTarget,    setListTarget]    = useState<{ contract: string; tokenId: string; name?: string } | null>(null);
  const [cancelToken,   setCancelToken]   = useState<ApiToken | null>(null);
  const [cancelPinOpen, setCancelPinOpen] = useState(false);

  const addr = address ?? null;
  const router = useRouter();

  // Ownership detection
  const { walletAddress } = useSessionKey();
  const isOwner = !!walletAddress &&
    walletAddress.toLowerCase() === (address ?? "").toLowerCase();

  // Cancel listing
  const { cancelOrder } = useMarketplace();

  // Fetch one token for the atmospheric background
  const { tokens: bgTokens } = useTokensByOwner(addr, 1, 1);
  const bgRawImg = bgTokens[0]?.metadata?.image;
  const bgImage = bgRawImg ? ipfsToHttp(bgRawImg) : null;

  const { imgRef, dynamicTheme } = useDominantColor(bgImage);

  const { data: hiddenStatus } = useSWR<{ isHidden: boolean }>(
    address ? `/api/creators/${address}/hidden` : null,
    (url: string) => fetch(url).then(r => r.json())
  );

  // Lazy data fetching — only load when tab is active
  const { tokens,      isLoading: tokensLoading      } = useTokensByOwner(activeTab === "assets"      ? addr : null);
  const { orders,      isLoading: ordersLoading      } = useUserOrders(activeTab === "listings"    ? addr : null);
  const { collections, isLoading: collectionsLoading } = useCollectionsByOwner(activeTab === "collections" ? addr : null);
  const { activities,  isLoading: activitiesLoading  } = useActivitiesByAddress(activeTab === "activity" ? addr : null);

  const activeListings = orders.filter(
    (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721"
  );

  const { h1, h2, h3 } = addressPalette(addr ?? "0x0");

  const handleCancelPin = async (pin: string) => {
    setCancelPinOpen(false);
    const orderHash = cancelToken?.activeOrders?.[0]?.orderHash;
    if (!orderHash) return;
    await cancelOrder({ orderHash, pin });
    setCancelToken(null);
  };

  // Tab count badges — only shown once that tab has been visited and loaded
  const tabBadge: Partial<Record<TabId, number>> = {
    ...(activeTab === "assets"      && !tokensLoading      && { assets:      tokens.length }),
    ...(activeTab === "listings"    && !ordersLoading      && { listings:    activeListings.length }),
    ...(activeTab === "collections" && !collectionsLoading && { collections: collections.length }),
    ...(activeTab === "activity" && !activitiesLoading && { activity: activities.length }),
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
    >
      {/* Hidden extraction image for dominant color */}
      {bgImage && (
        <img
          ref={imgRef}
          src={bgImage}
          crossOrigin="anonymous"
          aria-hidden
          alt=""
          style={{ display: "none" }}
        />
      )}

      {/* Fixed atmospheric background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {bgImage && (
          <img
            src={bgImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-[0.15] scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: dynamicTheme ? `hsl(var(--dynamic-primary) / 0.06)` : "transparent",
          }}
        />
      </div>

      {hiddenStatus?.isHidden === true && <HiddenContentBanner />}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-2 flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <AddressDisplay
            address={address ?? ""}
            chars={10}
            className="text-base font-mono font-semibold"
          />
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
          <Button variant="ghost" size="icon" onClick={() => setReportOpen(true)}>
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

        {/* ── Tab navigation ────────────────────────────────────────────── */}
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
                    <span
                      className="absolute bottom-0 inset-x-0 h-0.5 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, hsl(${h1}, 68%, 62%), hsl(${h2}, 68%, 58%))`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ───────────────────────────────────────────────── */}
        <div className="mt-6">

          {/* Assets */}
          {activeTab === "assets" && (
            tokensLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
              </div>
            ) : tokens.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                heading="No assets yet"
                body="This creator hasn't minted any IP assets on Medialane yet."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokens.map((t) => (
                  <TokenCard
                    key={`${t.contractAddress}-${t.tokenId}`}
                    token={t}
                    isOwner={isOwner}
                    onOffer={!isOwner ? (t: ApiToken) => setOfferTarget({
                      contract: t.contractAddress,
                      tokenId: t.tokenId,
                      name: t.metadata?.name ?? undefined,
                    }) : undefined}
                    onRemix={!isOwner ? (t: ApiToken) => router.push(`/create/remix/${t.contractAddress}/${t.tokenId}`) : undefined}
                    onList={isOwner ? (t: ApiToken) => setListTarget({
                      contract: t.contractAddress,
                      tokenId: t.tokenId,
                      name: t.metadata?.name ?? undefined,
                    }) : undefined}
                    onCancel={isOwner ? (t: ApiToken) => { setCancelToken(t); setCancelPinOpen(true); } : undefined}
                  />
                ))}
              </div>
            )
          )}

          {/* Listings */}
          {activeTab === "listings" && (
            ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                heading="No active listings"
                body="This creator has no IP assets listed for sale right now."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeListings.map((o) => (
                  <ListingCard key={o.orderHash} order={o} />
                ))}
              </div>
            )
          )}

          {/* Collections */}
          {activeTab === "collections" && (
            collectionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
              </div>
            ) : collections.length === 0 ? (
              <EmptyState
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

          {/* Activity */}
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
                <EmptyState
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

      {/* ── Action dialogs ────────────────────────────────────────────────── */}
      {offerTarget && (
        <OfferDialog
          open={!!offerTarget}
          onOpenChange={(v) => { if (!v) setOfferTarget(null); }}
          assetContract={offerTarget.contract}
          tokenId={offerTarget.tokenId}
          tokenName={offerTarget.name}
        />
      )}
      {listTarget && (
        <ListingDialog
          open={!!listTarget}
          onOpenChange={(v) => { if (!v) setListTarget(null); }}
          assetContract={listTarget.contract}
          tokenId={listTarget.tokenId}
          tokenName={listTarget.name}
        />
      )}
      <PinDialog
        open={cancelPinOpen}
        onSubmit={handleCancelPin}
        onCancel={() => { setCancelPinOpen(false); setCancelToken(null); }}
        title="Cancel listing"
        description={`Enter PIN to cancel the listing for ${cancelToken?.metadata?.name || `Token #${cancelToken?.tokenId}`}.`}
      />
    </div>
  );
}

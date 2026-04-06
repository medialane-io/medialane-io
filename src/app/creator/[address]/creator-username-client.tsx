"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useCreatorByUsername } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { CollectionCarouselRow } from "@/components/creator/collection-carousel-row";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { CreatorAnalytics } from "@/components/creator/creator-analytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp, normalizeAddress, timeAgo, formatDisplayPrice } from "@/lib/utils";
import {
  AtSign, Globe, Twitter, ExternalLink, MessageCircle, Send,
  ShoppingBag, BarChart2, Activity, ArrowRightLeft, Tag, Handshake,
  TrendingUp, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiCollection, ApiActivity } from "@medialane/sdk";

interface Props {
  username: string;
}

function addressPalette(seed: string) {
  const n = parseInt(seed.replace(/[^0-9a-f]/gi, "").slice(0, 8) || "a1b2c3d4", 16);
  const h1 = n % 360;
  const h2 = (h1 + 137) % 360;
  const h3 = (h1 + 73) % 360;
  return { h1, h2, h3 };
}

const ACTIVITY_META: Record<string, { label: string; textColor: string; bg: string }> = {
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
      <div className="flex flex-col items-center shrink-0 w-9">
        <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", meta.bg)}>
          <Icon className={cn("h-3.5 w-3.5", meta.textColor)} />
        </div>
        {!isLast && <div className="flex-1 w-px bg-border/50 mt-1.5 min-h-4" />}
      </div>
      <div className="flex-1 pb-5 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider", meta.textColor)}>{meta.label}</span>
              {contract && tokenId ? (
                <Link href={`/asset/${contract}/${tokenId}`} className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors">
                  Token #{tokenId}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">Token #{tokenId ?? "—"}</span>
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
              <p className="text-sm font-semibold price-value leading-none">{formatDisplayPrice(event.price.formatted)}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(event.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "listings",  label: "Listings",  Icon: ShoppingBag },
  { id: "analytics", label: "Analytics", Icon: BarChart2 },
  { id: "activity",  label: "Activity",  Icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CreatorUsernamePageClient({ username }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("listings");

  const { creator, isLoading, error } = useCreatorByUsername(username);
  const walletAddress = creator?.walletAddress ? normalizeAddress(creator.walletAddress) : null;

  const { tokens: bannerTokens } = useTokensByOwner(walletAddress, 1, 1);
  const { collections, isLoading: colsLoading } = useCollectionsByOwner(walletAddress);
  const { orders, isLoading: ordersLoading } = useUserOrders(activeTab === "listings" ? walletAddress : null);
  const { activities, isLoading: activitiesLoading } = useActivitiesByAddress(walletAddress);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");

  // Hero image: banner > avatar > first token
  const heroRaw = creator?.bannerImage
    ? ipfsToHttp(creator.bannerImage)
    : creator?.avatarImage
    ? ipfsToHttp(creator.avatarImage)
    : bannerTokens[0]?.metadata?.image
    ? ipfsToHttp(bannerTokens[0].metadata.image)
    : null;
  const heroImage = heroRaw && heroRaw !== "/placeholder.svg" ? heroRaw : null;

  const avatarRaw = creator?.avatarImage ? ipfsToHttp(creator.avatarImage) : null;
  const [avatarErr, setAvatarErr] = useState(false);
  const showAvatar = avatarRaw && avatarRaw !== "/placeholder.svg" && !avatarErr;

  const { imgRef, dynamicTheme } = useDominantColor(heroImage);
  const { h1, h2, h3 } = addressPalette(walletAddress ?? username);
  const dynamicPrimary = dynamicTheme ? `hsl(var(--dynamic-primary))` : `hsl(${h1}, 72%, 62%)`;
  const displayName = creator?.displayName || `@${username}`;

  const tabBadge: Partial<Record<TabId, number>> = {
    ...(activeTab === "listings" && !ordersLoading && { listings: activeListings.length }),
    ...(!activitiesLoading && { activity: activities.length }),
  };

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen">
        <Skeleton className="w-full h-48 sm:h-64 rounded-none" />
        <div className="px-6">
          <div className="-mt-14 relative z-10 flex flex-wrap items-end gap-x-4 gap-y-3 pb-6">
            <Skeleton className="h-28 w-28 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 pb-1 space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="space-y-2 mb-8">
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="shrink-0 w-40 aspect-square rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center space-y-4">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold">Creator not found</h1>
        <p className="text-muted-foreground">
          <span className="font-mono">@{username}</span> hasn&apos;t been claimed yet or doesn&apos;t exist.
        </p>
        <Button variant="outline" asChild>
          <Link href="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen" style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}>
      {/* Hidden color extractor */}
      {heroImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imgRef} src={heroImage} crossOrigin="anonymous" aria-hidden alt="" style={{ display: "none" }} />
      )}

      {/* ── Cinematic hero ─────────────────────────────────────────────── */}
      <div className="relative w-full h-[56vw] min-h-[300px] max-h-[500px] overflow-hidden bg-muted">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, hsl(${h1},55%,30%) 0%, hsl(${h2},50%,22%) 50%, hsl(${h3},45%,25%) 100%)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />

        {/* Full profile link — top right */}
        {creator.walletAddress && (
          <div className="absolute top-4 right-4 z-10">
            <Button size="sm" variant="outline" asChild className="bg-black/40 backdrop-blur-sm border-white/20 text-white hover:bg-black/60 hover:text-white">
              <Link href={`/account/${creator.walletAddress}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Full profile
              </Link>
            </Button>
          </div>
        )}

        {/* Identity at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 flex items-end gap-4">
          <div
            className="rounded-full shrink-0 ring-2 ring-white/30 overflow-hidden flex items-center justify-center text-white font-bold flex-none"
            style={{
              width: 64, height: 64,
              background: showAvatar ? "transparent" : `linear-gradient(145deg, hsl(${h1},72%,60%), hsl(${h2},72%,50%))`,
              fontSize: 64 * 0.33,
            }}
          >
            {showAvatar ? (
              <NextImage src={avatarRaw!} alt={displayName} width={64} height={64}
                className="w-full h-full object-cover" unoptimized onError={() => setAvatarErr(true)} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-white/60 text-xs font-medium mb-0.5">
              <AtSign className="h-3 w-3" />{creator.username}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate leading-tight">{displayName}</h1>
            {creator.bio && (
              <p className="text-sm text-white/65 mt-0.5 line-clamp-1">{creator.bio}</p>
            )}
            {(creator.websiteUrl || creator.twitterUrl || creator.discordUrl || creator.telegramUrl) && (
              <div className="flex items-center gap-2 mt-2">
                {creator.websiteUrl && <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors"><Globe className="h-3.5 w-3.5" /></a>}
                {creator.twitterUrl && <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors"><Twitter className="h-3.5 w-3.5" /></a>}
                {creator.discordUrl && <a href={creator.discordUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors"><MessageCircle className="h-3.5 w-3.5" /></a>}
                {creator.telegramUrl && <a href={creator.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors"><Send className="h-3.5 w-3.5" /></a>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="px-6">

        {/* Stats bar */}
        {(!colsLoading || collections.length > 0 || activeListings.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-5 pb-4">
            {!colsLoading && collections.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
                <span className="font-bold tabular-nums">{collections.length}</span>
                <span className="text-muted-foreground">Collections</span>
              </div>
            )}
            {activeListings.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
                <span className="font-bold tabular-nums">{activeListings.length}</span>
                <span className="text-muted-foreground">Listed</span>
              </div>
            )}
          </div>
        )}

        {/* ── Collection carousels ─────────────────────────────────────── */}
        {(colsLoading || collections.length > 0) && (
          <div className="space-y-8 pb-8 border-b border-border/50 mb-6">
            {colsLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <div className="flex gap-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton key={j} className="shrink-0 w-40 aspect-square rounded-xl" />
                      ))}
                    </div>
                  </div>
                ))
              : collections.map((col: ApiCollection) => (
                  <CollectionCarouselRow
                    key={col.contractAddress}
                    collection={col}
                    dynamicPrimary={dynamicPrimary}
                  />
                ))}
          </div>
        )}

        {/* ── Tab navigation ───────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 -mx-6 px-6 bg-background/95 backdrop-blur-sm border-b border-border">
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
                  {isActive && (
                    <span
                      className="absolute bottom-0 inset-x-0 h-0.5 rounded-full"
                      style={{
                        background: dynamicTheme
                          ? `linear-gradient(90deg, hsl(var(--dynamic-primary)), hsl(var(--dynamic-accent)))`
                          : `linear-gradient(90deg, hsl(${h1}, 68%, 62%), hsl(${h2}, 68%, 58%))`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────────────── */}
        <div className="mt-6">

          {/* Listings */}
          {activeTab === "listings" && (
            ordersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="h-14 w-14 rounded-2xl border border-border/60 bg-muted/40 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">No active listings</p>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">This creator has no IP assets listed for sale right now.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
              </div>
            )
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="max-w-2xl">
              <CreatorAnalytics activities={activities} isLoading={activitiesLoading} />
            </div>
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
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="h-14 w-14 rounded-2xl border border-border/60 bg-muted/40 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold">No activity yet</p>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">On-chain events for this creator will appear here as they happen.</p>
                  </div>
                </div>
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
    </div>
  );
}

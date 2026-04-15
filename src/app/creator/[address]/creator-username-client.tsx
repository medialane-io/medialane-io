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
import { CreatorCollectionGrid } from "@/components/creator/creator-collection-grid";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { CreatorAnalytics } from "@/components/creator/creator-analytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp, normalizeAddress, timeAgo, formatDisplayPrice } from "@/lib/utils";
import {
  AtSign, Globe, Twitter, ExternalLink, MessageCircle, Send,
  ShoppingBag, BarChart2, Activity, ArrowRightLeft, Tag, Handshake,
  TrendingUp, Sparkles, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiActivity } from "@medialane/sdk";

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
  { id: "collections", label: "Collections", Icon: LayoutGrid },
  { id: "listings",    label: "Listings",    Icon: ShoppingBag },
  { id: "analytics",   label: "Analytics",   Icon: BarChart2 },
  { id: "activity",    label: "Activity",    Icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CreatorUsernamePageClient({ username }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("collections");

  const { creator, isLoading, error } = useCreatorByUsername(username);
  const walletAddress = creator?.walletAddress ? normalizeAddress(creator.walletAddress) : null;

  const { tokens: bannerTokens } = useTokensByOwner(walletAddress, 1, 1);
  const { collections, isLoading: colsLoading } = useCollectionsByOwner(walletAddress);
  const { orders, isLoading: ordersLoading } = useUserOrders(activeTab === "listings" ? walletAddress : null);
  const { activities, isLoading: activitiesLoading } = useActivitiesByAddress(walletAddress);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");

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
    ...(!colsLoading && { collections: collections.length }),
    ...(activeTab === "listings" && !ordersLoading && { listings: activeListings.length }),
    ...(!activitiesLoading && { activity: activities.length }),
  };

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen">
        <Skeleton className="w-full h-[40vw] min-h-[240px] max-h-[420px] rounded-none" />
        <div className="px-6 pt-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
          <div className="flex gap-2 border-b border-border pb-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <div className="flex gap-3">
                  {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="shrink-0 w-48 aspect-square rounded-xl" />)}
                </div>
              </div>
            ))}
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
      <div className="relative w-full h-64 sm:h-96 overflow-hidden bg-muted">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.72) saturate(1.3)" }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, hsl(${h1},55%,30%) 0%, hsl(${h2},50%,22%) 50%, hsl(${h3},45%,25%) 100%)` }}
          />
        )}

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
      </div>

      {/* ── Identity card — overlaps hero ───────────────────────────────── */}
      <div className="px-6 -mt-20 sm:-mt-24 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          {/* Avatar */}
          <div
            className="rounded-full shrink-0 ring-4 ring-background overflow-hidden flex items-center justify-center text-white font-bold"
            style={{
              width: 88, height: 88,
              background: showAvatar ? "transparent" : `linear-gradient(145deg, hsl(${h1},72%,60%), hsl(${h2},72%,50%))`,
              fontSize: 88 * 0.33,
              boxShadow: `0 0 0 2px ${dynamicPrimary}55, 0 8px 32px rgba(0,0,0,0.35)`,
            }}
          >
            {showAvatar ? (
              <NextImage src={avatarRaw!} alt={displayName} width={88} height={88}
                className="w-full h-full object-cover" unoptimized onError={() => setAvatarErr(true)} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name + handle + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AtSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{creator.username}</span>
              {/* Dynamic "Creator" pill */}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: `${dynamicPrimary}22`, color: dynamicPrimary }}
              >
                Creator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate">{displayName}</h1>
            {/* Stat chips */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {!colsLoading && (
                <div className="flex flex-col items-center leading-none">
                  <span className="text-base font-black tabular-nums">{collections.length}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Collections</span>
                </div>
              )}
              {activeListings.length > 0 && (
                <div className="flex flex-col items-center leading-none">
                  <span className="text-base font-black tabular-nums">{activeListings.length}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Listed</span>
                </div>
              )}
              {/* Socials */}
              {(creator.websiteUrl || creator.twitterUrl || creator.discordUrl || creator.telegramUrl) && (
                <div className="flex items-center gap-2 sm:ml-4">
                  {creator.websiteUrl && <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Globe className="h-4 w-4" /></a>}
                  {creator.twitterUrl && <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>}
                  {creator.discordUrl && <a href={creator.discordUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><MessageCircle className="h-4 w-4" /></a>}
                  {creator.telegramUrl && <a href={creator.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Send className="h-4 w-4" /></a>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl line-clamp-2 mb-2">
            {creator.bio}
          </p>
        )}
      </div>

      {/* ── Tab navigation (sticky, right below identity) ────────────────── */}
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

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="px-6 mt-6">

        {/* Collections — grid */}
        {activeTab === "collections" && (
          collections.length === 0 && !colsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl border border-border/60 bg-muted/40 flex items-center justify-center">
                <LayoutGrid className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">No collections yet</p>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">This creator hasn&apos;t deployed any collections on Medialane yet.</p>
              </div>
            </div>
          ) : (
            <CreatorCollectionGrid collections={collections} isLoading={colsLoading} />
          )
        )}

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
  );
}

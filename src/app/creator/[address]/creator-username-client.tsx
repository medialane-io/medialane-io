"use client";

import { useState } from "react";
import Link from "next/link";
import { assetHref } from "@/lib/routes";
import { useCreatorByUsername } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { CollectionCard, CollectionCardSkeleton } from "@medialane/ui";
import { CreatorAnalytics } from "@/components/creator/creator-analytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp, normalizeAddress, timeAgo, formatDisplayPrice } from "@/lib/utils";
import {
  Globe, Twitter, MessageCircle, Send,
  ShoppingBag, BarChart2, Activity, ArrowRightLeft, Tag, Handshake,
  TrendingUp, Sparkles, LayoutGrid, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiActivity } from "@medialane/sdk";

interface Props {
  username: string;
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
                <Link href={assetHref("STARKNET", contract, tokenId)} className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors">
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

function EmptyState({ icon: Icon, heading, body }: { icon: React.ElementType; heading: string; body: string }) {
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

  const { creator, isLoading, error } = useCreatorByUsername(username);
  const walletAddress = creator?.walletAddress ? normalizeAddress(creator.walletAddress) : null;

  const { tokens: bannerTokens } = useTokensByOwner(walletAddress, 1, 1);
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(activeTab === "assets" ? walletAddress : null);
  const { collections, isLoading: colsLoading } = useCollectionsByOwner(walletAddress);
  const { orders, isLoading: ordersLoading } = useUserOrders(activeTab === "listings" ? walletAddress : null);
  const { activities, isLoading: activitiesLoading } = useActivitiesByAddress(walletAddress);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");

  const heroRaw = creator?.bannerImage
    || creator?.avatarImage
    || bannerTokens[0]?.metadata?.image
    || null;
  const heroImage = heroRaw ? ipfsToHttp(heroRaw) : null;

  // Show displayName if set, else username without @ prefix
  const displayName = creator?.displayName || creator?.username || username;
  // Show username as subtitle only when displayName is different
  const showUsername = creator?.displayName && creator?.username && creator.displayName !== creator.username;

  const tabBadge: Partial<Record<TabId, number>> = {
    ...(activeTab === "assets"      && !tokensLoading      && { assets:      tokens.length }),
    ...(!colsLoading                                       && { collections: collections.length }),
    ...(activeTab === "listings"    && !ordersLoading      && { listings:    activeListings.length }),
    ...(!activitiesLoading                                 && { activity:    activities.length }),
  };

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen">
        <Skeleton className="w-full h-[32vw] min-h-[180px] max-h-[320px] rounded-none" />
        <div className="px-6 pt-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
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
    <div className="pt-14 pb-20 min-h-screen overflow-x-hidden">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      {heroImage && (
        <div className="w-full h-[32vw] min-h-[180px] max-h-[320px] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" aria-hidden className="w-full h-full object-cover" />
        </div>
      )}

      {/* ── Identity ────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-1">
        <h1 className="text-2xl font-bold leading-tight">{displayName}</h1>
        {showUsername && (
          <p className="text-sm text-muted-foreground mt-0.5">{creator.username}</p>
        )}
        {creator.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl line-clamp-2 mt-2 mb-1">
            {creator.bio}
          </p>
        )}
        {(creator.websiteUrl || creator.twitterUrl || creator.discordUrl || creator.telegramUrl) && (
          <div className="flex items-center gap-3 mt-3">
            {creator.websiteUrl && <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Globe className="h-4 w-4" /></a>}
            {creator.twitterUrl && <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>}
            {creator.discordUrl && <a href={creator.discordUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><MessageCircle className="h-4 w-4" /></a>}
            {creator.telegramUrl && <a href={creator.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Send className="h-4 w-4" /></a>}
          </div>
        )}
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
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

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="px-6 mt-6">

        {/* Assets */}
        {activeTab === "assets" && (
          tokensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
            </div>
          ) : tokens.length === 0 ? (
            <EmptyState icon={ImageIcon} heading="No assets yet" body="This creator hasn't minted any digital assets on Medialane yet." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tokens.map((t) => (
                <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />
              ))}
            </div>
          )
        )}

        {/* Collections */}
        {activeTab === "collections" && (
          colsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
            </div>
          ) : collections.length === 0 ? (
            <EmptyState icon={LayoutGrid} heading="No collections yet" body="This creator hasn't deployed any collections on Medialane yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => (
                <CollectionCard key={col.contractAddress} collection={col} />
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
            <EmptyState icon={ShoppingBag} heading="No active listings" body="This creator has no digital assets listed for sale right now." />
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
              <EmptyState icon={Activity} heading="No activity yet" body="On-chain events for this creator will appear here as they happen." />
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

"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { toast } from "sonner";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useDominantColor } from "@/hooks/use-dominant-color";
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
  Share2,
  LayoutList,
  Flag,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import { CreatorAnalytics } from "@/components/creator/creator-analytics";
import { useCreatorProfile } from "@/hooks/use-profiles";
import type { ApiActivity } from "@medialane/sdk";
import { cn } from "@/lib/utils";
import { Globe, Twitter, MessageCircle, Send } from "lucide-react";

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
  { id: "analytics",   label: "Analytics",   Icon: BarChart2 },
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
  const [reportOpen, setReportOpen] = useState(false);

  const addr = address ?? null;

  const { profile } = useCreatorProfile(addr ?? undefined);

  const { data: hiddenStatus } = useSWR<{ isHidden: boolean }>(
    address ? `/api/creators/${address}/hidden` : null,
    (url: string) => fetch(url).then(r => r.json())
  );

  // Lazy data fetching — only load when tab is active
  const { tokens,      isLoading: tokensLoading      } = useTokensByOwner(activeTab === "assets"      ? addr : null);
  const { orders,      isLoading: ordersLoading      } = useUserOrders(activeTab === "listings"    ? addr : null);
  const { collections, isLoading: collectionsLoading } = useCollectionsByOwner(activeTab === "collections" ? addr : null);
  const { activities,  isLoading: activitiesLoading  } = useActivitiesByAddress(addr);

  // Always fetch one token for the banner image
  const { tokens: bannerTokens } = useTokensByOwner(addr, 1, 1);

  const activeListings = orders.filter(
    (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721"
  );

  const { h1, h2, h3 } = addressPalette(addr ?? "0x0");

  const latestToken  = bannerTokens[0];
  const latestRawImg = latestToken?.metadata?.image;
  const latestImage  = latestRawImg ? ipfsToHttp(latestRawImg) : null;
  const bannerImage  = latestImage && latestImage !== "/placeholder.svg" ? latestImage : null;

  const { imgRef, dynamicTheme } = useDominantColor(bannerImage);
  const dynamicPrimary = dynamicTheme
    ? `hsl(var(--dynamic-primary))`
    : `hsl(${h1}, 72%, 62%)`;

  // Tab count badges — only shown once that tab has been visited and loaded
  const tabBadge: Partial<Record<TabId, number>> = {
    ...(activeTab === "assets"      && !tokensLoading      && { assets:      tokens.length }),
    ...(activeTab === "listings"    && !ordersLoading      && { listings:    activeListings.length }),
    ...(activeTab === "collections" && !collectionsLoading && { collections: collections.length }),
    ...(!activitiesLoading && { activity: activities.length }),
  };

  return (
    <div
      className="pb-20 min-h-screen"
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
    >
      {/* Hidden extraction image for dominant color */}
      {bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={bannerImage}
          crossOrigin="anonymous"
          aria-hidden
          alt=""
          style={{ display: "none" }}
        />
      )}

      {hiddenStatus?.isHidden === true && <HiddenContentBanner />}

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative h-56 sm:h-80 overflow-hidden">
        {/* Layer 1 — blurred asset image or profile banner */}
        {bannerImage && (
          <div className="absolute inset-0">
            <NextImage
              src={bannerImage}
              alt=""
              fill
              className="object-cover scale-150"
              style={{ opacity: 0.6, filter: "blur(48px) saturate(1.8) brightness(0.55)" }}
              unoptimized
              aria-hidden
            />
            <div className="absolute inset-0 bg-background/25" />
          </div>
        )}

        {/* Layer 2 — address-derived mesh gradient (always present) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 90% at 15% 60%, hsl(${h1}, 68%, 42% / ${bannerImage ? 0.28 : 0.52}) 0%, transparent 65%),
              radial-gradient(ellipse 65% 65% at 85% 25%, hsl(${h2}, 68%, 38% / ${bannerImage ? 0.18 : 0.42}) 0%, transparent 60%),
              radial-gradient(ellipse 45% 45% at 55% 85%, hsl(${h3}, 68%, 38% / ${bannerImage ? 0.12 : 0.30}) 0%, transparent 55%)
            `,
          }}
        />

        {/* Bottom fade to background */}
        <div
          className="absolute inset-x-0 bottom-0 h-32"
          style={{ background: `linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)` }}
        />

        {/* Top edge fade */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/15 to-transparent" />

        {/* Floating action buttons — top right of banner */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/60 backdrop-blur-sm border-white/20 text-white hover:bg-background/80 hover:text-white"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-background/80"
            onClick={() => setReportOpen(true)}
            title="Report this creator"
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="px-6">

        {/* ── Identity section ─────────────────────────────────────────── */}
        <div className="-mt-16 sm:-mt-20 relative z-10 space-y-4 pb-6">

          {/* Avatar + name row */}
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <AddressAvatar
              address={address ?? "0x0"}
              image={latestImage}
              size={112}
              borderColor={dynamicTheme ? `hsl(var(--dynamic-primary))` : undefined}
            />

            <div className="flex-1 min-w-0 pb-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="pill-badge">Creator</span>
                {profile?.username && (
                  <span className="text-xs font-mono text-muted-foreground">@{profile.username}</span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate text-foreground">
                {profile?.displayName || (addr ? `${addr.slice(0, 10)}…${addr.slice(-8)}` : "—")}
              </h1>
              <AddressDisplay
                address={address ?? ""}
                chars={8}
                className="text-xs text-muted-foreground"
              />
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-2">
            {tokens.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
                <span className="font-bold tabular-nums">{tokens.length}</span>
                <span className="text-muted-foreground">Assets</span>
              </div>
            )}
            {activeListings.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
                <span className="font-bold tabular-nums">{activeListings.length}</span>
                <span className="text-muted-foreground">Listed</span>
              </div>
            )}
            {collections.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
                <span className="font-bold tabular-nums">{collections.length}</span>
                <span className="text-muted-foreground">Collections</span>
              </div>
            )}
          </div>

          {/* Social links */}
          {(profile?.websiteUrl || profile?.twitterUrl || profile?.discordUrl || profile?.telegramUrl) && (
            <div className="flex items-center gap-2">
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  title="Website"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.twitterUrl && (
                <a
                  href={profile.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  title="Twitter / X"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.discordUrl && (
                <a
                  href={profile.discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  title="Discord"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.telegramUrl && (
                <a
                  href={profile.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  title="Telegram"
                >
                  <Send className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

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

        {/* ── Tab content ───────────────────────────────────────────────── */}
        <div className="mt-6">

          {/* Assets */}
          {activeTab === "assets" && (
            tokensLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
              </div>
            ) : tokens.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                heading="No assets yet"
                body="This creator hasn't minted any IP assets on Medialane yet."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tokens.map((t) => (
                  <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />
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
                <EmptyState
                  icon={Activity}
                  heading="No activity yet"
                  body="On-chain events for this creator will appear here as they happen."
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
    </div>
  );
}

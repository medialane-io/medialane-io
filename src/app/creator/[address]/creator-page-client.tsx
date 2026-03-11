"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import NextImage from "next/image";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { AddressDisplay } from "@/components/shared/address-display";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
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
  Zap,
  ShoppingBag,
} from "lucide-react";
import type { ApiActivity } from "@medialane/sdk";
import { cn } from "@/lib/utils";

// ─── Address color identity system ──────────────────────────────────────────

function addressPalette(address: string) {
  const seed = parseInt(address.slice(2, 10) || "a1b2c3d4", 16);
  const h1 = seed % 360;
  const h2 = (h1 + 137) % 360; // golden-angle complement
  const h3 = (h1 + 73) % 360;  // tertiary accent
  return { h1, h2, h3 };
}

function AddressAvatar({
  address,
  image,
  size = 88,
}: {
  address: string;
  image?: string | null;
  size?: number;
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
        boxShadow: `0 0 0 1px hsl(${h1}, 72%, 60% / 0.25), 0 0 40px hsl(${h1}, 72%, 60% / 0.25), 0 8px 32px rgba(0,0,0,0.35)`,
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
  { label: string; dotColor: string; textColor: string; bg: string }
> = {
  listing:   { label: "Listed",    dotColor: "#a855f7", textColor: "text-violet-400",  bg: "bg-violet-500/8 border-violet-500/15" },
  sale:      { label: "Sold",      dotColor: "#10b981", textColor: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
  offer:     { label: "Offer",     dotColor: "#f59e0b", textColor: "text-amber-400",   bg: "bg-amber-500/8 border-amber-500/15" },
  transfer:  { label: "Transfer",  dotColor: "#3b82f6", textColor: "text-blue-400",    bg: "bg-blue-500/8 border-blue-500/15" },
  cancelled: { label: "Cancelled", dotColor: "#6b7280", textColor: "text-muted-foreground", bg: "bg-muted/30 border-border" },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
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
      <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
        <div
          className={cn(
            "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 transition-all group-hover:scale-105",
            meta.bg
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", meta.textColor)} />
        </div>
        {!isLast && (
          <div className="flex-1 w-px bg-border/50 mt-1.5 min-h-4" />
        )}
      </div>

      {/* Row body */}
      <div className="flex-1 pb-5 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider", meta.textColor)}>
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Token #{tokenId ?? "—"}
              </span>
            </div>
            {contract && (
              <p className="text-[11px] text-muted-foreground/70 font-mono mt-0.5 truncate">
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
  { id: "assets",   label: "Assets",   Icon: LayoutGrid },
  { id: "listings", label: "Listings", Icon: ShoppingBag },
  { id: "activity", label: "Activity", Icon: Activity },
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
    <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl border border-border/60 bg-muted/40 flex items-center justify-center">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold">{heading}</p>
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreatorPageClient() {
  const { address } = useParams<{ address: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("assets");

  const { tokens,     isLoading: tokensLoading     } = useTokensByOwner(address);
  const { orders,     isLoading: ordersLoading     } = useUserOrders(address);
  const { activities, isLoading: activitiesLoading } = useActivitiesByAddress(address);

  const activeListings = orders.filter(
    (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721"
  );
  const totalSales = orders.filter((o) => o.status === "FULFILLED").length;

  const { h1, h2, h3 } = addressPalette(address ?? "0x0");

  // Latest minted asset — used for banner background + avatar image
  const latestToken  = tokens[0];
  const latestRawImg = latestToken?.metadata?.image;
  const latestImage  = latestRawImg ? ipfsToHttp(latestRawImg) : null;
  const bannerImage  = latestImage && latestImage !== "/placeholder.svg" ? latestImage : null;

  const STATS = [
    { label: "Assets",   value: tokensLoading ? null : tokens.length,          Icon: ImageIcon },
    { label: "Listings", value: ordersLoading  ? null : activeListings.length,  Icon: Tag },
    { label: "Sales",    value: ordersLoading  ? null : totalSales,             Icon: Zap },
  ];

  const tabBadge: Record<TabId, number | null> = {
    assets:   tokensLoading     ? null : tokens.length,
    listings: ordersLoading     ? null : activeListings.length,
    activity: activitiesLoading ? null : activities.length,
  };

  return (
    <div className="pb-20 min-h-screen">

      {/* ── Cinematic banner ─────────────────────────────────────────────── */}
      <div className="relative h-52 sm:h-72 overflow-hidden">

        {/* Layer 1 — blurred asset image (when available) */}
        {bannerImage && (
          <div className="absolute inset-0">
            <NextImage
              src={bannerImage}
              alt=""
              fill
              className="object-cover scale-150 blur-xl"
              style={{ opacity: 0.6 }}
              unoptimized
              aria-hidden
            />
            {/* Tinted overlay so mesh gradient still tints through */}
            <div className="absolute inset-0 bg-background/40" />
          </div>
        )}

        {/* Layer 2 — address-derived mesh gradient (always present, reduced when image exists) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 90% at 15% 60%, hsl(${h1}, 68%, 42% / ${bannerImage ? 0.3 : 0.55}) 0%, transparent 65%),
              radial-gradient(ellipse 65% 65% at 85% 25%, hsl(${h2}, 68%, 38% / ${bannerImage ? 0.2 : 0.45}) 0%, transparent 60%),
              radial-gradient(ellipse 45% 45% at 55% 85%, hsl(${h3}, 68%, 38% / ${bannerImage ? 0.15 : 0.35}) 0%, transparent 55%)
            `,
          }}
        />

        {/* Layer 3 — grid texture */}
        <div className="absolute inset-0 bg-grid opacity-[0.15]" />

        {/* Layer 4 — noise grain */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/20 to-transparent" />

        {/* Floating Starknet badge */}
        <div className="absolute top-4 right-4 sm:right-6">
          <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
              style={{ background: `hsl(${h1}, 72%, 62%)` }}
            />
            <span className="text-[10px] font-mono text-foreground/70 tracking-wide">
              Starknet
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">

        {/* ── Identity row ─────────────────────────────────────────────────── */}
        <div className="-mt-16 relative z-10 flex flex-col sm:flex-row sm:items-end gap-5 pb-8">
          {/* Avatar — shows latest asset image, falls back to gradient initials */}
          <div className="shrink-0">
            <AddressAvatar address={address ?? "0x0"} image={latestImage} size={88} />
          </div>

          {/* Name + address */}
          <div className="flex-1 min-w-0 sm:pb-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pill-badge">Creator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">
              IP Creator
            </h1>
            <AddressDisplay
              address={address ?? ""}
              chars={10}
              className="text-muted-foreground text-sm"
            />
          </div>

          {/* Desktop stats */}
          <div className="hidden sm:flex items-end gap-8 pb-1 shrink-0">
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-right">
                {value === null ? (
                  <Skeleton className="h-8 w-8 mb-0.5 ml-auto" />
                ) : (
                  <p className="text-3xl font-bold tabular-nums tracking-tight leading-none">
                    {value}
                  </p>
                )}
                <p className="section-label mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile stats ─────────────────────────────────────────────────── */}
        <div className="sm:hidden grid grid-cols-3 gap-3 mb-8 border-t border-border/50 pt-6">
          {STATS.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="bento-cell px-3 py-3.5 flex flex-col items-center gap-1.5 text-center"
            >
              <Icon className="h-4 w-4 text-muted-foreground/60" />
              {value === null ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{value}</p>
              )}
              <p className="section-label">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab navigation ───────────────────────────────────────────────── */}
        <div className="border-b border-border/60 mb-8">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none -mb-px">
            {TABS.map(({ id, label, Icon }) => {
              const count = tabBadge[id];
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 rounded-t-lg",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {count !== null && count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold rounded-full px-1.5 py-px min-w-[18px] text-center tabular-nums transition-colors",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {/* Animated indicator bar */}
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

        {/* ── Assets ───────────────────────────────────────────────────────── */}
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

        {/* ── Listings ─────────────────────────────────────────────────────── */}
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

        {/* ── Activity ─────────────────────────────────────────────────────── */}
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
  );
}

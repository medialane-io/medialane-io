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
import { AddressDisplay } from "@/components/shared/address-display";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { CreatorCollectionGrid } from "@/components/creator/creator-collection-grid";
import { CreatorAnalytics } from "@/components/creator/creator-analytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, formatDisplayPrice, ipfsToHttp } from "@/lib/utils";
import {
  Tag, Handshake, TrendingUp, ArrowRightLeft,
  Activity, ShoppingBag, Share2, Flag,
  Sparkles, BarChart2, Layers, Globe,
  Twitter, MessageCircle, Send,
} from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import { useCreatorProfile } from "@/hooks/use-profiles";
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

// ─── Avatar ──────────────────────────────────────────────────────────────────

function AddressAvatar({
  address,
  image,
  size = 96,
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
      className="rounded-full shrink-0 ring-4 ring-background overflow-hidden flex items-center justify-center text-white font-bold shadow-2xl"
      style={{
        width: size,
        height: size,
        background: showImage
          ? "transparent"
          : `linear-gradient(145deg, hsl(${h1}, 72%, 60%), hsl(${h2}, 72%, 50%))`,
        fontSize: size * 0.33,
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

const ACTIVITY_META: Record<string, { label: string; textColor: string; bg: string }> = {
  mint:      { label: "Minted",    textColor: "text-yellow-400",         bg: "bg-yellow-500/8 border-yellow-500/15" },
  listing:   { label: "Listed",    textColor: "text-violet-400",         bg: "bg-violet-500/8 border-violet-500/15" },
  sale:      { label: "Sold",      textColor: "text-emerald-400",        bg: "bg-emerald-500/8 border-emerald-500/15" },
  offer:     { label: "Offer",     textColor: "text-amber-400",          bg: "bg-amber-500/8 border-amber-500/15" },
  transfer:  { label: "Transfer",  textColor: "text-blue-400",           bg: "bg-blue-500/8 border-blue-500/15" },
  cancelled: { label: "Cancelled", textColor: "text-muted-foreground",   bg: "bg-muted/30 border-border" },
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
              <span className={cn("text-[11px] font-bold uppercase tracking-wider", meta.textColor)}>
                {meta.label}
              </span>
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
              <p className="text-sm font-semibold leading-none">
                {formatDisplayPrice(event.price.formatted)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(event.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "collections", label: "Collections", Icon: Layers },
  { id: "listings",    label: "Listings",    Icon: ShoppingBag },
  { id: "activity",    label: "Activity",    Icon: Activity },
  { id: "analytics",   label: "Analytics",   Icon: BarChart2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Empty state ─────────────────────────────────────────────────────────────

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

// ─── Social link ─────────────────────────────────────────────────────────────

function SocialLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

// ─── Stat chip ───────────────────────────────────────────────────────────────

function StatChip({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl border border-border bg-card/60">
      <span className="text-xl font-black tabular-nums leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreatorPageClient() {
  const { address } = useParams<{ address: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("collections");
  const [reportOpen, setReportOpen] = useState(false);

  const addr = address ?? null;
  const { profile } = useCreatorProfile(addr ?? undefined);

  const { data: hiddenStatus } = useSWR<{ isHidden: boolean }>(
    address ? `/api/creators/${address}/hidden` : null,
    (url: string) => fetch(url).then(r => r.json())
  );

  const { orders,      isLoading: ordersLoading      } = useUserOrders(activeTab === "listings"  ? addr : null);
  const { collections, isLoading: collectionsLoading } = useCollectionsByOwner(addr);
  const { activities,  isLoading: activitiesLoading  } = useActivitiesByAddress(addr);
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

  const tabBadge: Partial<Record<TabId, number>> = {
    collections: collectionsLoading ? undefined : collections.length,
    listings:    ordersLoading      ? undefined : activeListings.length,
    activity:    activitiesLoading  ? undefined : activities.length,
  };

  const displayName = profile?.displayName || (addr ? `${addr.slice(0, 10)}…${addr.slice(-8)}` : "—");

  return (
    <div
      className="pb-20 min-h-screen"
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
    >
      {/* Hidden image for dominant color extraction */}
      {bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imgRef} src={bannerImage} crossOrigin="anonymous" aria-hidden alt="" style={{ display: "none" }} />
      )}

      {hiddenStatus?.isHidden === true && <HiddenContentBanner />}

      {/* ── Cinematic hero ────────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-96 overflow-hidden">
        {/* Art — full-bleed, slight scale for depth */}
        {bannerImage ? (
          <NextImage
            src={bannerImage}
            alt=""
            fill
            className="object-cover scale-[1.04]"
            style={{ filter: "brightness(0.72) saturate(1.3)" }}
            unoptimized
            priority
            aria-hidden
          />
        ) : (
          /* Address mesh gradient fallback */
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 100% 100% at 20% 50%, hsl(${h1}, 70%, 40%) 0%, transparent 60%),
                radial-gradient(ellipse 70% 70% at 80% 20%, hsl(${h2}, 70%, 36%) 0%, transparent 55%),
                radial-gradient(ellipse 50% 50% at 60% 90%, hsl(${h3}, 70%, 36%) 0%, transparent 50%),
                hsl(var(--background))
              `,
            }}
          />
        )}

        {/* Bottom fade to background — smooth transition into page */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: `linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)` }}
        />

        {/* Top edge fade */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/30 to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className="bg-black/40 backdrop-blur-sm border-white/20 text-white hover:bg-black/60 hover:text-white"
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60"
            onClick={() => setReportOpen(true)}
            title="Report this creator"
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Identity card — overlaps hero ─────────────────────────────────── */}
      <div className="px-5 sm:px-8 -mt-20 sm:-mt-24 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">

          {/* Avatar */}
          <AddressAvatar
            address={address ?? "0x0"}
            image={latestImage}
            size={120}
          />

          {/* Name + bio block */}
          <div className="flex-1 min-w-0 pb-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{
                  background: `${dynamicPrimary}22`,
                  color: dynamicPrimary,
                  border: `1px solid ${dynamicPrimary}44`,
                }}
              >
                Creator
              </span>
              {profile?.username && (
                <span className="text-xs text-muted-foreground font-mono">@{profile.username}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight truncate">{displayName}</h1>
            <AddressDisplay address={address ?? ""} chars={8} className="text-xs text-muted-foreground/70" />
            {profile?.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-2 pt-0.5">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* ── Stats + socials row ──────────────────────────────────────────── */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Stat chips */}
          <div className="flex items-center gap-3 flex-wrap">
            {!collectionsLoading && collections.length > 0 && (
              <StatChip value={collections.length} label="Collections" />
            )}
            {!ordersLoading && activeListings.length > 0 && (
              <StatChip value={activeListings.length} label="Listed" />
            )}
            {!activitiesLoading && activities.length > 0 && (
              <StatChip value={activities.length} label="Events" />
            )}
          </div>

          {/* Divider */}
          {(profile?.websiteUrl || profile?.twitterUrl || profile?.discordUrl || profile?.telegramUrl) && (
            <div className="hidden sm:block w-px h-8 bg-border/60" />
          )}

          {/* Social links */}
          <div className="flex items-center gap-2">
            {profile?.websiteUrl  && <SocialLink href={profile.websiteUrl}  icon={Globe}         label="Website" />}
            {profile?.twitterUrl  && <SocialLink href={profile.twitterUrl}  icon={Twitter}       label="Twitter / X" />}
            {profile?.discordUrl  && <SocialLink href={profile.discordUrl}  icon={MessageCircle} label="Discord" />}
            {profile?.telegramUrl && <SocialLink href={profile.telegramUrl} icon={Send}          label="Telegram" />}
          </div>
        </div>
      </div>

      <ReportDialog
        target={{ type: "CREATOR", address: address ?? "", name: displayName }}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <div className="mt-8 sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/60">
        <div className="px-5 sm:px-8 flex items-center gap-0.5 overflow-x-auto scrollbar-none -mb-px">
          {TABS.map(({ id, label, Icon }) => {
            const count = tabBadge[id];
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0",
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

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-8 mt-6">

        {/* Collections grid */}
        {activeTab === "collections" && (
          collections.length === 0 && !collectionsLoading ? (
            <EmptyState
              icon={Layers}
              heading="No collections yet"
              body="This creator hasn't published any collections on Medialane."
            />
          ) : (
            <CreatorCollectionGrid
              collections={collections}
              isLoading={collectionsLoading}
            />
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
              {activeListings.map((o) => <ListingCard key={o.orderHash} order={o} />)}
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
                body="On-chain events for this creator will appear here as they happen."
              />
            ) : (
              <div>
                {activities.map((a, i) => (
                  <ActivityRow key={i} event={a} isLast={i === activities.length - 1} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="max-w-2xl">
            <CreatorAnalytics activities={activities} isLoading={activitiesLoading} />
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LevelBadge } from "@medialane/ui";
import { AddressDisplay } from "@/components/shared/address-display";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useLeaderboard, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
import type { ApiRewardsBadge } from "@medialane/sdk";
import {
  Wallet,
  Trophy,
  Gift,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Palette,
  Layers,
  Tag,
  Handshake,
  ShoppingBag,
  Rocket,
  GitBranch,
  UserRoundCheck,
  ExternalLink,
  Lock,
  type LucideIcon,
  Package,
  CheckCircle2,
  GitBranch as GitBranchIcon,
  TrendingUp,
  Layers as LayersIcon,
  Ticket,
  Crown,
  Coins,
  Star,
  Gem,
  Zap,
  Award,
  Users,
  MessageSquare,
  HandCoins,
  Handshake as HandshakeIcon,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Fallback labels — the live labels come from the rewards config endpoint.
const ACTION_LABELS: Record<string, string> = {
  complete_profile: "Complete profile",
  mint_asset: "Mint assets",
  create_collection: "Create collections",
  launch_launchpad: "Launch drops / POPs",
  create_remix: "Create remixes",
  list_asset: "List assets",
  buy_asset: "Buy assets",
  make_offer: "Make offers",
  counter_offer: "Counter offers",
  offer_accepted_seller: "Offers accepted (sold)",
  offer_accepted_buyer: "Offers accepted (bought)",
  claim_pop: "POP claims",
  claim_drop: "Drop claims",
  comment: "On-chain comments",
  create_ticket_collection: "Ticketed events created",
  buy_ticket: "Event tickets",
  create_club: "Clubs started",
  join_club: "Clubs joined",
  create_sponsorship_offer: "Sponsorships opened",
  place_sponsorship_bid: "Sponsorship bids",
  sponsorship_licensed_sponsor: "Sponsorships secured (sponsor)",
  sponsorship_licensed_author: "Sponsorships secured (creator)",
  launch_coin: "Creator coins launched",
};

// A named badge icon lookup so the badge grid renders real glyphs without a
// runtime lucide import-by-string trick. Keys match BadgeDefinition.icon.
const BADGE_ICONS: Record<string, LucideIcon> = {
  Flame, Package, CheckCircle2, GitBranch: GitBranchIcon, TrendingUp, Layers: LayersIcon,
  Ticket, Crown, Coins, Star, Gem, Zap, Award, Users, MessageSquare, HandCoins,
  Handshake: HandshakeIcon,
};

// The 50 levels group into 7 named arcs (fixed ranges from the seed data —
// this is real structure, not decoration: it's how the DAO actually organized
// the ladder). Showing 7 segments the visitor can scan beats a 50-wide row of
// identical pills that just cuts off on screen.
const ARCS = [
  { label: "Beginners", from: 1, to: 5 },
  { label: "Adventurers", from: 6, to: 11 },
  { label: "Masters", from: 12, to: 19 },
  { label: "Icons", from: 20, to: 30 },
  { label: "Legends", from: 31, to: 35 },
  { label: "Cosmic", from: 36, to: 42 },
  { label: "Transcendent", from: 43, to: 50 },
];

// ── Ways to earn ──────────────────────────────────────────────────────────────

const EARN_ACTIONS: {
  label: string;
  description: string;
  href: string;
  Icon: React.ElementType;
}[] = [
  { label: "Create a collection", description: "Deploy a new ERC-721 or ERC-1155 collection", href: "/create/collection", Icon: Layers },
  { label: "Mint an asset", description: "Mint into one of your collections", href: "/create/asset", Icon: Palette },
  { label: "Launch a drop or POP", description: "Run a public launch on the Launchpad", href: "/launchpad", Icon: Rocket },
  { label: "List an asset for sale", description: "Open your portfolio to list at a fixed price", href: "/portfolio/assets", Icon: Tag },
  { label: "Make an offer", description: "Bid on assets across the marketplace", href: "/marketplace", Icon: Handshake },
  { label: "Collect an asset", description: "Buy a listing — earn XP as a collector", href: "/marketplace", Icon: ShoppingBag },
  { label: "Remix existing work", description: "Build on top of another creator's IP", href: "/marketplace", Icon: GitBranch },
  { label: "Host a ticketed event", description: "Sell tickets your fans can trade and redeem", href: "/launchpad", Icon: Sparkles },
  { label: "Start or join a club", description: "Build a membership community around your work", href: "/launchpad", Icon: UserRoundCheck },
  { label: "Open a sponsorship", description: "Let sponsors bid on your work", href: "/launchpad", Icon: Handshake },
  { label: "Launch a creator coin", description: "Put your own coin into the world", href: "/launchpad/coin/create", Icon: Rocket },
  { label: "Complete your profile", description: "Set a display name, avatar, and socials", href: "/portfolio/settings", Icon: UserRoundCheck },
];

function EarnMorePanel() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ways to earn XP
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {EARN_ACTIONS.map(({ label, description, href, Icon }) => (
          <Link
            key={href + label}
            href={href}
            className="group flex items-start gap-3 rounded-xl border border-border/40 bg-background/60 px-3.5 py-3 hover:border-primary/40 hover:bg-primary/[0.04] transition-colors"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{label}</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Arc progress bar — replaces a 50-wide (or truncated 12-wide) row of pills
// with 7 segments, one per named arc. Your current arc is labeled; earlier
// arcs read as complete, later ones as upcoming. ──────────────────────────────

function ArcProgressBar({ currentLevel }: { currentLevel: number }) {
  const currentArcIndex = ARCS.findIndex((a) => currentLevel >= a.from && currentLevel <= a.to);
  const arc = ARCS[currentArcIndex] ?? ARCS[0];
  const posInArc = arc ? (currentLevel - arc.from) / Math.max(1, arc.to - arc.from) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">
          {arc?.label ?? "Beginners"} <span className="text-muted-foreground font-normal">arc</span>
        </p>
        <p className="text-xs text-muted-foreground">Lv.{currentLevel} of 50</p>
      </div>
      <div className="flex gap-1">
        {ARCS.map((a, i) => (
          <div key={a.label} className="flex-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full bg-primary transition-all",
                  i < currentArcIndex && "w-full",
                  i > currentArcIndex && "w-0"
                )}
                style={i === currentArcIndex ? { width: `${Math.max(8, posInArc * 100)}%` } : undefined}
              />
            </div>
            <p className={cn("mt-1 text-center text-[10px] leading-tight", i === currentArcIndex ? "text-foreground font-semibold" : "text-muted-foreground/70")}>
              {a.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Badges tab content — grouped by category, real icon tiles ─────────────────

const CATEGORY_LABEL: Record<string, string> = {
  creator: "Creator",
  collector: "Collector",
  community: "Community",
};

function BadgeGrid({ badges, earnedKeys }: { badges: ApiRewardsBadge[]; earnedKeys: string[] }) {
  const earned = new Set(earnedKeys);
  const categories = [...new Set(badges.map((b) => b.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABEL[category] ?? category}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {badges
              .filter((b) => b.category === category)
              .map((badge) => {
                const isEarned = earned.has(badge.key);
                const Icon = BADGE_ICONS[badge.icon] ?? Award;
                return (
                  <div
                    key={badge.key}
                    title={badge.description}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-center",
                      isEarned ? "border-border bg-card" : "border-border/40 bg-background/40"
                    )}
                  >
                    <div
                      className={cn("relative flex h-9 w-9 items-center justify-center rounded-full", !isEarned && "opacity-30 grayscale")}
                      style={{ backgroundColor: `${badge.color}18`, color: badge.color }}
                    >
                      <Icon className="h-4 w-4" />
                      {!isEarned && (
                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border">
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className={cn("text-xs font-semibold leading-tight", !isEarned && "text-muted-foreground")}>
                      {badge.name}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Creator's Fund ─────────────────────────────────────────────────────────────

function CreatorsFundCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-500/[0.06] via-card/50 to-card/50 p-5 space-y-4">
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400/90">
              Creator&apos;s Fund
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
              <span className="h-1 w-1 rounded-full bg-orange-400 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-base font-semibold leading-snug">
            Every $1,000 collected is airdropped back to participants.
          </p>
        </div>
      </div>

      <p className="relative text-sm text-muted-foreground leading-relaxed">
        The fund is a public on-chain wallet. Distributions are weighted by your
        Score Board points — your XP and rank decide your share.
      </p>

      <div className="relative flex flex-wrap items-center gap-2">
        <Link
          href="/airdrop"
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 transition-colors"
        >
          About the airdrop
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <a
          href="https://medialane.org/creators-fund"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 hover:border-foreground/30 text-sm font-medium px-3.5 py-2 transition-colors text-muted-foreground hover:text-foreground"
        >
          Track the fund
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}

// ── Top status bar — one slim row, not a whole panel ───────────────────────────

function StatusBar({ address }: { address: string | null | undefined }) {
  const { data: rewards, isLoading } = useRewards(address);
  const { data: leaderboard } = useLeaderboard(1, 100);

  const myRank =
    address && leaderboard?.data
      ? leaderboard.data.find((e) => e.address.toLowerCase() === address.toLowerCase())?.rank ?? null
      : null;

  if (!address) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
        <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          Sign in to track your XP, badges, and Creator&apos;s Fund share.
        </p>
      </div>
    );
  }

  if (isLoading || !rewards) {
    return <Skeleton className="h-16 w-full rounded-xl" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5">
      <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} size="lg" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-black tabular-nums">{rewards.totalXp.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">XP</span>
      </div>
      {myRank && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black tabular-nums">#{myRank}</span>
          <span className="text-xs text-muted-foreground">rank</span>
        </div>
      )}
      {rewards.nextLevel && (
        <div className="flex-1 min-w-[160px] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Next: Lv.{rewards.nextLevel.level} {rewards.nextLevel.name}</span>
            <span>{rewards.progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rewards.progressPct}%`, backgroundColor: rewards.badgeColor }} />
          </div>
        </div>
      )}
      <AddressDisplay address={address} chars={4} className="ml-auto font-mono text-xs text-muted-foreground" />
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────────

function OverviewTab({ address }: { address: string | null | undefined }) {
  const { data: rewards } = useRewards(address);
  const { data: events } = useRewardsEvents(address, 1, 8);
  const { data: config } = useRewardsConfig();

  const actionLabel = (type: string) =>
    config?.actions.find((a) => a.type === type)?.label ?? ACTION_LABELS[type] ?? type;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-6">
        <ArcProgressBar currentLevel={rewards?.currentLevel ?? 1} />
        <EarnMorePanel />
      </div>
      <div className="lg:col-span-5 space-y-6">
        <CreatorsFundCard />
        {address && rewards && Object.keys(rewards.breakdown).length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">XP breakdown</p>
            <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden bg-card/30">
              {Object.entries(rewards.breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([action, xp]) => (
                  <div key={action} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">{actionLabel(action)}</span>
                    <span className="text-sm font-semibold tabular-nums">{xp.toLocaleString()} XP</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        {address && events && events.data.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</p>
            <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden bg-card/30">
              {events.data.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{actionLabel(e.actionType)}</span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-400">+{e.finalXp} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Badges tab ───────────────────────────────────────────────────────────────

function BadgesTab({ address }: { address: string | null | undefined }) {
  const { data: config, isLoading } = useRewardsConfig();
  const { data: rewards } = useRewards(address);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!config) return null;

  return <BadgeGrid badges={config.badges} earnedKeys={rewards?.badges.map((b) => b.key) ?? []} />;
}

// ── Leaderboard tab ─────────────────────────────────────────────────────────────

const MEDAL: Record<number, string> = {
  1: "text-amber-400",
  2: "text-slate-300",
  3: "text-orange-400",
};

function LeaderboardTab({ myAddress }: { myAddress: string | null | undefined }) {
  const { data, isLoading } = useLeaderboard(1, 25);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top creators</h3>
        </div>
        {data?.meta?.total ? (
          <span className="text-xs text-muted-foreground tabular-nums">{data.meta.total.toLocaleString()} creators</span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="py-10 text-center text-muted-foreground space-y-2">
          <Trophy className="h-8 w-8 mx-auto opacity-20" />
          <p className="text-sm">No scores computed yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden bg-background/40">
          {(data?.data ?? []).map((entry) => {
            const isMe = myAddress && entry.address.toLowerCase() === myAddress.toLowerCase();
            return (
              <div key={entry.address} className={cn("flex items-center gap-3 px-4 py-2.5 transition-colors", isMe && "bg-primary/[0.06]")}>
                <span className={cn("w-6 text-center text-sm font-bold shrink-0 tabular-nums", MEDAL[entry.rank] ?? "text-muted-foreground")}>
                  {entry.rank}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <AddressDisplay address={entry.address} chars={5} className="text-sm font-mono" />
                  <LevelBadge level={entry.currentLevel} name={entry.currentLevelName} badgeColor={entry.badgeColor} size="sm" />
                  {isMe && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">you</span>}
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {entry.totalXp.toLocaleString()}
                  <span className="ml-1 text-xs text-muted-foreground font-normal">XP</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function RewardsDashboard() {
  const { address } = useWallet();

  return (
    <div className="space-y-6">
      <StatusBar address={address} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-5">
          <OverviewTab address={address} />
        </TabsContent>
        <TabsContent value="badges" className="pt-5">
          <BadgesTab address={address} />
        </TabsContent>
        <TabsContent value="leaderboard" className="pt-5">
          <LeaderboardTab myAddress={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

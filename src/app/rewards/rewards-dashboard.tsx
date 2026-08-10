"use client";

import type { ElementType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
import { LeaderboardPanel } from "@/components/rewards/leaderboard-panel";
import type { ApiRewardsBadge } from "@medialane/sdk";
import {
  ScoreSummaryCard,
  XpProgress,
  LevelLadder,
  JourneyPath,
  LevelUpCelebration,
  BadgeUnlockToastContent,
  useRewardsCelebrations,
  type JourneyStep,
} from "@medialane/ui";
import {
  Gift,
  ExternalLink,
  Zap,
  Palette,
  Layers,
  Tag,
  Handshake,
  ShoppingBag,
  Rocket,
  GitBranch,
  UserRoundCheck,
  Ticket,
  MessageSquare,
  Users,
  type LucideIcon,
  Package,
  CheckCircle2,
  TrendingUp,
  Crown,
  Coins,
  Star,
  Gem,
  Award,
  HandCoins,
  Flame,
  Sparkles,
} from "lucide-react";

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
  create_ticket_collection: "Tickets collections created",
  buy_ticket: "Tickets received",
  create_club: "Clubs started",
  join_club: "Clubs joined",
  create_sponsorship_offer: "Sponsorships opened",
  place_sponsorship_bid: "Sponsorship bids",
  sponsorship_licensed_sponsor: "Sponsorships secured (sponsor)",
  sponsorship_licensed_author: "Sponsorships secured (creator)",
  launch_coin: "Creator coins launched",
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  Flame, Package, CheckCircle2, GitBranch, TrendingUp, Layers,
  Ticket, Crown, Coins, Star, Gem, Zap, Award, Users, MessageSquare, HandCoins,
  Handshake,
};

// ── Journey paths ────────────────────────────────────────────────────────────

const CREATOR_JOURNEY: JourneyStep[] = [
  { actionType: "complete_profile", label: "Complete your profile", href: "/settings", icon: UserRoundCheck },
  { actionType: "mint_asset", label: "Mint an asset", href: "/launchpad/single-editions", icon: Palette },
  { actionType: "create_collection", label: "Create a collection", href: "/launchpad/single-editions/collection", icon: Layers },
  { actionType: "list_asset", label: "List an asset for sale", href: "/portfolio/assets", icon: Tag },
  { actionType: "offer_accepted_seller", label: "Get your first sale", href: "/portfolio/assets", icon: HandCoins },
  { actionType: "launch_launchpad", label: "Launch a drop or POP", href: "/launchpad", icon: Rocket },
  { actionType: "launch_coin", label: "Launch a creator coin", href: "/launchpad/coin/create", icon: Coins },
];

const COLLECTOR_JOURNEY: JourneyStep[] = [
  { actionType: "complete_profile", label: "Complete your profile", href: "/settings", icon: UserRoundCheck },
  { actionType: "buy_asset", label: "Collect an asset", href: "/marketplace", icon: ShoppingBag },
  { actionType: "make_offer", label: "Make an offer", href: "/marketplace", icon: Handshake },
  { actionType: "join_club", label: "Join a club", href: "/launchpad", icon: UserRoundCheck },
  { actionType: "buy_ticket", label: "Get an event ticket", href: "/launchpad", icon: Ticket },
  { actionType: "comment", label: "Join the conversation", href: "/marketplace", icon: MessageSquare },
];

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-rose to-brand-orange text-white shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Community Rewards</h1>
      </div>
      <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
        Every action earns XP. Active members receive allocations from the
        Creator&apos;s Fund — the more you participate, the more you earn.
      </p>
    </section>
  );
}

// ── My score ──────────────────────────────────────────────────────────────────

function StatusRow({ address }: { address: string | null | undefined }) {
  const { data: rewards, isLoading } = useRewards(address);
  const { data: config } = useRewardsConfig();

  if (!address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">Secure your account to see your score.</p>
        <div className="btn-border-animated inline-block p-[1px] rounded-lg">
          <Button
            size="sm"
            asChild
            className="bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Link href="/connect?redirect_url=/rewards">Set up account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !rewards || !config) {
    return (
      <div className="flex gap-3">
        <Skeleton className="h-14 w-36 rounded-xl" />
        <Skeleton className="h-14 w-36 rounded-xl" />
        <Skeleton className="h-14 w-48 rounded-xl" />
      </div>
    );
  }

  const levelXp = config.levels.find((l) => l.level === rewards.currentLevel)?.xpRequired ?? 0;

  return (
    <div className="flex items-center gap-5">
      <XpProgress
        totalXp={rewards.totalXp}
        levelXp={levelXp}
        nextLevelXp={rewards.nextLevel?.xpRequired ?? null}
        badgeColor={rewards.badgeColor}
        variant="ring"
        size={72}
      />
      <ScoreSummaryCard
        level={rewards.currentLevel}
        levelName={rewards.currentLevelName}
        badgeColor={rewards.badgeColor}
        totalXp={rewards.totalXp}
        levelXp={levelXp}
        nextLevel={rewards.nextLevel}
        topBadges={rewards.badges.slice(0, 4)}
        className="flex-1"
      />
    </div>
  );
}

// ── Your journey (level ladder) ────────────────────────────────────────────────

function JourneyLadder({ address }: { address: string | null | undefined }) {
  const { data: rewards } = useRewards(address);
  const { data: config } = useRewardsConfig();
  if (!address || !rewards || !config) return null;
  return (
    <section className="space-y-3">
      <SectionLabel>Your journey</SectionLabel>
      <LevelLadder levels={config.levels} currentLevel={rewards.currentLevel} />
    </section>
  );
}

// ── Personal breakdown ────────────────────────────────────────────────────────

function PersonalPanel({ address }: { address: string | null | undefined }) {
  const { data: rewards } = useRewards(address);
  const { data: events } = useRewardsEvents(address, 1, 6);
  const { data: config } = useRewardsConfig();

  const actionLabel = (type: string) =>
    config?.actions.find((a) => a.type === type)?.label ?? ACTION_LABELS[type] ?? type;

  if (!address || !rewards || Object.keys(rewards.breakdown).length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionLabel>Your breakdown</SectionLabel>
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/40">
        {Object.entries(rewards.breakdown)
          .sort(([, a], [, b]) => b - a)
          .map(([action, xp]) => (
            <div key={action} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{actionLabel(action)}</span>
              <span className="font-bold tabular-nums">+{xp.toLocaleString()} XP</span>
            </div>
          ))}
      </div>
      {events && events.data.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/40">
          {events.data.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{actionLabel(e.actionType)}</span>
              <span className="font-bold tabular-nums text-brand-rose">+{e.finalXp}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Creator's Fund card ───────────────────────────────────────────────────────

function CreatorsFundCard() {
  return (
    <section className="relative rounded-2xl p-[1px] bg-gradient-to-br from-brand-rose/60 via-brand-orange/30 to-brand-rose/20 overflow-hidden">
      <div className="relative rounded-[15px] bg-card p-6 space-y-4 overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-rose/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-brand-orange/10 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-rose to-brand-orange flex items-center justify-center shrink-0">
            <Gift className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-rose/15 border border-brand-rose/25 px-2 py-0.5 text-[10px] font-bold text-brand-rose">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-rose animate-pulse" />
            Live
          </span>
        </div>

        <h2 className="relative text-xl font-black tracking-tight leading-tight">
          Creator&apos;s{" "}
          <span className="bg-gradient-to-r from-brand-rose to-brand-orange bg-clip-text text-transparent">Fund</span>
        </h2>

        <p className="relative text-sm text-muted-foreground leading-relaxed">
          Every $1,000 the community brings to Medialane, we send back out —
          split between everyone creating, collecting, and taking part.
        </p>

        <div className="relative flex flex-col gap-2 pt-1">
          <Link
            href="/airdrop"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-rose to-brand-orange hover:opacity-90 transition-opacity shadow-lg shadow-brand-rose/20"
          >
            <Gift className="h-4 w-4" />
            How the fund works
          </Link>
          <a
            href="https://medialane.org/creators-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:border-foreground/30"
          >
            Watch the wallet
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

function BadgesPanel({ address }: { address: string | null | undefined }) {
  const { data: config, isLoading } = useRewardsConfig();
  const { data: rewards } = useRewards(address);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  if (!config) return null;

  const earnedKeys = new Set(rewards?.badges.map((b) => b.key) ?? []);

  return (
    <section className="space-y-3">
      <SectionLabel>Badges</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {config.badges.map((badge: ApiRewardsBadge) => {
          const isEarned = earnedKeys.has(badge.key);
          const Icon = BADGE_ICONS[badge.icon] ?? Award;
          return (
            <span
              key={badge.key}
              title={badge.description}
              className={
                isEarned
                  ? "inline-flex items-center gap-1.5 rounded-full border border-brand-rose/30 bg-gradient-to-r from-brand-rose/15 to-brand-orange/10 px-3 py-1.5 text-xs font-semibold text-foreground"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground/60"
              }
            >
              <Icon className={`h-3.5 w-3.5 ${isEarned ? "text-brand-rose" : "opacity-40"}`} />
              {badge.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}

// ── Your journey to earn ─────────────────────────────────────────────────────

function JourneyPanel({ address }: { address: string | null | undefined }) {
  const { data: rewards } = useRewards(address);
  const breakdown = rewards?.breakdown ?? {};
  const creatorDone = CREATOR_JOURNEY.filter((s) => (breakdown[s.actionType] ?? 0) > 0).length;
  const collectorDone = COLLECTOR_JOURNEY.filter((s) => (breakdown[s.actionType] ?? 0) > 0).length;
  const [persona, setPersona] = useState<"create" | "collect">(
    collectorDone > creatorDone ? "collect" : "create"
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Your journey to earn</SectionLabel>
        <div className="flex gap-1 rounded-full border border-border/40 p-0.5">
          {(["create", "collect"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                persona === p ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <JourneyPath steps={persona === "create" ? CREATOR_JOURNEY : COLLECTOR_JOURNEY} breakdown={breakdown} />
    </section>
  );
}

// ── Shared section label ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[3px] w-4 rounded-full bg-gradient-to-r from-brand-rose to-brand-orange" />
      <h2 className="text-sm font-bold text-muted-foreground">{children}</h2>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function RewardsDashboard() {
  const { address } = useWallet();
  const { data: rewards } = useRewards(address);
  const { leveledUpTo, newBadgeKeys, dismiss } = useRewardsCelebrations(address, rewards ?? null);

  useEffect(() => {
    if (newBadgeKeys.length === 0 || !rewards) return;
    // The hook already persisted the new baseline the moment it detected
    // these keys, so this effect only needs to render the toasts — no
    // dismiss() call needed here (that would also clear an in-progress
    // level-up overlay if both fired in the same snapshot).
    for (const key of newBadgeKeys) {
      const badge = rewards.badges.find((b) => b.key === key);
      if (badge) toast(<BadgeUnlockToastContent badge={badge} />, { duration: 4500 });
    }
  }, [newBadgeKeys, rewards]);

  return (
    <div className="space-y-10">
      {leveledUpTo !== null && rewards && (
        <LevelUpCelebration
          level={leveledUpTo}
          name={rewards.currentLevelName}
          badgeColor={rewards.badgeColor}
          onDismiss={dismiss}
        />
      )}
      <Hero />
      <StatusRow address={address} />
      <JourneyLadder address={address} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left — scoreboard */}
        <div className="lg:col-span-7 space-y-10">
          <PersonalPanel address={address} />
          <section className="space-y-4">
            <SectionLabel>Scoreboard</SectionLabel>
            <LeaderboardPanel myAddress={address} showHeading={false} />
          </section>
        </div>

        {/* Right — fund + badges + journey */}
        <div className="lg:col-span-5 space-y-8">
          <CreatorsFundCard />
          <BadgesPanel address={address} />
          <JourneyPanel address={address} />
        </div>
      </div>
    </div>
  );
}

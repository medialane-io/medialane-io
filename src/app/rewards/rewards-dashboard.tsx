"use client";

import { useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
import { LeaderboardPanel } from "@/components/rewards/leaderboard-panel";
import type { ApiRewardsBadge } from "@medialane/sdk";
import {
  LevelBadge,
  LevelUpCelebration,
  BadgeUnlockToastContent,
  useRewardsCelebrations,
} from "@medialane/ui";
import {
  Gift,
  ExternalLink,
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
  Zap,
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

// ── Ways to earn — bold icon tiles, not tiny pills ──────────────────────────────

const EARN_GROUPS: {
  title: string;
  textClass: string;
  tileClass: string;
  items: { label: string; href: string; Icon: LucideIcon }[];
}[] = [
  {
    title: "Create",
    textClass: "text-brand-purple",
    tileClass: "bg-brand-purple",
    items: [
      { label: "Create a collection", href: "/launchpad/single-editions/collection", Icon: Layers },
      { label: "Mint an asset", href: "/launchpad/single-editions", Icon: Palette },
      { label: "Launch a drop or POP", href: "/launchpad", Icon: Rocket },
      { label: "Launch a creator coin", href: "/launchpad/coin/create", Icon: Coins },
      { label: "Remix existing work", href: "/marketplace", Icon: GitBranch },
    ],
  },
  {
    title: "Collect",
    textClass: "text-brand-blue",
    tileClass: "bg-brand-blue",
    items: [
      { label: "Collect an asset", href: "/marketplace", Icon: ShoppingBag },
      { label: "Make an offer", href: "/marketplace", Icon: Handshake },
      { label: "List an asset for sale", href: "/portfolio/assets", Icon: Tag },
      { label: "Get an event ticket", href: "/launchpad", Icon: Ticket },
    ],
  },
  {
    title: "Connect",
    textClass: "text-brand-rose",
    tileClass: "bg-brand-rose",
    items: [
      { label: "Start or join a club", href: "/launchpad", Icon: UserRoundCheck },
      { label: "Open a sponsorship", href: "/launchpad", Icon: Handshake },
      { label: "Join the conversation", href: "/marketplace", Icon: MessageSquare },
      { label: "Complete your profile", href: "/settings", Icon: UserRoundCheck },
    ],
  },
];

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="space-y-5">
      <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.02]">
        Community <span className="bg-gradient-to-r from-brand-rose to-brand-orange bg-clip-text text-transparent">Rewards</span>
      </h1>
      <p className="text-lg text-foreground/70 max-w-xl leading-relaxed font-medium">
        Every action earns XP. Active members receive allocations from the
        Creator&apos;s Fund — the more you participate, the more you earn.{" "}
        <Link href="/journey" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
          See the full system
        </Link>
        .
      </p>
    </section>
  );
}

// ── My score — one single panel, subtle gradient, top-right of the hero ────────

function StatusPanel({ address }: { address: string | null | undefined }) {
  const { data: rewards, isLoading } = useRewards(address);
  const { data: config } = useRewardsConfig();

  if (!address) {
    return (
      <div className="shrink-0 rounded-3xl bg-gradient-to-br from-brand-rose/10 via-brand-orange/[0.06] to-transparent p-6 space-y-3 sm:max-w-xs">
        <p className="text-sm text-foreground/70 font-medium">Secure your account to see your score.</p>
        <Button
          size="lg"
          asChild
          className="bg-brand-rose hover:bg-brand-rose/90 text-white font-bold rounded-full px-7 w-full"
        >
          <Link href="/connect?redirect_url=/rewards">Set up account</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !rewards || !config) {
    return <Skeleton className="h-40 w-full sm:w-80 rounded-3xl shrink-0" />;
  }

  const levelXp = config.levels.find((l) => l.level === rewards.currentLevel)?.xpRequired ?? 0;
  const nextLevelXp = rewards.nextLevel?.xpRequired ?? null;
  const hasXp = rewards.totalXp > 0;
  const pct = nextLevelXp ? Math.min(100, Math.round(((rewards.totalXp - levelXp) / (nextLevelXp - levelXp)) * 100)) : 100;

  return (
    <div className="shrink-0 rounded-3xl bg-gradient-to-br from-brand-rose/10 via-brand-orange/[0.06] to-transparent p-6 sm:min-w-[300px]">
      <p className="text-6xl font-black tabular-nums leading-none tracking-tight">
        {rewards.totalXp.toLocaleString()}
      </p>
      <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mt-1.5">XP earned</p>

      <div className="mt-4 flex items-center gap-2">
        <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} size="md" />
      </div>
      {!hasXp && (
        <p className="text-sm text-foreground/60 font-medium mt-2">Mint, collect, or complete your profile to start.</p>
      )}
      {rewards.nextLevel && (
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-foreground/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-rose to-brand-orange transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-foreground/60">
            {(nextLevelXp! - rewards.totalXp).toLocaleString()} XP to {rewards.nextLevel.name}
          </p>
        </div>
      )}
    </div>
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
    <section className="space-y-5">
      <SectionTitle>Your breakdown</SectionTitle>
      <div className="divide-y divide-foreground/[0.06]">
        {Object.entries(rewards.breakdown)
          .sort(([, a], [, b]) => b - a)
          .map(([action, xp]) => (
            <div key={action} className="flex items-center justify-between py-3.5">
              <span className="text-base font-medium text-foreground/70">{actionLabel(action)}</span>
              <span className="text-lg font-black tabular-nums">+{xp.toLocaleString()}</span>
            </div>
          ))}
      </div>
      {events && events.data.length > 0 && (
        <div className="divide-y divide-foreground/[0.06]">
          {events.data.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-3.5">
              <span className="text-base font-medium text-foreground/70">{actionLabel(e.actionType)}</span>
              <span className="text-lg font-black tabular-nums text-brand-rose">+{e.finalXp}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Community ─────────────────────────────────────────────────────────────────

function CommunityPanel({ address }: { address: string | null | undefined }) {
  return (
    <section className="space-y-5">
      <div>
        <SectionTitle>Community</SectionTitle>
        <p className="text-base text-foreground/60 mt-1.5 font-medium">Real members already earning XP.</p>
      </div>
      <LeaderboardPanel myAddress={address} showHeading={false} limit={12} />
    </section>
  );
}

// ── Ways to earn — bold icon tiles ───────────────────────────────────────────────

function EarnMorePanel() {
  return (
    <section className="space-y-6">
      <SectionTitle>Ways to earn</SectionTitle>
      {EARN_GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <p className={`text-sm font-black uppercase tracking-wide ${group.textClass}`}>{group.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {group.items.map(({ label, href, Icon }) => (
              <Link
                key={href + label}
                href={href}
                className="group flex flex-col gap-3 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] p-4 transition-colors"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0 ${group.tileClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold leading-snug text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ── Creator's Fund — the signature moment ────────────────────────────────────────

function CreatorsFundCard() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-rose to-brand-orange p-8 text-white">
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />

      <div className="relative space-y-6">
        <h2 className="text-3xl font-black tracking-tight leading-none">
          Creator&apos;s Fund
        </h2>

        <p className="text-base font-medium text-white/90 leading-relaxed max-w-sm">
          Every dollar Medialane earns gets shared back with the people building here.
        </p>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div>
            <p className="text-3xl font-black leading-none">$1,000</p>
            <p className="text-sm font-semibold text-white/75 mt-1.5 leading-snug">one full distribution, split by XP</p>
          </div>
          <div>
            <p className="text-3xl font-black leading-none">Your XP</p>
            <p className="text-sm font-semibold text-white/75 mt-1.5 leading-snug">your cut of every round, forever</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/airdrop"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-brand-rose hover:bg-white/90 transition-colors"
          >
            <Gift className="h-4 w-4" />
            How the fund works
          </Link>
          <a
            href="https://medialane.org/creators-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-white/90 hover:text-white transition-colors"
          >
            Watch the wallet
            <ExternalLink className="h-3.5 w-3.5" />
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
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!config) return null;

  const earnedKeys = new Set(rewards?.badges.map((b) => b.key) ?? []);

  return (
    <section className="space-y-4">
      <SectionTitle>Badges to earn</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {config.badges.map((badge: ApiRewardsBadge) => {
          const isEarned = earnedKeys.has(badge.key);
          const Icon = BADGE_ICONS[badge.icon] ?? Award;
          return (
            <div
              key={badge.key}
              title={badge.description}
              className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-colors ${
                isEarned ? "bg-brand-blue text-white" : "bg-foreground/[0.04] text-foreground/40"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-bold leading-tight">{badge.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Shared section title — full-weight, no muted low-contrast label ────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-black tracking-tight text-foreground">{children}</h2>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function RewardsDashboard() {
  const { address } = useWallet();
  const { data: rewards } = useRewards(address);
  const { leveledUpTo, newBadgeKeys, dismiss } = useRewardsCelebrations(address, rewards ?? null);

  useEffect(() => {
    if (newBadgeKeys.length === 0 || !rewards) return;
    for (const key of newBadgeKeys) {
      const badge = rewards.badges.find((b) => b.key === key);
      if (badge) toast(<BadgeUnlockToastContent badge={badge} />, { duration: 4500 });
    }
  }, [newBadgeKeys, rewards]);

  return (
    <div className="space-y-14">
      {leveledUpTo !== null && rewards && (
        <LevelUpCelebration
          level={leveledUpTo}
          name={rewards.currentLevelName}
          badgeColor={rewards.badgeColor}
          onDismiss={dismiss}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
        <Hero />
        <StatusPanel address={address} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
        {/* Left — real members already earning + your own history */}
        <div className="lg:col-span-7 space-y-14">
          <CommunityPanel address={address} />
          <PersonalPanel address={address} />
        </div>

        {/* Right — how to earn, the fund, what's achievable */}
        <div className="lg:col-span-5 space-y-10">
          <EarnMorePanel />
          <CreatorsFundCard />
          <BadgesPanel address={address} />
        </div>
      </div>
    </div>
  );
}

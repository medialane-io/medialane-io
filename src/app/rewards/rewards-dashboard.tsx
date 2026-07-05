"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useLeaderboard, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
import type { ApiRewardsBadge } from "@medialane/sdk";
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

const BADGE_ICONS: Record<string, LucideIcon> = {
  Flame, Package, CheckCircle2, GitBranch, TrendingUp, Layers,
  Ticket, Crown, Coins, Star, Gem, Zap, Award, Users, MessageSquare, HandCoins,
  Handshake,
};

// ── Hero — no card, no border, no panel background. The aurora blobs sit
// directly on the page (same as the hero slider), title in gradient-text. ────

function Hero() {
  return (
    <section className="relative overflow-hidden px-1 py-2">
      <div className="absolute aurora-purple w-[380px] h-[380px] -top-20 -left-24" />
      <div className="absolute aurora-orange w-[320px] h-[320px] top-0 right-0" />
      <div className="relative max-w-2xl space-y-4">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight gradient-text">Rewards</h1>
        <p className="text-lg sm:text-xl font-medium leading-snug">
          Every $1,000 the community brings to Medialane, we send back out —
          split between everyone creating, collecting, and taking part.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          The fund is a public wallet, open for anyone to check. Your share
          grows with how much you take part — no ranks to unlock, no gates to pass.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/airdrop"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Gift className="h-4 w-4" />
            How the fund works
          </Link>
          <a
            href="https://medialane.org/creators-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:border-foreground/30"
          >
            Watch the wallet
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Status — honest inline stat chips, the same idiom asset pages use for
// price/floor/verified: small, colored, in one row, "—" when unknown. ────────

function StatusRow({ address }: { address: string | null | undefined }) {
  const { data: rewards, isLoading } = useRewards(address);

  if (!address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">See what you&apos;ve earned so far.</p>
        <SignInButton mode="modal">
          <Button size="sm">Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  if (isLoading || !rewards) {
    return <Skeleton className="h-8 w-64 rounded-full" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: rewards.badgeColor }}>
        <Star className="h-4 w-4" />
        {rewards.currentLevelName}
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Zap className="h-4 w-4 text-brand-orange" />
        {rewards.totalXp.toLocaleString()} points
      </span>
      {rewards.nextLevel && (
        <span className="text-sm text-muted-foreground">
          {(rewards.nextLevel.xpRequired - rewards.totalXp).toLocaleString()} from becoming{" "}
          <span className="font-semibold text-foreground">{rewards.nextLevel.name}</span>
        </span>
      )}
      <AddressDisplay address={address} chars={4} className="font-mono text-xs text-muted-foreground" />
    </div>
  );
}

// ── Ways to take part — sidebar card, one accent color per theme. ─────────────

const EARN_GROUPS: {
  title: string;
  color: string;
  items: { label: string; href: string; Icon: React.ElementType }[];
}[] = [
  {
    title: "Create",
    color: "hsl(var(--brand-purple))",
    items: [
      { label: "Create a collection", href: "/create/collection", Icon: Layers },
      { label: "Mint an asset", href: "/create/asset", Icon: Palette },
      { label: "Launch a drop or POP", href: "/launchpad", Icon: Rocket },
      { label: "Launch a creator coin", href: "/launchpad/coin/create", Icon: Rocket },
      { label: "Remix existing work", href: "/marketplace", Icon: GitBranch },
    ],
  },
  {
    title: "Collect",
    color: "hsl(var(--brand-blue))",
    items: [
      { label: "Collect an asset", href: "/marketplace", Icon: ShoppingBag },
      { label: "Make an offer", href: "/marketplace", Icon: Handshake },
      { label: "List an asset for sale", href: "/portfolio/assets", Icon: Tag },
      { label: "Get an event ticket", href: "/launchpad", Icon: Ticket },
    ],
  },
  {
    title: "Connect",
    color: "hsl(var(--brand-rose))",
    items: [
      { label: "Start or join a club", href: "/launchpad", Icon: UserRoundCheck },
      { label: "Open a sponsorship", href: "/launchpad", Icon: Handshake },
      { label: "Join the conversation", href: "/marketplace", Icon: MessageSquare },
      { label: "Complete your profile", href: "/portfolio/settings", Icon: UserRoundCheck },
    ],
  },
];

function EarnMorePanel() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-5">
      <h2 className="text-lg font-bold">Ways to take part</h2>
      {EARN_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: group.color }}>{group.title}</p>
          <div className="space-y-1.5">
            {group.items.map(({ label, href, Icon }) => (
              <Link
                key={href + label}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted/60"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in srgb, ${group.color} 14%, transparent)`, color: group.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ── Badges — small colored pills for what you've earned, matching the
// same bordered-chip idiom as action buttons across the platform. What you
// haven't earned yet is a quiet text list underneath — no locked vault. ──────

function BadgesPanel({ address }: { address: string | null | undefined }) {
  const { data: config, isLoading } = useRewardsConfig();
  const { data: rewards } = useRewards(address);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  if (!config) return null;

  const earnedKeys = new Set(rewards?.badges.map((b) => b.key) ?? []);
  const earned = config.badges.filter((b) => earnedKeys.has(b.key));
  const rest = config.badges.filter((b) => !earnedKeys.has(b.key));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Badges</h2>
      {earned.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {earned.map((badge: ApiRewardsBadge) => {
            const Icon = BADGE_ICONS[badge.icon] ?? Award;
            return (
              <span
                key={badge.key}
                title={badge.description}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold"
                style={{ borderColor: `${badge.color}50`, backgroundColor: `${badge.color}12`, color: badge.color }}
              >
                <Icon className="h-4 w-4" />
                {badge.name}
              </span>
            );
          })}
        </div>
      )}
      {rest.length > 0 && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Still to discover: {rest.map((b) => b.name).join(" · ")}
        </p>
      )}
    </section>
  );
}

// ── Community — people taking part, plain list, no ranks. ─────────────────────

function CommunityPanel({ myAddress }: { myAddress: string | null | undefined }) {
  const { data, isLoading } = useLeaderboard(1, 20);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">People taking part</h2>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody&apos;s earned points yet — be the first.</p>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
          {(data?.data ?? []).map((entry) => {
            const isMe = myAddress && entry.address.toLowerCase() === myAddress.toLowerCase();
            return (
              <div key={entry.address} className={cn("flex items-center gap-3 px-4 py-3", isMe && "bg-primary/[0.05]")}>
                <span className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <AddressDisplay address={entry.address} chars={5} className="text-sm font-mono" />
                  <span className="text-xs font-semibold" style={{ color: entry.badgeColor }}>{entry.currentLevelName}</span>
                  {isMe && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">you</span>}
                </span>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {entry.totalXp.toLocaleString()}
                  <span className="ml-1 text-xs text-muted-foreground font-normal">points</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Recent + breakdown (only when signed in) ───────────────────────────────────

function PersonalPanel({ address }: { address: string | null | undefined }) {
  const { data: rewards } = useRewards(address);
  const { data: events } = useRewardsEvents(address, 1, 6);
  const { data: config } = useRewardsConfig();

  const actionLabel = (type: string) =>
    config?.actions.find((a) => a.type === type)?.label ?? ACTION_LABELS[type] ?? type;

  if (!address || !rewards || Object.keys(rewards.breakdown).length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Your points</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where they came from</p>
          <div className="space-y-1">
            {Object.entries(rewards.breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([action, xp]) => (
                <div key={action} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{actionLabel(action)}</span>
                  <span className="font-semibold tabular-nums">+{xp.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
        {events && events.data.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
            <div className="space-y-1">
              {events.data.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{actionLabel(e.actionType)}</span>
                  <span className="font-semibold tabular-nums text-emerald-500">+{e.finalXp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Dashboard — Scoreboard leads (primary column); Ways to take part sits
// in the sidebar. Two columns on desktop, single column on mobile. ───────────

export function RewardsDashboard() {
  const { address } = useWallet();

  return (
    <div className="space-y-8">
      <Hero />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <h2 className="text-xl font-black">Scoreboard</h2>
            <StatusRow address={address} />
          </div>
          <PersonalPanel address={address} />
          <BadgesPanel address={address} />
          <CommunityPanel myAddress={address} />
        </div>
        <div className="lg:col-span-5">
          <EarnMorePanel />
        </div>
      </div>
    </div>
  );
}

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

// Deterministic two-tone gradient avatar from an address — same idea as the
// wallet-row avatars in the nav command menu, so every address in the list
// reads as a distinct person rather than an anonymous data row.
function addressHue(address: string, offset = 0): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  return (hash + offset) % 360;
}

function AddressAvatar({ address, size = 32 }: { address: string; size?: number }) {
  const h1 = addressHue(address);
  const h2 = addressHue(address, 47);
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${h1} 85% 60%), hsl(${h2} 85% 55%))`,
      }}
    />
  );
}

// ── Hero — plain, no background treatment at all. Bold gradient-text title,
// body copy, two buttons. Nothing behind the text. ────────────────────────────

function Hero() {
  return (
    <section className="space-y-4 max-w-2xl">
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
    </section>
  );
}

// ── Status — honest inline stat chips. ─────────────────────────────────────────

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
      <AddressAvatar address={address} size={36} />
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
    </div>
  );
}

// ── Ways to take part — colored pill clusters, one hue per theme. ─────────────

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
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ways to take part</h2>
      {EARN_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="text-xs font-bold" style={{ color: group.color }}>{group.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map(({ label, href, Icon }) => (
              <Link
                key={href + label}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform active:scale-[0.97]"
                style={{ backgroundColor: `color-mix(in srgb, ${group.color} 12%, transparent)`, color: group.color }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ── Badges — earned ones as solid colored pills; the rest as matching
// outline-only pills (same shape, quieter color) so it reads as one
// designed set, not a sentence of words. ──────────────────────────────────────

function BadgesPanel({ address }: { address: string | null | undefined }) {
  const { data: config, isLoading } = useRewardsConfig();
  const { data: rewards } = useRewards(address);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  if (!config) return null;

  const earnedKeys = new Set(rewards?.badges.map((b) => b.key) ?? []);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Badges</h2>
      <div className="flex flex-wrap gap-1.5">
        {config.badges.map((badge: ApiRewardsBadge) => {
          const isEarned = earnedKeys.has(badge.key);
          const Icon = BADGE_ICONS[badge.icon] ?? Award;
          return (
            <span
              key={badge.key}
              title={badge.description}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={
                isEarned
                  ? { borderColor: `${badge.color}55`, backgroundColor: `${badge.color}18`, color: badge.color }
                  : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
              }
            >
              <Icon className="h-3.5 w-3.5" style={isEarned ? undefined : { opacity: 0.5 }} />
              {badge.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}

// ── Community — people taking part, with a generated avatar per address. ──────

function CommunityPanel({ myAddress }: { myAddress: string | null | undefined }) {
  const { data, isLoading } = useLeaderboard(1, 20);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">People taking part</h2>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody&apos;s earned points yet — be the first.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {(data?.data ?? []).map((entry) => {
            const isMe = myAddress && entry.address.toLowerCase() === myAddress.toLowerCase();
            return (
              <div key={entry.address} className={cn("flex items-center gap-3 py-3", isMe && "text-primary")}>
                <AddressAvatar address={entry.address} />
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
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your points</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        {events && events.data.length > 0 && (
          <div className="space-y-1">
            {events.data.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{actionLabel(e.actionType)}</span>
                <span className="font-semibold tabular-nums text-emerald-500">+{e.finalXp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Dashboard — Scoreboard (status + points + community) in the primary
// column; Badges and Ways to take part in the sidebar. ────────────────────────

export function RewardsDashboard() {
  const { address } = useWallet();

  return (
    <div className="space-y-8">
      <Hero />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <h2 className="text-xl font-black">Scoreboard</h2>
            <StatusRow address={address} />
          </div>
          <PersonalPanel address={address} />
          <CommunityPanel myAddress={address} />
        </div>
        <div className="lg:col-span-5 space-y-8">
          <BadgesPanel address={address} />
          <EarnMorePanel />
        </div>
      </div>
    </div>
  );
}

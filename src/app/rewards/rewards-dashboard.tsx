"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge, BadgeShelf, LevelLadder } from "@medialane/ui";
import { AddressDisplay } from "@/components/shared/address-display";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useLeaderboard, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
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

// ── Ways to earn ──────────────────────────────────────────────────────────────

const EARN_ACTIONS: {
  label: string;
  description: string;
  href: string;
  Icon: React.ElementType;
}[] = [
  {
    label: "Create a collection",
    description: "Deploy a new ERC-721 or ERC-1155 collection",
    href: "/create/collection",
    Icon: Layers,
  },
  {
    label: "Mint an asset",
    description: "Mint into one of your collections",
    href: "/create/asset",
    Icon: Palette,
  },
  {
    label: "Launch a drop or POP",
    description: "Run a public launch on the Launchpad",
    href: "/launchpad",
    Icon: Rocket,
  },
  {
    label: "List an asset for sale",
    description: "Open your portfolio to list at a fixed price",
    href: "/portfolio/assets",
    Icon: Tag,
  },
  {
    label: "Make an offer",
    description: "Bid on assets across the marketplace",
    href: "/marketplace",
    Icon: Handshake,
  },
  {
    label: "Collect an asset",
    description: "Buy a listing — earn XP as a collector",
    href: "/marketplace",
    Icon: ShoppingBag,
  },
  {
    label: "Remix existing work",
    description: "Build on top of another creator's IP",
    href: "/marketplace",
    Icon: GitBranch,
  },
  {
    label: "Host a ticketed event",
    description: "Sell tickets your fans can trade and redeem",
    href: "/launchpad",
    Icon: Sparkles,
  },
  {
    label: "Start or join a club",
    description: "Build a membership community around your work",
    href: "/launchpad",
    Icon: UserRoundCheck,
  },
  {
    label: "Open a sponsorship",
    description: "Let sponsors bid on your work",
    href: "/launchpad",
    Icon: Handshake,
  },
  {
    label: "Launch a creator coin",
    description: "Put your own coin into the world",
    href: "/launchpad/coin/create",
    Icon: Rocket,
  },
  {
    label: "Complete your profile",
    description: "Set a display name, avatar, and socials",
    href: "/portfolio/settings",
    Icon: UserRoundCheck,
  },
];

function EarnMorePanel() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
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
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                {description}
              </p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Creator's Fund + Airdrop ──────────────────────────────────────────────────

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

function AirdropStatusCard({
  address,
  totalXp,
  rank,
}: {
  address: string;
  totalXp: number;
  rank: number | null;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your airdrop status
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-background/60 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Score
          </p>
          <p className="text-xl font-black tracking-tight mt-1 tabular-nums">
            {totalXp.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted-foreground">XP</span>
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/60 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Global rank
          </p>
          <p className="text-xl font-black tracking-tight mt-1 tabular-nums">
            {rank !== null ? `#${rank}` : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-2.5">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-300/90">
          Registered — wallet{" "}
          <AddressDisplay
            address={address}
            chars={4}
            className="font-mono text-emerald-300/90"
          />{" "}
          is eligible for every distribution.
        </p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Your payout at each $1,000 round is proportional to your score relative
        to all participants. Keep earning XP to grow your share.
      </p>
    </section>
  );
}

// ── My Rank panel (left column) ───────────────────────────────────────────────

function MyRankPanel({ address }: { address: string }) {
  const { data: rewards, isLoading } = useRewards(address);
  const { data: config } = useRewardsConfig();
  const { data: events } = useRewardsEvents(address, 1, 8);

  const actionLabel = (type: string) =>
    config?.actions.find((a) => a.type === type)?.label ?? ACTION_LABELS[type] ?? type;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!rewards) return null;

  return (
    <div className="space-y-5">
      {/* Level card */}
      <div
        className="relative rounded-2xl border p-5 space-y-4 overflow-hidden"
        style={{
          borderColor: `${rewards.badgeColor}40`,
          backgroundColor: `${rewards.badgeColor}08`,
        }}
      >
        <div
          className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: rewards.badgeColor }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <LevelBadge
              level={rewards.currentLevel}
              name={rewards.currentLevelName}
              badgeColor={rewards.badgeColor}
              size="lg"
            />
            <p className="text-4xl font-black tracking-tight">
              {rewards.totalXp.toLocaleString()} XP
            </p>
          </div>
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black"
            style={{
              backgroundColor: `${rewards.badgeColor}20`,
              color: rewards.badgeColor,
            }}
          >
            {rewards.currentLevel}
          </div>
        </div>

        {rewards.nextLevel ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Progress to Lv.{rewards.nextLevel.level} · {rewards.nextLevel.name}
              </span>
              <span>{rewards.progressPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${rewards.progressPct}%`,
                  backgroundColor: rewards.badgeColor,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {(rewards.nextLevel.xpRequired - rewards.totalXp).toLocaleString()} XP to go
            </p>
          </div>
        ) : (
          <p
            className="text-xs font-semibold"
            style={{ color: rewards.badgeColor }}
          >
            Maximum level reached — Genesis.
          </p>
        )}
      </div>

      {config && config.levels.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            The journey
          </p>
          <LevelLadder levels={config.levels} currentLevel={rewards.currentLevel} />
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Badges
        </p>
        <BadgeShelf
          badges={config?.badges ?? rewards.badges}
          earnedKeys={rewards.badges.map((b) => b.key)}
          showLocked={Boolean(config)}
        />
      </div>

      {Object.keys(rewards.breakdown).length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            XP breakdown
          </p>
          <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden bg-card/30">
            {Object.entries(rewards.breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([action, xp]) => (
                <div
                  key={action}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm text-muted-foreground">
                    {actionLabel(action)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {events && events.data.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </p>
          <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden bg-card/30">
            {events.data.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{actionLabel(e.actionType)}</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-400">
                  +{e.finalXp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard panel (right column) ──────────────────────────────────────────

function LeaderboardPanel({ myAddress }: { myAddress: string | null }) {
  const { data, isLoading } = useLeaderboard(1, 25);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Leaderboard
          </h3>
        </div>
        {data?.meta?.total ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {data.meta.total.toLocaleString()} creators
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
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
            const isMe =
              myAddress &&
              entry.address.toLowerCase() === myAddress.toLowerCase();
            return (
              <div
                key={entry.address}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  isMe && "bg-primary/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "w-6 text-center text-sm font-bold shrink-0 tabular-nums",
                    entry.rank <= 3
                      ? "text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {entry.rank}
                </span>

                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <AddressDisplay
                    address={entry.address}
                    chars={5}
                    className="text-sm font-mono"
                  />
                  <LevelBadge
                    level={entry.currentLevel}
                    name={entry.currentLevelName}
                    badgeColor={entry.badgeColor}
                    size="sm"
                  />
                  {isMe && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      you
                    </span>
                  )}
                </div>

                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {entry.totalXp.toLocaleString()}
                  <span className="ml-1 text-xs text-muted-foreground font-normal">
                    XP
                  </span>
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
  const { address, isConnected } = useWallet();
  const { data: rewards } = useRewards(address);
  const { data: leaderboard } = useLeaderboard(1, 100);

  if (!isConnected) {
    return <SignedOutView />;
  }

  // Find current user's rank from the cached leaderboard (best effort)
  const myRank =
    address && leaderboard?.data
      ? leaderboard.data.find(
          (e) => e.address.toLowerCase() === address.toLowerCase()
        )?.rank ?? null
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column — your rank */}
      <div className="lg:col-span-7 space-y-6">
        {address ? (
          <MyRankPanel address={address} />
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading wallet…
          </div>
        )}
        <EarnMorePanel />
      </div>

      {/* Right column — fund, airdrop, leaderboard */}
      <div className="lg:col-span-5 space-y-6">
        <CreatorsFundCard />
        {address && (
          <AirdropStatusCard
            address={address}
            totalXp={rewards?.totalXp ?? 0}
            rank={myRank}
          />
        )}
        <LeaderboardPanel myAddress={address} />
      </div>
    </div>
  );
}

function SignedOutView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl border border-border/60 bg-card/50 p-10 text-center space-y-4">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Sign in to see your rank</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Connect your wallet to track your XP, badges, and airdrop share.
          </p>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <CreatorsFundCard />
        <LeaderboardPanel myAddress={null} />
      </div>
    </div>
  );
}

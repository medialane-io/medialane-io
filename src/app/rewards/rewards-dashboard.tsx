"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge, BadgeShelf, LevelLadder, ClaimRail } from "@medialane/ui";
import { AddressDisplay } from "@/components/shared/address-display";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useLeaderboard, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
import {
  Trophy,
  Sparkles,
  ArrowUpRight,
  Palette,
  Layers,
  Tag,
  Handshake,
  ShoppingBag,
  Rocket,
  GitBranch,
  UserRoundCheck,
  Wallet as WalletIcon,
  Gift,
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

// ── The Spectrum Ring — the page's signature mark ──────────────────────────────
// A level medallion whose progress arc is drawn in the platform's full brand
// gradient (blue → purple → rose → orange, the same stops as .btn-border-animated
// and ServiceHeader's border) rather than one flat hue. It's how this page says
// "leveling up plugs you into the same current as the rest of Medialane."

function SpectrumRing({
  level,
  progressPct,
  size = 116,
  dim = false,
}: {
  level: number | React.ReactNode;
  progressPct: number;
  size?: number;
  dim?: boolean;
}) {
  const stroke = size / 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, progressPct)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="spectrum-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--brand-blue))" />
            <stop offset="35%" stopColor="hsl(var(--brand-purple))" />
            <stop offset="70%" stopColor="hsl(var(--brand-rose))" />
            <stop offset="100%" stopColor="hsl(var(--brand-orange))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={dim ? "hsl(var(--muted-foreground))" : "url(#spectrum-ring)"}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", dim && "opacity-30")}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {typeof level === "number" ? (
          <span className="font-black tabular-nums" style={{ fontSize: size * 0.32 }}>
            {level}
          </span>
        ) : (
          <span className="text-muted-foreground/60">{level}</span>
        )}
      </div>
    </div>
  );
}

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
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Right rail — Creator's Fund, reframed as ClaimRail's three vivid panels ────

function FundRail() {
  return (
    <ClaimRail
      included={[
        { icon: Layers, title: "Create", desc: "Collections, editions, drops, tickets, clubs, coins." },
        { icon: ShoppingBag, title: "Collect", desc: "Buying, offering, and holding all count." },
        { icon: Sparkles, title: "Engage", desc: "Comments and community actions add up too." },
      ]}
      steps={[
        "The Creator's Fund collects platform activity into one public wallet",
        "Every $1,000 collected triggers a distribution round",
        "Your share is weighted by your XP relative to everyone else's",
      ]}
      trustLead="It's a public on-chain wallet —"
      trust="anyone can verify every distribution, on-chain, at any time."
      trustIcon={Gift}
    />
  );
}

// ── My Rank hero (left column) ─────────────────────────────────────────────────

function MyRankPanel({ address }: { address: string }) {
  const { data: rewards, isLoading } = useRewards(address);
  const { data: config } = useRewardsConfig();
  const { data: events } = useRewardsEvents(address, 1, 8);
  const { data: leaderboard } = useLeaderboard(1, 100);

  const myRank = leaderboard?.data.find((e) => e.address.toLowerCase() === address.toLowerCase())?.rank ?? null;

  const actionLabel = (type: string) =>
    config?.actions.find((a) => a.type === type)?.label ?? ACTION_LABELS[type] ?? type;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!rewards) return null;

  return (
    <div className="space-y-5">
      {/* Hero score card — spectrum-ring gradient border matches ServiceHeader */}
      <div className="rounded-2xl p-[1.5px] bg-gradient-to-br from-brand-blue via-brand-purple to-brand-rose">
        <div className="rounded-[15px] bg-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-5">
            <SpectrumRing level={rewards.currentLevel} progressPct={rewards.progressPct} />
            <div className="min-w-0 space-y-1.5">
              <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} size="lg" />
              <p className="text-3xl font-black tracking-tight tabular-nums">
                {rewards.totalXp.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">XP</span>
              </p>
              {myRank && (
                <p className="text-xs text-muted-foreground">
                  Ranked <span className="font-semibold text-foreground">#{myRank}</span> · wallet{" "}
                  <AddressDisplay address={address} chars={4} className="font-mono" />
                </p>
              )}
            </div>
          </div>

          {rewards.nextLevel ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Next: Lv.{rewards.nextLevel.level} · {rewards.nextLevel.name}</span>
                <span>{rewards.progressPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-rose transition-all duration-700"
                  style={{ width: `${rewards.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {(rewards.nextLevel.xpRequired - rewards.totalXp).toLocaleString()} XP to go
              </p>
            </div>
          ) : (
            <p className="text-xs font-semibold text-brand-orange">Maximum level reached — Genesis.</p>
          )}
        </div>
      </div>

      {config && config.levels.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">The journey</p>
          <LevelLadder levels={config.levels} currentLevel={rewards.currentLevel} />
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Badges</p>
        <BadgeShelf
          badges={config?.badges ?? rewards.badges}
          earnedKeys={rewards.badges.map((b) => b.key)}
          showLocked={Boolean(config)}
        />
      </div>

      {Object.keys(rewards.breakdown).length > 0 && (
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

      {events && events.data.length > 0 && (
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
  );
}

// ── Leaderboard panel (right column) ──────────────────────────────────────────

const MEDAL: Record<number, { ring: string; text: string }> = {
  1: { ring: "border-amber-400/50 bg-amber-400/10", text: "text-amber-400" },
  2: { ring: "border-slate-300/50 bg-slate-300/10", text: "text-slate-300" },
  3: { ring: "border-orange-400/50 bg-orange-400/10", text: "text-orange-400" },
};

function LeaderboardPanel({ myAddress }: { myAddress: string | null }) {
  const { data, isLoading } = useLeaderboard(1, 25);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Leaderboard</h3>
        </div>
        {data?.meta?.total ? (
          <span className="text-xs text-muted-foreground tabular-nums">{data.meta.total.toLocaleString()} creators</span>
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
            const isMe = myAddress && entry.address.toLowerCase() === myAddress.toLowerCase();
            const medal = MEDAL[entry.rank];
            return (
              <div key={entry.address} className={cn("flex items-center gap-3 px-4 py-2.5 transition-colors", isMe && "bg-primary/[0.06]")}>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums",
                    medal ? cn(medal.ring, medal.text) : "border-transparent text-muted-foreground"
                  )}
                >
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
  const { address, isConnected } = useWallet();

  if (!isConnected) {
    return <SignedOutView />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        {address ? <MyRankPanel address={address} /> : <div className="py-10 text-center text-sm text-muted-foreground">Loading wallet…</div>}
        <EarnMorePanel />
      </div>
      <div className="lg:col-span-5 space-y-4">
        <FundRail />
        <LeaderboardPanel myAddress={address} />
      </div>
    </div>
  );
}

function SignedOutView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl p-[1.5px] bg-gradient-to-br from-brand-blue via-brand-purple to-brand-rose">
        <div className="rounded-[15px] bg-card p-8 sm:p-10 flex flex-col items-center text-center gap-5">
          <SpectrumRing level={<WalletIcon className="h-7 w-7" />} progressPct={0} size={96} dim />
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Sign in to see your rank</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Sign in to track your XP, badges, and Creator&apos;s Fund share.
            </p>
          </div>
          <div className="btn-border-animated p-[1px] rounded-2xl">
            <SignInButton mode="modal">
              <Button className="h-11 px-6 text-sm font-semibold bg-card text-white rounded-[15px] hover:brightness-110 active:scale-[0.98]">
                Sign in
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <FundRail />
        <LeaderboardPanel myAddress={null} />
      </div>
    </div>
  );
}

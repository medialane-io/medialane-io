"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LevelBadge } from "@medialane/ui";
import { AddressDisplay } from "@/components/shared/address-display";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useRewards, useLeaderboard, useRewardsConfig, useRewardsEvents } from "@/hooks/use-rewards";
import type { ApiRewardsBadge } from "@medialane/sdk";
import {
  Gift,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Palette,
  Layers,
  Tag,
  Handshake,
  ShoppingBag,
  Rocket,
  GitBranch,
  UserRoundCheck,
  type LucideIcon,
  Package,
  CheckCircle2,
  TrendingUp,
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
  Flame, Package, CheckCircle2, GitBranch, TrendingUp, Layers,
  Ticket, Crown, Coins, Star, Gem, Zap, Award, Users, MessageSquare, HandCoins,
  Handshake,
};

// ── The Creator's Fund — the actual point of this page. Medialane hands
// value back to the people who show up; everything else here is just a
// window into that. Leads the page, not an afterthought card. ────────────────

function CreatorsFundHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 sm:p-7 space-y-4">
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 shrink-0">
          <Gift className="h-4 w-4" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">Rewards</h1>
      </div>
      <p className="relative text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
        Every $1,000 the community brings to Medialane, we send back out — split
        between everyone creating, collecting, and taking part.
      </p>
      <p className="relative text-sm text-muted-foreground leading-relaxed max-w-2xl">
        The fund is a public wallet, open for anyone to check. Your share grows
        with how much you take part — no ranks to unlock, no gates to pass.
      </p>
      <div className="relative flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/airdrop"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 transition-colors"
        >
          How the fund works
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="https://medialane.org/creators-fund"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border text-sm font-semibold px-5 transition-colors hover:border-foreground/30"
        >
          Watch the wallet
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

// ── Your standing — name + points, no numeric hierarchy, no "of 50". ──────────

function StatusBar({ address }: { address: string | null | undefined }) {
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
    return <Skeleton className="h-14 w-full max-w-md rounded-xl" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} size="lg" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black tabular-nums">{rewards.totalXp.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">points</span>
      </div>
      {rewards.nextLevel && (
        <p className="text-sm text-muted-foreground">
          {(rewards.nextLevel.xpRequired - rewards.totalXp).toLocaleString()} points from becoming{" "}
          <span className="font-semibold text-foreground">{rewards.nextLevel.name}</span>
        </p>
      )}
    </div>
  );
}

// ── Ways to take part — grouped into 3 plain themes, real-sized tiles ─────────

const EARN_GROUPS: {
  title: string;
  items: { label: string; description: string; href: string; Icon: React.ElementType }[];
}[] = [
  {
    title: "Create",
    items: [
      { label: "Create a collection", description: "Start a new collection for your work", href: "/create/collection", Icon: Layers },
      { label: "Mint an asset", description: "Add a piece into one of your collections", href: "/create/asset", Icon: Palette },
      { label: "Launch a drop or POP", description: "Run a public launch on the Launchpad", href: "/launchpad", Icon: Rocket },
      { label: "Launch a creator coin", description: "Put your own coin into the world", href: "/launchpad/coin/create", Icon: Rocket },
      { label: "Remix existing work", description: "Build on top of another creator's IP", href: "/marketplace", Icon: GitBranch },
    ],
  },
  {
    title: "Collect",
    items: [
      { label: "Collect an asset", description: "Buy a listing you love", href: "/marketplace", Icon: ShoppingBag },
      { label: "Make an offer", description: "Bid on assets across the marketplace", href: "/marketplace", Icon: Handshake },
      { label: "List an asset for sale", description: "Open your portfolio to list at a fixed price", href: "/portfolio/assets", Icon: Tag },
      { label: "Get an event ticket", description: "Join a ticketed event", href: "/launchpad", Icon: Ticket },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Start or join a club", description: "Build a community around your work", href: "/launchpad", Icon: UserRoundCheck },
      { label: "Open a sponsorship", description: "Let sponsors back your work", href: "/launchpad", Icon: Handshake },
      { label: "Join the conversation", description: "Comment on the work you care about", href: "/marketplace", Icon: MessageSquare },
      { label: "Complete your profile", description: "Add a name, avatar, and socials", href: "/portfolio/settings", Icon: UserRoundCheck },
    ],
  },
];

function EarnMorePanel() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">Ways to take part</h2>
      </div>
      {EARN_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map(({ label, description, href, Icon }) => (
              <Link
                key={href + label}
                href={href}
                className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ── Badges — a collection to fill in, not a vault to unlock. Earned ones are
// full color; the rest are simply quieter, no padlock. ───────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  creator: "For creating",
  collector: "For collecting",
  community: "For showing up",
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges
              .filter((b) => b.category === category)
              .map((badge) => {
                const isEarned = earned.has(badge.key);
                const Icon = BADGE_ICONS[badge.icon] ?? Award;
                return (
                  <div
                    key={badge.key}
                    title={badge.description}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={
                        isEarned
                          ? { backgroundColor: `${badge.color}18`, color: badge.color }
                          : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={cn("text-xs font-semibold leading-tight", !isEarned && "text-muted-foreground")}>
                      {badge.name}
                    </p>
                    {!isEarned && <p className="text-[10px] text-muted-foreground/70 leading-snug">{badge.description}</p>}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({ address }: { address: string | null | undefined }) {
  const { data: rewards } = useRewards(address);
  const { data: events } = useRewardsEvents(address, 1, 8);
  const { data: config } = useRewardsConfig();

  const actionLabel = (type: string) =>
    config?.actions.find((a) => a.type === type)?.label ?? ACTION_LABELS[type] ?? type;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7">
        <EarnMorePanel />
      </div>
      <div className="lg:col-span-5 space-y-6">
        {address && rewards && Object.keys(rewards.breakdown).length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where your points came from</p>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-card">
              {Object.entries(rewards.breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([action, xp]) => (
                  <div key={action} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{actionLabel(action)}</span>
                    <span className="text-sm font-semibold tabular-nums">+{xp.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        {address && events && events.data.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-card">
              {events.data.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{actionLabel(e.actionType)}</span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-400">+{e.finalXp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BadgesTab({ address }: { address: string | null | undefined }) {
  const { data: config, isLoading } = useRewardsConfig();
  const { data: rewards } = useRewards(address);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!config) return null;

  return <BadgeGrid badges={config.badges} earnedKeys={rewards?.badges.map((b) => b.key) ?? []} />;
}

// ── Community — the people taking part, not a ranked ladder. ─────────────────

function CommunityTab({ myAddress }: { myAddress: string | null | undefined }) {
  const { data, isLoading } = useLeaderboard(1, 25);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">People taking part</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="py-10 text-center text-muted-foreground space-y-2">
          <Users className="h-8 w-8 mx-auto opacity-20" />
          <p className="text-sm">Nobody&apos;s earned points yet — be the first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.data ?? []).map((entry) => {
            const isMe = myAddress && entry.address.toLowerCase() === myAddress.toLowerCase();
            return (
              <div
                key={entry.address}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5",
                  isMe && "border-primary/40 bg-primary/[0.04]"
                )}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
                  <AddressDisplay address={entry.address} chars={5} className="text-sm font-mono" />
                  <LevelBadge level={entry.currentLevel} name={entry.currentLevelName} badgeColor={entry.badgeColor} size="sm" />
                  {isMe && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">you</span>}
                </div>
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

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function RewardsDashboard() {
  const { address } = useWallet();

  return (
    <div className="space-y-8">
      <CreatorsFundHero />
      <StatusBar address={address} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Ways to take part</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-6">
          <OverviewTab address={address} />
        </TabsContent>
        <TabsContent value="badges" className="pt-6">
          <BadgesTab address={address} />
        </TabsContent>
        <TabsContent value="community" className="pt-6">
          <CommunityTab myAddress={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

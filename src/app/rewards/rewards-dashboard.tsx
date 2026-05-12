"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/rewards/level-badge";
import { BadgeShelf } from "@/components/rewards/badge-shelf";
import { AddressDisplay } from "@/components/shared/address-display";
import { useMyWallet } from "@/hooks/use-my-wallet";
import { useUser } from "@clerk/nextjs";
import { useRewards, useLeaderboard } from "@/hooks/use-rewards";
import { Wallet, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  refer_user: "Referrals",
};

// ── My Rank panel ─────────────────────────────────────────────────────────────

function MyRankPanel({ address }: { address: string }) {
  const { data: rewards, isLoading } = useRewards(address);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!rewards) return null;

  return (
    <div className="space-y-5">
      {/* Level card */}
      <div
        className="relative rounded-2xl border p-5 space-y-4 overflow-hidden"
        style={{ borderColor: `${rewards.badgeColor}40`, backgroundColor: `${rewards.badgeColor}08` }}
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
            <p className="text-3xl font-black tracking-tight">
              {rewards.totalXp.toLocaleString()} XP
            </p>
          </div>
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black"
            style={{ backgroundColor: `${rewards.badgeColor}20`, color: rewards.badgeColor }}
          >
            {rewards.currentLevel}
          </div>
        </div>

        {rewards.nextLevel ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to Lv.{rewards.nextLevel.level} · {rewards.nextLevel.name}</span>
              <span>{rewards.progressPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${rewards.progressPct}%`, backgroundColor: rewards.badgeColor }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {(rewards.nextLevel.xpRequired - rewards.totalXp).toLocaleString()} XP to go
            </p>
          </div>
        ) : (
          <p className="text-xs font-semibold" style={{ color: rewards.badgeColor }}>
            Maximum level reached — Genesis.
          </p>
        )}
      </div>

      {rewards.badges.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Badges</p>
          <BadgeShelf badges={rewards.badges} />
        </div>
      )}

      {Object.keys(rewards.breakdown).length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">XP breakdown</p>
          <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden">
            {Object.entries(rewards.breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([action, xp]) => (
                <div key={action} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">
                    {ACTION_LABELS[action] ?? action}
                  </span>
                  <span className="text-sm font-semibold">{xp.toLocaleString()} XP</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard panel ─────────────────────────────────────────────────────────

function LeaderboardPanel({ myAddress }: { myAddress: string | null | undefined }) {
  const { data, isLoading } = useLeaderboard(1, 50);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const entries = data?.data ?? [];

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground space-y-2">
        <Trophy className="h-10 w-10 mx-auto opacity-20" />
        <p className="text-sm">No scores computed yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 divide-y divide-border/40 overflow-hidden">
      {entries.map((entry) => {
        const isMe = myAddress && entry.address.toLowerCase() === myAddress.toLowerCase();
        return (
          <div
            key={entry.address}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              isMe && "bg-primary/5"
            )}
          >
            <span
              className={cn(
                "w-7 text-center text-sm font-bold shrink-0",
                entry.rank <= 3 ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
            </span>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <AddressDisplay address={entry.address} chars={5} className="text-sm font-mono" />
                {isMe && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">you</span>
                )}
              </div>
              <LevelBadge
                level={entry.currentLevel}
                name={entry.currentLevelName}
                badgeColor={entry.badgeColor}
                size="sm"
              />
            </div>

            <span className="text-sm font-semibold tabular-nums shrink-0">
              {entry.totalXp.toLocaleString()}
              <span className="ml-1 text-xs text-muted-foreground font-normal">XP</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function RewardsDashboard() {
  const { isSignedIn } = useUser();
  const { backendWalletAddress } = useMyWallet();

  if (!isSignedIn) {
    return (
      <div className="py-24 text-center space-y-6">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Sign in to see your rank</h2>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to see your XP, level, and badges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="rank">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="rank" className="flex-1 gap-1.5">
          <Star className="h-3.5 w-3.5" />
          My Rank
        </TabsTrigger>
        <TabsTrigger value="leaderboard" className="flex-1 gap-1.5">
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rank">
        {backendWalletAddress ? (
          <MyRankPanel address={backendWalletAddress} />
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading wallet…
          </div>
        )}
      </TabsContent>

      <TabsContent value="leaderboard">
        <LeaderboardPanel myAddress={backendWalletAddress} />
      </TabsContent>
    </Tabs>
  );
}

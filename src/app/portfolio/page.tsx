"use client";

import Link from "next/link";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUserOrders } from "@/hooks/use-orders";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useRemixOffers } from "@/hooks/use-remix-offers";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useRewards } from "@/hooks/use-rewards";
import { PortfolioOverview, derivePortfolioCounts } from "@medialane/ui";
import { AssetsGrid } from "@/components/portfolio/assets-grid";
import { ActivityRow } from "@/components/shared/activity-row";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function PortfolioOverviewPage() {
  const { walletAddress } = useSessionKey();
  const address = walletAddress ?? null;

  const { orders } = useUserOrders(address);
  const { meta, isLoading: loadingTokens } = useTokensByOwner(address, 1, 4);
  const { offers: remixOffers } = useRemixOffers("creator");
  const { activities, isLoading: loadingActivity } = useActivitiesByAddress(address);
  const { collections } = useCollectionsByOwner(address);
  const { data: rewards } = useRewards(address ?? undefined);

  const counts = derivePortfolioCounts(orders, remixOffers, address);
  const totalAssets = meta?.total ?? null;
  const recentActivity = activities.slice(0, 5);

  const isEmpty =
    !loadingTokens &&
    !loadingActivity &&
    totalAssets === 0 &&
    activities.length === 0 &&
    orders.length === 0;

  return (
    <PortfolioOverview
      attention={[
        {
          label: `${counts.received} offer${counts.received === 1 ? "" : "s"} received`,
          description: "Accept, counter, or decline",
          href: "/portfolio/received",
          count: counts.received,
          tone: "destructive",
        },
        {
          label: `${counts.counter} counter-offer${counts.counter === 1 ? "" : "s"}`,
          description: "A seller countered your offer",
          href: "/portfolio/counter-offers",
          count: counts.counter,
          tone: "warning",
        },
        {
          label: `${counts.remix} licensing request${counts.remix === 1 ? "" : "s"}`,
          description: "Someone wants to remix your work",
          href: "/portfolio/licensing",
          count: counts.remix,
          tone: "primary",
        },
      ]}
      stats={[
        {
          label: "Assets",
          value: totalAssets,
          sub: collections.length > 0
            ? `${collections.length} collection${collections.length === 1 ? "" : "s"}`
            : undefined,
          href: "/portfolio/assets",
        },
        { label: "Listings", value: counts.listings, href: "/portfolio/listings" },
        {
          label: "Offers received",
          value: counts.received,
          sub: counts.received > 0 ? "Respond in Trading" : undefined,
          href: "/portfolio/received",
        },
        {
          label: "Rewards",
          value: rewards ? rewards.currentLevelName : null,
          sub: rewards ? `${rewards.totalXp.toLocaleString()} XP` : undefined,
          href: "/rewards",
        },
      ]}
      quickActions={[
        { label: "Create asset", href: "/create/asset" },
        { label: "Launch collection", href: "/create/collection" },
        { label: "Browse marketplace", href: "/marketplace" },
      ]}
      assetsHref="/portfolio/assets"
      assetsSlot={
        <AssetsGrid
          address={address}
          limit={4}
          gridClassName="grid grid-cols-2 xl:grid-cols-4 gap-4"
        />
      }
      activityHref="/portfolio/activity"
      activitySlot={
        loadingActivity ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/50">
            {recentActivity.map((activity, i) => (
              <ActivityRow
                key={`${activity.txHash}-${activity.type}-${i}`}
                activity={activity}
                showActor={false}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
            No activity yet.
          </div>
        )
      }
      isEmpty={isEmpty}
      emptyState={
        <div className="rounded-xl border border-border p-10 text-center space-y-4">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Start your portfolio</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Mint your first asset or explore the marketplace — everything you own and trade shows up here.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/create/asset">Create an asset</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/marketplace">Browse marketplace</Link>
            </Button>
          </div>
        </div>
      }
    />
  );
}

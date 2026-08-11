"use client";

import Link from "next/link";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useUserOrders } from "@/hooks/use-orders";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useActivitiesByAddress } from "@/hooks/use-activities";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { PortfolioOverview, CollectionCard, AssetCard, type PortfolioBentoTileConfig } from "@medialane/ui";
import { AssetsGrid } from "@/components/portfolio/assets-grid";
import { ActivityRow } from "@/components/shared/activity-row";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const TICKET_TYPES = new Set(["ticket", "club"]);

export default function PortfolioOverviewPage() {
  const { address: walletAddress } = useWalletNativeSession();
  const address = walletAddress ?? null;

  const { orders } = useUserOrders(address);
  const { tokens, meta, isLoading: loadingTokens } = useTokensByOwner(address, 1, 8);
  const { activities, isLoading: loadingActivity } = useActivitiesByAddress(address);
  const { collections, isLoading: loadingCollections } = useCollectionsByOwner(address);

  const totalAssets = meta?.total ?? null;
  const recentActivity = activities.slice(0, 5);
  const passItems = tokens.filter((t) =>
    TICKET_TYPES.has((t.metadata.ipType ?? "").toLowerCase()),
  );

  const isEmpty =
    !loadingTokens &&
    !loadingActivity &&
    !loadingCollections &&
    totalAssets === 0 &&
    activities.length === 0 &&
    orders.length === 0 &&
    collections.length === 0;

  const tiles: PortfolioBentoTileConfig[] = [
    {
      key: "assets",
      title: "Assets",
      href: "/portfolio/assets",
      isEmpty: !loadingTokens && totalAssets === 0,
      content: (
        <AssetsGrid
          address={address}
          limit={4}
          gridClassName="grid grid-cols-2 gap-3"
        />
      ),
    },
    {
      key: "collections",
      title: "Collections",
      href: "/portfolio/collections",
      isEmpty: collections.length === 0,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {collections.slice(0, 4).map((c) => (
            <CollectionCard key={c.contractAddress} collection={c} />
          ))}
        </div>
      ),
    },
    {
      key: "tickets",
      title: "Tickets & memberships",
      href: "/portfolio/assets",
      isEmpty: !loadingTokens && passItems.length === 0,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {passItems.slice(0, 4).map((t) => (
            <AssetCard
              key={`${t.contractAddress}-${t.tokenId}`}
              href={`/asset/starknet/${t.contractAddress}/${t.tokenId}`}
              name={t.metadata.name ?? `#${t.tokenId}`}
              image={t.metadata.image}
              ipType={t.metadata.ipType}
              fallbackId={t.tokenId}
            />
          ))}
        </div>
      ),
    },
    {
      key: "activity",
      title: "Activity",
      href: "/portfolio/activity",
      size: "wide",
      isEmpty: !loadingActivity && recentActivity.length === 0,
      content: (
        <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/50">
          {recentActivity.map((activity, i) => (
            <ActivityRow
              key={`${activity.txHash}-${activity.type}-${i}`}
              activity={activity}
              showActor={false}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <PortfolioOverview
      tiles={tiles}
      isEmpty={isEmpty}
      emptyState={
        <div className="rounded-2xl bg-gradient-to-br from-brand-purple to-brand-orange p-10 text-center space-y-4 text-white">
          <Sparkles className="h-8 w-8 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight">Start your portfolio</h2>
            <p className="text-sm font-medium text-white/80 max-w-sm mx-auto">
              Mint your first asset or explore the marketplace — everything you own and trade shows up here.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button asChild className="bg-white text-foreground hover:bg-white/90">
              <Link href="/launchpad/single-editions">Create an asset</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link href="/marketplace">Browse marketplace</Link>
            </Button>
          </div>
        </div>
      }
    />
  );
}

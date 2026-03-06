"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import {
  Zap,
  ImagePlus,
  Layers,
  ArrowRight,
  Package,
  Tag,
  TrendingUp,
  ShoppingCart,
  Star,
  Rocket,
} from "lucide-react";

function CreatorStats({ address }: { address: string }) {
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(address);
  const { orders, isLoading: ordersLoading } = useUserOrders(address);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
  const totalSales = orders.filter((o) => o.status === "FULFILLED");

  const stats = [
    {
      label: "Assets owned",
      value: tokensLoading ? null : tokens.length,
      icon: Package,
    },
    {
      label: "Active listings",
      value: ordersLoading ? null : activeListings.length,
      icon: Tag,
    },
    {
      label: "Total sales",
      value: ordersLoading ? null : totalSales.length,
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              {label}
            </p>
          </div>
          {value === null ? (
            <Skeleton className="h-7 w-12 mt-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    title: "Mint IP Asset",
    description: "Register a single creative work — art, music, document, or any IP — as an NFT.",
    icon: ImagePlus,
    href: "/create/asset",
    color: "primary" as const,
    badge: "1 min",
  },
  {
    title: "Create Collection",
    description: "Deploy a named NFT collection contract and build your IP catalog.",
    icon: Layers,
    href: "/create/collection",
    color: "purple" as const,
    badge: "2 min",
  },
];

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    hoverBg: "group-hover:bg-primary/20",
    icon: "text-primary",
    border: "group-hover:border-primary/30",
  },
  purple: {
    bg: "bg-purple-500/10",
    hoverBg: "group-hover:bg-purple-500/20",
    icon: "text-purple-500",
    border: "group-hover:border-purple-500/30",
  },
};

export function LaunchpadContent() {
  const { user, isSignedIn } = useUser();
  const walletAddress = user?.publicMetadata?.publicKey as string | undefined;

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Launchpad</span>
        </div>
        <h1 className="text-3xl font-bold">Creator Hub</h1>
        <p className="text-muted-foreground">
          Launch, mint, and monetize your intellectual property on Starknet — gasless for everyone.
        </p>
      </div>

      {/* Creator stats (signed-in only) */}
      {isSignedIn && walletAddress && (
        <CreatorStats address={walletAddress} />
      )}

      {/* Quick actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Start creating</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(({ title, description, icon: Icon, href, color, badge }) => {
            const c = colorMap[color];
            return (
              <Link key={href} href={href} className="group">
                <div className={`rounded-xl border border-border bg-card p-6 h-full transition-all ${c.border} hover:shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-11 w-11 rounded-xl ${c.bg} ${c.hoverBg} flex items-center justify-center transition-colors`}>
                      <Icon className={`h-5 w-5 ${c.icon}`} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Get started <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* My Portfolio link */}
      {isSignedIn && (
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Your portfolio</p>
              <p className="text-sm text-muted-foreground">
                View your assets, active listings, and open offers.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/portfolio">
              View <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Featured drops (future) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured drops</h2>
          <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
        </div>
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="flex justify-center gap-2 text-muted-foreground/40">
            <Star className="h-6 w-6" />
            <Rocket className="h-6 w-6" />
            <Star className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Curated creator drops will appear here. Build your collection and apply to be featured.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

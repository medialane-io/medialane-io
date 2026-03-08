"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { HeroAurora } from "@/components/ui/aurora";
import {
  Zap, ImagePlus, Layers, ArrowRight,
  Package, Tag, ShoppingCart, Star, Rocket,
} from "lucide-react";

function CreatorStats({ address }: { address: string }) {
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(address);
  const { orders, isLoading: ordersLoading } = useUserOrders(address);
  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
  const totalSales = orders.filter((o) => o.status === "FULFILLED");

  const stats = [
    { label: "Owned", value: tokensLoading ? null : tokens.length, icon: Package, color: "text-brand-purple", bg: "bg-brand-purple/10" },
    { label: "Listed", value: ordersLoading ? null : activeListings.length, icon: Tag, color: "text-brand-blue", bg: "bg-brand-blue/10" },
    { label: "Sold", value: ordersLoading ? null : totalSales.length, icon: ShoppingCart, color: "text-brand-orange", bg: "bg-brand-orange/10" },
  ];

  return (
    <Stagger className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <StaggerItem key={label}>
          <div className="bento-cell p-4 text-center">
            <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {value === null ? (
              <Skeleton className="h-7 w-10 mx-auto" />
            ) : (
              <p className="text-2xl font-black">{value}</p>
            )}
            <p className="section-label mt-1">{label}</p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

const QUICK_ACTIONS = [
  {
    title: "Mint IP Asset",
    description: "Register a creative work as an NFT. Gasless.",
    icon: ImagePlus,
    href: "/create/asset",
    gradient: "from-brand-purple/20 to-brand-blue/20",
    iconColor: "text-brand-purple",
    iconBg: "bg-brand-purple/15",
    badge: "~1 min",
  },
  {
    title: "Create Collection",
    description: "Deploy a named NFT collection and build your catalog.",
    icon: Layers,
    href: "/create/collection",
    gradient: "from-brand-blue/20 to-brand-rose/20",
    iconColor: "text-brand-blue",
    iconBg: "bg-brand-blue/15",
    badge: "~2 min",
  },
];

export function LaunchpadContent() {
  const { user, isSignedIn } = useUser();
  const walletAddress = user?.publicMetadata?.publicKey as string | undefined;
  const { collections: featured, isLoading: featuredLoading } = useCollections(1, 6, true);

  return (
    <div className="pb-16 space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <HeroAurora />
        <div className="relative px-4 py-14 sm:py-20">
          <FadeIn>
            <span className="pill-badge mb-5 inline-flex">
              <Zap className="h-3 w-3" />
              Creator Launchpad
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              Launch your{" "}
              <span className="gradient-text-warm">creative vision</span>
              <br />
              on-chain — gasless.
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
              Mint, monetize, and manage your intellectual property on Starknet. No gas fees. No barriers. Just create.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      {isSignedIn && walletAddress && (
        <section className="px-4">
          <FadeIn>
            <p className="section-label mb-3">Your activity</p>
          </FadeIn>
          <CreatorStats address={walletAddress} />
        </section>
      )}

      {/* Quick actions */}
      <section className="px-4 space-y-3">
        <FadeIn>
          <p className="section-label">Start creating</p>
          <h2 className="text-xl font-bold mt-0.5">What do you want to build?</h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ title, description, icon: Icon, href, gradient, iconColor, iconBg, badge }, i) => (
            <FadeIn key={href} delay={0.08 + i * 0.07}>
              <Link href={href} className="block">
                <div className={`bento-cell p-5 bg-gradient-to-br ${gradient} min-h-[140px] flex flex-col justify-between`}>
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-background/60 rounded-full px-2.5 py-0.5">
                      {badge}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="font-bold text-base">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Portfolio shortcut */}
      {isSignedIn && (
        <section className="px-4">
          <FadeIn>
            <div className="bento-cell p-5 bg-gradient-to-r from-brand-navy/10 to-brand-purple/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="section-label">Manage</p>
                <p className="font-bold text-base mt-0.5">Your portfolio</p>
                <p className="text-sm text-muted-foreground mt-1">Assets, listings, offers, and activity.</p>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/portfolio">
                  View portfolio <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Featured drops */}
      <section className="px-4 space-y-4">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Curated</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Star className="h-4 w-4 text-brand-orange" />
                <h2 className="text-xl font-bold">Featured drops</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link href="/collections">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </FadeIn>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
          </div>
        ) : featured.length > 0 ? (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((col) => (
              <StaggerItem key={col.contractAddress}>
                <CollectionCard collection={col} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <FadeIn>
            <div className="bento-cell border-dashed p-12 text-center space-y-3">
              <div className="flex justify-center gap-2 text-muted-foreground/30">
                <Star className="h-6 w-6" /><Rocket className="h-6 w-6" /><Star className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">Curated creator drops will appear here.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/marketplace">Browse marketplace</Link>
              </Button>
            </div>
          </FadeIn>
        )}
      </section>
    </div>
  );
}

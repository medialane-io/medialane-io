"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import {
  Zap, ImagePlus, Layers, ArrowRight,
  Package, Tag, ShoppingCart, Star, Rocket,
  GitBranch, Users, RefreshCw, Ticket, Coins, TrendingUp, Lock,
} from "lucide-react";

function HeroStats({ address }: { address: string }) {
  const { tokens, isLoading: tl } = useTokensByOwner(address);
  const { orders, isLoading: ol } = useUserOrders(address);
  const activeListings = orders.filter(
    (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721"
  );
  const totalSales = orders.filter((o) => o.status === "FULFILLED");
  const pills = [
    { label: "Owned",  value: tl ? null : tokens.length,        icon: Package,      color: BRAND.purple.text },
    { label: "Listed", value: ol ? null : activeListings.length, icon: Tag,          color: BRAND.blue.text   },
    { label: "Sold",   value: ol ? null : totalSales.length,     icon: ShoppingCart, color: BRAND.orange.text },
  ];
  return (
    <div className="flex flex-wrap gap-2 mt-5">
      {pills.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 text-sm">
          <Icon className={`h-3.5 w-3.5 ${color}`} />
          {value === null
            ? <Skeleton className="h-4 w-6 inline-block" />
            : <span className="font-bold">{value}</span>}
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

const ACTIVE_TOOLS = [
  {
    title: "Mint IP Asset",
    description: "Register any creative work as a programmable IP NFT. Gasless, permanent, immutable.",
    icon: ImagePlus,
    href: "/create/asset",
    gradient: `${BRAND.blue.from} ${BRAND.blue.to}`,
    iconBg: BRAND.blue.bgSolid,
    iconColor: BRAND.blue.text,
    buttonColor: "bg-brand-blue",
    badge: "~1 min",
  },
  {
    title: "Create Collection",
    description: "Deploy a named ERC-721 collection and build your IP catalog on Starknet.",
    icon: Layers,
    href: "/create/collection",
    gradient: `${BRAND.purple.from} ${BRAND.purple.to}`,
    iconBg: BRAND.purple.bgSolid,
    iconColor: BRAND.purple.text,
    buttonColor: "bg-brand-purple",
    badge: "~2 min",
  },
  {
    title: "Remix an Asset",
    description: "Create a derivative work with on-chain attribution and programmable license terms.",
    icon: GitBranch,
    href: "/marketplace",
    gradient: `${BRAND.rose.from} ${BRAND.rose.to}`,
    iconBg: BRAND.rose.bgSolid,
    iconColor: BRAND.rose.text,
    buttonColor: "bg-brand-rose",
    badge: "~3 min",
  },
] as const;

const COMING_SOON = [
  { title: "Collection Drop", description: "Limited edition timed releases",   icon: Package    },
  { title: "Membership",      description: "Token-gated access passes",         icon: Users      },
  { title: "Subscriptions",   description: "Recurring revenue streams",         icon: RefreshCw  },
  { title: "IP Tickets",      description: "Event and experience NFTs",         icon: Ticket     },
  { title: "IP Coins",        description: "Fungible tokens backed by IP",      icon: Coins      },
  { title: "Creator Coins",   description: "Personal social tokens",            icon: TrendingUp },
] as const;

export function LaunchpadContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { collections: featured, isLoading: featuredLoading } = useCollections(1, 6, true);

  return (
    <div className="pb-16 space-y-10">

      {/* ── Section 1: Hero ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="px-4 py-14 sm:py-20">
          <FadeIn>
            <span className="pill-badge mb-5 inline-flex">
              <Zap className="h-3 w-3" />
              Creator Capital Markets
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              The Financial Hub for<br />
              <span className="gradient-text">Creator IP on Starknet</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              Mint, structure, and monetize your intellectual property as programmable financial assets.
              No intermediaries. Full sovereignty.
            </p>
          </FadeIn>
          {isSignedIn && walletAddress && (
            <FadeIn delay={0.24}>
              <HeroStats address={walletAddress} />
            </FadeIn>
          )}
        </div>
      </section>

      {/* ── Section 2: Active Tools ───────────────────────────── */}
      <section className="px-4 space-y-3">
        <FadeIn>
          <p className="section-label">Active Tools</p>
          <h2 className="text-xl font-bold mt-0.5">What do you want to build?</h2>
        </FadeIn>
        <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ACTIVE_TOOLS.map(({ title, description, icon: Icon, href, gradient, iconBg, iconColor, buttonColor, badge }) => (
            <StaggerItem key={href}>
              <div className={`bento-cell p-5 bg-gradient-to-br ${gradient} min-h-[200px] flex flex-col justify-between`}>
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-background/60 rounded-full px-2.5 py-0.5">
                    {badge}
                  </span>
                </div>
                <div className="mt-4 flex-1">
                  <p className="font-bold text-base">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                </div>
                <div className="btn-border-animated p-[1px] rounded-xl mt-4">
                  <Link href={href}>
                    <button className={`w-full h-10 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] ${buttonColor}`}>
                      Get started
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Section 3: Revenue Streams ────────────────────────── */}
      <section className="px-4 space-y-3">
        <FadeIn>
          <p className="section-label">Coming Soon</p>
          <h2 className="text-xl font-bold mt-0.5">Unlock New Revenue Streams</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Medialane is building the complete financial toolkit for creator capital markets.
          </p>
        </FadeIn>
        <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COMING_SOON.map(({ title, description, icon: Icon }) => (
            <StaggerItem key={title}>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 text-center opacity-70 cursor-default select-none">
                <Icon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                <div className="flex items-center justify-center gap-1 mt-3">
                  <Lock className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wide">Coming Soon</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Section 4: Portfolio shortcut (signed in only) ────── */}
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

      {/* ── Section 5: Featured drops ─────────────────────────── */}
      <section className="px-4 space-y-4">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Curated</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Star className={`h-4 w-4 ${BRAND.orange.text}`} />
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

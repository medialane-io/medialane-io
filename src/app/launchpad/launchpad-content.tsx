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
  GitBranch, Users, RefreshCw, Ticket, Coins, TrendingUp, Lock, Globe, ExternalLink, Award,
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
  {
    title: "Proof of Participation",
    description: "Claim your soulbound on-chain credential for events, bootcamps, and workshops on Starknet.",
    icon: Award,
    href: "/launchpad/pop",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    buttonColor: "bg-green-600",
    badge: "Live",
  },
] as const;

const COMING_SOON = [
  {
    title: "Collection Drop",
    description: "Launch limited edition timed releases with a supply cap and mint window. Set your drop date, let your community race to collect — scarcity drives demand.",
    icon: Package,
    gradient: "from-orange-500/10 to-amber-500/10",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    badge: "Building now" as const,
  },
  {
    title: "IP Tickets",
    description: "Gate real-world events with NFTs. Distribute tickets for concerts, workshops, and experiences — each with built-in proof of attendance on Starknet.",
    icon: Ticket,
    gradient: "from-green-500/10 to-emerald-500/10",
    border: "border-green-500/20",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    badge: "Building now" as const,
  },
  {
    title: "Membership",
    description: "Create token-gated access passes. Holders unlock exclusive content, private communities, and creator experiences — your superfans become stakeholders.",
    icon: Users,
    gradient: "from-purple-500/10 to-violet-500/10",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    badge: undefined,
  },
  {
    title: "Subscriptions",
    description: "Generate recurring revenue from your IP. Monthly licensing, creator support tiers, and access passes — all on-chain and auto-renewed without intermediaries.",
    icon: RefreshCw,
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    badge: undefined,
  },
  {
    title: "IP Coins",
    description: "Tokenize your intellectual property as fungible tokens. Enable fractional ownership and create liquid markets around your creative work.",
    icon: Coins,
    gradient: "from-yellow-500/10 to-amber-500/10",
    border: "border-yellow-500/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-600",
    badge: undefined,
  },
  {
    title: "Creator Coins",
    description: "Launch your personal social token. Let fans invest directly in your creative career — full economic alignment between creator and community.",
    icon: TrendingUp,
    gradient: "from-rose-500/10 to-pink-500/10",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    badge: undefined,
  },
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

      {/* ── Section 2b: Your Collection Page ────────────────── */}
      <section className="px-4">
        <FadeIn>
          <div className="bento-cell p-5 sm:p-8 bg-gradient-to-br from-brand-purple/[0.08] via-brand-blue/[0.05] to-transparent overflow-hidden relative">
            {/* Decorative background icon */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center opacity-[0.06] select-none pointer-events-none">
              <Layers className="h-48 w-48" />
            </div>
            <div className="relative z-10 max-w-lg space-y-4">
              <div>
                <p className="section-label">Drop Pages</p>
                <h2 className="text-xl font-bold mt-0.5">Every collection gets a branded page</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Share your work as a standalone creator drop page — fully branded, shareable on social, and accessible to anyone. Customize your name, banner, and links in collection settings.
                </p>
              </div>
              {/* URL bar mockup */}
              <div className="flex items-center gap-2 bg-muted/60 border border-border/60 rounded-lg px-3 py-2 max-w-sm">
                <Globe className={`h-3.5 w-3.5 shrink-0 ${BRAND.purple.text}`} />
                <span className="font-mono text-xs text-muted-foreground">medialane.io/collections/</span>
                <span className={`font-mono text-xs font-semibold ${BRAND.blue.text} truncate`}>your-collection</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="btn-border-animated p-[1px] rounded-xl">
                  <Link href="/create/collection">
                    <button className={`h-9 px-4 rounded-[11px] flex items-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] ${BRAND.purple.bgSolid}`}>
                      Create a collection
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                  <Link href="/collections">
                    Browse collections <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Section 3: Coming Soon ────────────────────────────── */}
      <section className="px-4 space-y-4">
        <FadeIn>
          <p className="section-label">Coming Soon</p>
          <h2 className="text-xl font-bold mt-0.5">What makes Medialane different</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            We are building the complete financial toolkit for creator capital markets — a full suite of services with a 1% commission and no intermediaries.
          </p>
        </FadeIn>
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMING_SOON.map(({ title, description, icon: Icon, gradient, border, iconBg, iconColor, badge }) => (
            <StaggerItem key={title}>
              <div className={`rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5 flex flex-col gap-3 min-h-[190px] relative overflow-hidden`}>
                {badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                    {badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm">{title}</p>
                    <Lock className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>
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

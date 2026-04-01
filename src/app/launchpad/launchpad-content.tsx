"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  Zap, ImagePlus, Layers, ArrowRight,
  Package, Tag, ShoppingCart,
  GitBranch, Users, RefreshCw, Ticket, Coins, TrendingUp,
  Lock, Globe, ExternalLink, Award, CheckCircle2, Search, X,
} from "lucide-react";

// ── Hero stats ──────────────────────────────────────────────────────────────
function HeroStats({ address }: { address: string }) {
  const { tokens, isLoading: tl } = useTokensByOwner(address);
  const { orders, isLoading: ol } = useUserOrders(address);
  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721");
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
          {value === null ? <Skeleton className="h-4 w-6 inline-block" /> : <span className="font-bold">{value}</span>}
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Service definitions ─────────────────────────────────────────────────────
type ServiceStatus = "live" | "building" | "soon";

interface ServiceDef {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  href?: string;
  buttonLabel?: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  accentBg: string;
  buttonColor?: string;
  badge: string;
  status: ServiceStatus;
  category: "tool" | "service" | "roadmap";
}

const SERVICES: ServiceDef[] = [
  {
    title: "Mint IP Asset",
    subtitle: "Creative tool · ~1 min",
    description: "Turn any creative file into a programmable IP NFT. Gasless, permanent, and immediately tradeable on Starknet.",
    features: ["Gasless transaction via ChipiPay", "IPFS-anchored metadata", "Programmable licensing built-in"],
    icon: ImagePlus,
    href: "/create/asset",
    buttonLabel: "Mint asset",
    gradient: "from-blue-500/[0.07] to-cyan-500/[0.04]",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    accentBg: "bg-blue-500",
    buttonColor: "bg-brand-blue",
    badge: "Live",
    status: "live",
    category: "tool",
  },
  {
    title: "Create Collection",
    subtitle: "Creative tool · ~2 min",
    description: "Deploy a named ERC-721 collection with its own branded page, metadata, and on-chain identity on Starknet.",
    features: ["Factory-deployed ERC-721", "Branded collection page", "Add assets at any time"],
    icon: Layers,
    href: "/create/collection",
    buttonLabel: "Create collection",
    gradient: "from-purple-500/[0.07] to-violet-500/[0.04]",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    accentBg: "bg-purple-500",
    buttonColor: "bg-brand-purple",
    badge: "Live",
    status: "live",
    category: "tool",
  },
  {
    title: "Remix an Asset",
    subtitle: "Creative tool · ~3 min",
    description: "Create a licensed derivative of any IP asset with full on-chain provenance and attribution to the original creator.",
    features: ["On-chain attribution chain", "License terms enforced at mint", "Royalties flow to original creator"],
    icon: GitBranch,
    href: "/marketplace",
    buttonLabel: "Browse to remix",
    gradient: "from-rose-500/[0.07] to-pink-500/[0.04]",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    accentBg: "bg-rose-500",
    buttonColor: "bg-brand-rose",
    badge: "Live",
    status: "live",
    category: "tool",
  },
  {
    title: "POP Protocol",
    subtitle: "Service · Soulbound credentials",
    description: "Issue non-transferable on-chain credentials for bootcamps, workshops, hackathons, and conferences. Each attendee claims one soulbound badge — permanently tied to their wallet, forever provable.",
    features: ["Soulbound · non-transferable ERC-721", "One credential per wallet address", "Claim window with optional allowlist"],
    icon: Award,
    href: "/launchpad/pop",
    buttonLabel: "View POP events",
    gradient: "from-green-500/[0.07] to-emerald-500/[0.04]",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    accentBg: "bg-green-500",
    buttonColor: "bg-green-600",
    badge: "Live",
    status: "live",
    category: "service",
  },
  {
    title: "Collection Drop",
    subtitle: "Service · Limited edition releases",
    description: "Launch a fixed-supply ERC-721 drop with a defined mint window and per-wallet limit. Set your open date and let your community race to collect before supply runs out.",
    features: ["Fixed supply cap you control", "Timed mint window open → close", "Free or paid mint with any ERC-20"],
    icon: Package,
    href: "/launchpad/drop",
    buttonLabel: "View drops",
    gradient: "from-orange-500/[0.07] to-amber-500/[0.04]",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    accentBg: "bg-orange-500",
    buttonColor: "bg-orange-600",
    badge: "Live",
    status: "live",
    category: "service",
  },
  {
    title: "IP Tickets",
    subtitle: "Roadmap · Event gating",
    description: "Distribute tickets for concerts, workshops, and real-world events. Each ticket doubles as verifiable on-chain proof of attendance.",
    features: ["NFT-based event access gating", "Proof-of-attendance on-chain", "Transferable or soulbound options"],
    icon: Ticket,
    gradient: "from-emerald-500/[0.05] to-teal-500/[0.03]",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    accentBg: "bg-emerald-500",
    badge: "Building now",
    status: "building",
    category: "roadmap",
  },
  {
    title: "Membership",
    subtitle: "Roadmap · Access passes",
    description: "Create tiered membership passes that unlock exclusive content, private communities, and creator experiences for your most loyal fans.",
    features: ["Token-gated content access", "Tiered membership levels", "Community-aligned incentives"],
    icon: Users,
    gradient: "from-violet-500/[0.05] to-purple-500/[0.03]",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    accentBg: "bg-violet-500",
    badge: "Soon",
    status: "soon",
    category: "roadmap",
  },
  {
    title: "Subscriptions",
    subtitle: "Roadmap · Recurring revenue",
    description: "Generate recurring revenue from your IP. Monthly licensing, creator support tiers, and access passes — all on-chain and auto-renewed without intermediaries.",
    features: ["Recurring on-chain revenue", "Auto-renewal protocol", "No platform fee middlemen"],
    icon: RefreshCw,
    gradient: "from-sky-500/[0.05] to-blue-500/[0.03]",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    accentBg: "bg-sky-500",
    badge: "Soon",
    status: "soon",
    category: "roadmap",
  },
  {
    title: "IP Coins",
    subtitle: "Roadmap · Fractional ownership",
    description: "Tokenize your IP catalog as fungible tokens. Enable fractional ownership and create liquid markets around your creative work.",
    features: ["Fungible IP tokens (ERC-20)", "Fractional ownership model", "Liquid secondary markets"],
    icon: Coins,
    gradient: "from-amber-500/[0.05] to-yellow-500/[0.03]",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    accentBg: "bg-amber-500",
    badge: "Soon",
    status: "soon",
    category: "roadmap",
  },
  {
    title: "Creator Coins",
    subtitle: "Roadmap · Social tokens",
    description: "Launch a personal social token tied to your creative career. Let fans invest directly in your work — full economic alignment between creator and community.",
    features: ["Personal social token", "Fan investment mechanics", "Creator-community alignment"],
    icon: TrendingUp,
    gradient: "from-rose-500/[0.05] to-pink-500/[0.03]",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    accentBg: "bg-rose-500",
    badge: "Soon",
    status: "soon",
    category: "roadmap",
  },
];

// ── Service card ────────────────────────────────────────────────────────────
function ServiceCard({ s }: { s: ServiceDef }) {
  const live = s.status === "live";
  const building = s.status === "building";

  return (
    <div className={cn(
      "bento-cell flex flex-col overflow-hidden transition-shadow duration-200",
      live && "hover:shadow-md",
      `bg-gradient-to-br ${s.gradient}`
    )}>
      {/* Colored top accent */}
      <div className={cn("h-[3px] w-full shrink-0", live || building ? s.accentBg : "bg-border/40")} />

      <div className="flex flex-col flex-1 p-6 gap-5">

        {/* Icon + badge row */}
        <div className="flex items-start justify-between">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", s.iconBg)}>
            <s.icon className={cn("h-6 w-6", live || building ? s.iconColor : "text-muted-foreground/40")} />
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 border flex items-center gap-1",
            live && s.badge === "Live"
              ? "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
              : building
                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                : "text-muted-foreground/50 bg-muted/40 border-border/30"
          )}>
            {!live && !building && <Lock className="h-2.5 w-2.5" />}
            {live && s.badge === "Live" && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
            {s.badge}
          </span>
        </div>

        {/* Title block */}
        <div>
          <p className={cn("text-lg font-bold leading-snug", !live && !building && "text-muted-foreground/60")}>
            {s.title}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium">{s.subtitle}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Description */}
        <p className={cn("text-sm leading-relaxed", live || building ? "text-muted-foreground" : "text-muted-foreground/40")}>
          {s.description}
        </p>

        {/* Features */}
        <ul className="space-y-2 flex-1">
          {s.features.map((f) => (
            <li key={f} className={cn("flex items-center gap-2.5 text-sm", live || building ? "" : "text-muted-foreground/30")}>
              {live || building
                ? <CheckCircle2 className={cn("h-4 w-4 shrink-0", live ? s.iconColor : "text-amber-500/60")} />
                : <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0 ml-[3px]" />
              }
              <span className={live || building ? "" : "text-muted-foreground/40"}>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {live ? (
          <div className="btn-border-animated p-[1px] rounded-xl">
            <Link href={s.href!}>
              <button className={cn(
                "w-full h-10 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]",
                s.buttonColor
              )}>
                {s.buttonLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        ) : (
          <button
            disabled
            className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground/40 bg-muted/30 border border-border/20 cursor-not-allowed"
          >
            <Lock className="h-3.5 w-3.5" />
            {building ? "In development" : "Coming soon"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Filter button ───────────────────────────────────────────────────────────
function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export function LaunchpadContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "roadmap">("all");

  const filtered = useMemo(() => SERVICES.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || s.title.toLowerCase().includes(q)
      || s.subtitle.toLowerCase().includes(q)
      || s.description.toLowerCase().includes(q)
      || s.features.some((f) => f.toLowerCase().includes(q));
    const matchesFilter =
      filter === "all"
      || (filter === "live" && s.status === "live")
      || (filter === "roadmap" && (s.status === "building" || s.status === "soon"));
    return matchesSearch && matchesFilter;
  }), [search, filter]);

  const counts = useMemo(() => ({
    all: SERVICES.length,
    live: SERVICES.filter((s) => s.status === "live").length,
    roadmap: SERVICES.filter((s) => s.status !== "live").length,
  }), []);

  return (
    <div className="pb-16 space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────── */}
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

      {/* ── Services ─────────────────────────────────────────────── */}
      <section className="px-4 space-y-5">

        {/* Section header */}
        <FadeIn>
          <div className="space-y-1">
            <p className="section-label">Platform</p>
            <h2 className="text-xl font-bold">Everything you can build</h2>
          </div>
        </FadeIn>

        {/* Search + filter toolbar */}
        <FadeIn delay={0.06}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search services…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9 h-9 bg-muted/30 border-border/50 focus:border-border"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                All <span className="ml-1 text-xs opacity-60">{counts.all}</span>
              </FilterChip>
              <FilterChip active={filter === "live"} onClick={() => setFilter("live")}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Live <span className="text-xs opacity-60">{counts.live}</span>
                </span>
              </FilterChip>
              <FilterChip active={filter === "roadmap"} onClick={() => setFilter("roadmap")}>
                Roadmap <span className="ml-1 text-xs opacity-60">{counts.roadmap}</span>
              </FilterChip>
            </div>
          </div>
        </FadeIn>

        {/* Grid */}
        {filtered.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-16 text-center space-y-3">
              <Search className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground">No services match your search.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilter("all"); }}>
                Clear filters
              </Button>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((s) => (
              <StaggerItem key={s.title}>
                <ServiceCard s={s} />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Result count (when filtered) */}
        {(search || filter !== "all") && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {filtered.length} of {SERVICES.length} services
          </p>
        )}
      </section>

      {/* ── Drop Pages promo ──────────────────────────────────────── */}
      <section className="px-4">
        <FadeIn>
          <div className="bento-cell p-5 sm:p-8 bg-gradient-to-br from-brand-purple/[0.08] via-brand-blue/[0.05] to-transparent overflow-hidden relative">
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

      {/* ── Portfolio shortcut ────────────────────────────────────── */}
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

    </div>
  );
}

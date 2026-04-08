"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  Zap, ImagePlus, Layers, ArrowRight,
  Package, Tag, ShoppingCart,
  GitBranch, Users, RefreshCw, Ticket, Coins, TrendingUp,
  Lock, Globe, ExternalLink, Award,
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
type ServiceCategory = "create" | "launch" | "monetize";

interface ServiceDef {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  href?: string;
  buttonLabel?: string;
  browseHref?: string;
  browseLinkLabel?: string;
  // Gradient: 3-stop diagonal, richer than before
  gradient: string;
  // Tinted border color for live cards
  borderColor: string;
  iconColor: string;
  buttonColor?: string;
  badge: string;
  status: ServiceStatus;
  category: ServiceCategory;
}

const SERVICES: ServiceDef[] = [
  // ── Create ─────────────────────────────────────────────────────────────
  {
    title: "Mint IP Asset",
    subtitle: "Register any creative work onchain",
    description: "Turn any creative file into a programmable IP NFT. Gasless, permanent, and immediately tradeable.",
    features: ["Gasless via ChipiPay", "IPFS metadata", "Programmable licensing"],
    icon: ImagePlus,
    href: "/create/asset",
    buttonLabel: "Mint asset",
    gradient: "from-blue-500/10 via-sky-400/4 to-transparent",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-500",
    buttonColor: "bg-brand-blue hover:bg-brand-blue/90",
    badge: "Create",
    status: "live",
    category: "create",
  },
  {
    title: "Create Collection",
    subtitle: "Deploy a named ERC-721 catalog",
    description: "Deploy a branded collection with its own page, metadata, and on-chain identity — ready to populate with assets.",
    features: ["Factory-deployed ERC-721", "Branded collection page", "Add assets at any time"],
    icon: Layers,
    href: "/create/collection",
    buttonLabel: "Create collection",
    gradient: "from-violet-500/10 via-purple-400/4 to-transparent",
    borderColor: "border-violet-500/20",
    iconColor: "text-violet-500",
    buttonColor: "bg-brand-purple hover:bg-brand-purple/90",
    badge: "Create",
    status: "live",
    category: "create",
  },
  {
    title: "Remix Asset",
    subtitle: "Derivative works with on-chain attribution",
    description: "Create a licensed derivative of any IP asset with full provenance and attribution flowing back to the original creator.",
    features: ["On-chain attribution", "License-enforced at mint", "Royalties to original creator"],
    icon: GitBranch,
    href: "/marketplace",
    buttonLabel: "Browse to remix",
    gradient: "from-rose-500/10 via-pink-400/4 to-transparent",
    borderColor: "border-rose-500/20",
    iconColor: "text-rose-500",
    buttonColor: "bg-brand-rose hover:bg-brand-rose/90",
    badge: "Remix",
    status: "live",
    category: "create",
  },

  // ── Launch ─────────────────────────────────────────────────────────────
  {
    title: "POP Protocol",
    subtitle: "Soulbound credentials for events & education",
    description: "Issue non-transferable on-chain credentials for bootcamps, hackathons, and conferences. Each attendee claims one soulbound badge — permanently tied to their wallet.",
    features: ["Soulbound · non-transferable", "One credential per wallet", "Optional allowlist gating"],
    icon: Award,
    href: "/launchpad/pop/create",
    buttonLabel: "Create Event",
    browseHref: "/launchpad/pop",
    browseLinkLabel: "Browse events",
    gradient: "from-emerald-500/10 via-green-400/4 to-transparent",
    borderColor: "border-emerald-500/20",
    iconColor: "text-emerald-500",
    buttonColor: "bg-green-600 hover:bg-green-700",
    badge: "Launch",
    status: "live",
    category: "launch",
  },
  {
    title: "Collection Drop",
    subtitle: "Limited-edition timed releases",
    description: "Launch a fixed-supply ERC-721 drop with a defined mint window and per-wallet limit. Set your open date and let your community race to collect.",
    features: ["Fixed supply cap", "Timed mint window", "Free or paid mint"],
    icon: Package,
    href: "/launchpad/drop/create",
    buttonLabel: "Launch Drop",
    browseHref: "/launchpad/drop",
    browseLinkLabel: "Browse drops",
    gradient: "from-orange-500/10 via-amber-400/4 to-transparent",
    borderColor: "border-orange-500/20",
    iconColor: "text-orange-500",
    buttonColor: "bg-orange-600 hover:bg-orange-700",
    badge: "Launch",
    status: "live",
    category: "launch",
  },
  {
    title: "IP Tickets",
    subtitle: "Gate real-world experiences with NFTs",
    description: "Distribute tickets for concerts, workshops, and events. Each ticket is verifiable on-chain proof of attendance.",
    features: ["NFT-based event gating", "Proof of attendance", "Transferable or soulbound"],
    icon: Ticket,
    gradient: "from-teal-500/7 via-cyan-400/3 to-transparent",
    borderColor: "border-teal-500/15",
    iconColor: "text-teal-500",
    badge: "Soon",
    status: "building",
    category: "launch",
  },
  {
    title: "Membership",
    subtitle: "Token-gated access passes",
    description: "Create tiered membership passes that unlock exclusive content, private communities, and experiences for your most loyal fans.",
    features: ["Token-gated content", "Tiered access levels", "Community alignment"],
    icon: Users,
    gradient: "from-indigo-500/6 via-violet-400/2 to-transparent",
    borderColor: "border-indigo-500/10",
    iconColor: "text-indigo-400",
    badge: "Soon",
    status: "soon",
    category: "launch",
  },

  // ── Monetize ───────────────────────────────────────────────────────────
  {
    title: "Subscriptions",
    subtitle: "Recurring on-chain revenue",
    description: "Monthly licensing, creator support tiers, and access passes — all auto-renewed without intermediaries.",
    features: ["Recurring revenue", "Auto-renewal protocol", "No middlemen"],
    icon: RefreshCw,
    gradient: "from-sky-500/6 via-blue-400/2 to-transparent",
    borderColor: "border-sky-500/10",
    iconColor: "text-sky-400",
    badge: "Soon",
    status: "soon",
    category: "monetize",
  },
  {
    title: "IP Coins",
    subtitle: "Fractional ownership of intellectual property",
    description: "Tokenize your IP catalog as fungible tokens. Enable fractional ownership and liquid markets around your creative work.",
    features: ["Fungible IP tokens", "Fractional ownership", "Liquid secondary markets"],
    icon: Coins,
    gradient: "from-amber-500/6 via-yellow-400/2 to-transparent",
    borderColor: "border-amber-500/10",
    iconColor: "text-amber-400",
    badge: "Soon",
    status: "soon",
    category: "monetize",
  },
  {
    title: "Creator Coins",
    subtitle: "Personal social token for fans",
    description: "Launch a social token tied to your creative career. Let fans invest directly in your work — full economic alignment between creator and community.",
    features: ["Personal social token", "Fan investment", "Creator-community alignment"],
    icon: TrendingUp,
    gradient: "from-pink-500/6 via-rose-400/2 to-transparent",
    borderColor: "border-pink-500/10",
    iconColor: "text-pink-400",
    badge: "Soon",
    status: "soon",
    category: "monetize",
  },
];

// ── Service card ────────────────────────────────────────────────────────────
function ServiceCard({ s }: { s: ServiceDef }) {
  const live = s.status === "live";
  const building = s.status === "building";
  const active = live || building;

  return (
    <div className={cn(
      "group relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col",
      `bg-gradient-to-br ${s.gradient}`,
      active ? s.borderColor : "border-border/20",
      live && "hover:-translate-y-[3px] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
      !active && "opacity-60"
    )}>
      <div className="flex flex-col flex-1 p-7 gap-6">

        {/* Icon + badge */}
        <div className="flex items-start justify-between">
          <s.icon className={cn(
            "h-9 w-9 transition-transform duration-300",
            active ? s.iconColor : "text-muted-foreground/25",
            live && "group-hover:scale-110"
          )} />
          <span className={cn(
            "text-[10px] font-semibold tracking-widest uppercase rounded-full px-2.5 py-1 flex items-center gap-1.5",
            live
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : building
                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                : "text-muted-foreground/40 bg-muted/30"
          )}>
            {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {!active && <Lock className="h-2.5 w-2.5" />}
            {s.badge}
          </span>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <p className={cn(
            "text-xl sm:text-2xl font-bold leading-snug tracking-tight",
            !active && "text-foreground/40"
          )}>
            {s.title}
          </p>
          <p className={cn(
            "text-xs leading-relaxed",
            active ? "text-muted-foreground" : "text-muted-foreground/30"
          )}>
            {s.subtitle}
          </p>
        </div>

        {/* Description */}
        <p className={cn(
          "text-sm leading-relaxed flex-1",
          active ? "text-muted-foreground" : "text-muted-foreground/30"
        )}>
          {s.description}
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5">
          {s.features.map((f) => (
            <span key={f} className={cn(
              "text-[11px] px-2.5 py-1 rounded-full border font-medium",
              active
                ? "bg-background/50 border-border/50 text-muted-foreground"
                : "bg-muted/10 border-border/15 text-muted-foreground/25"
            )}>
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        {live ? (
          <div className="space-y-2">
            <Link
              href={s.href!}
              className={cn(
                "flex items-center justify-between w-full h-10 px-4 rounded-xl",
                "text-sm font-semibold text-white",
                "transition-all duration-200 active:scale-[0.98]",
                s.buttonColor
              )}
            >
              {s.buttonLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {s.browseHref && (
              <Link
                href={s.browseHref}
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {s.browseLinkLabel}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground/30 font-medium">
            <Lock className="h-3.5 w-3.5" />
            {building ? "In development" : "Coming soon"}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Filter chip ─────────────────────────────────────────────────────────────
function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
        active
          ? "bg-foreground text-background border-transparent"
          : "bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
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

  const filtered = SERVICES;

  return (
    <div className="pb-16 space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="px-4 py-14 sm:py-20">
          <FadeIn>
            <span className="pill-badge mb-5 inline-flex">
              <Zap className="h-3 w-3" />
              Creator
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              <span className="gradient-text">Launchpad</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              Permissionless smart contracts to create and generate new monetization revenues onchain, with full sovereignty and ownership.
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

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {filtered.map((s) => (
            <ServiceCard key={s.title} s={s} />
          ))}
        </motion.div>

      </section>

      {/* ── Drop Pages promo ──────────────────────────────────────── */}
      <section className="px-4">
        <FadeIn>
          <div className="rounded-2xl border border-border/40 p-5 sm:p-8 bg-gradient-to-br from-brand-purple/[0.08] via-brand-blue/[0.05] to-transparent overflow-hidden relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center opacity-[0.05] select-none pointer-events-none">
              <Layers className="h-52 w-52" />
            </div>
            <div className="relative z-10 max-w-lg space-y-4">
              <div>
                <p className="section-label">Drop Pages</p>
                <h2 className="text-xl font-bold mt-0.5">Every collection gets a branded page</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Share your work as a standalone creator drop page — fully branded, shareable on social, and accessible to anyone.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 max-w-sm">
                <Globe className={`h-3.5 w-3.5 shrink-0 ${BRAND.purple.text}`} />
                <span className="font-mono text-xs text-muted-foreground">medialane.io/collections/</span>
                <span className={`font-mono text-xs font-semibold ${BRAND.blue.text} truncate`}>your-collection</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/create/collection"
                  className={cn(
                    "h-9 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]",
                    BRAND.purple.bgSolid
                  )}
                >
                  Create a collection
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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
            <div className="rounded-2xl border border-border/40 p-5 bg-gradient-to-r from-brand-navy/10 to-brand-purple/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

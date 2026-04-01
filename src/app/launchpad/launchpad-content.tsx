"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
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
  Lock, Globe, ExternalLink, Award, CheckCircle2,
} from "lucide-react";

// ── Hero stats pill row ─────────────────────────────────────────────────────
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
          {value === null
            ? <Skeleton className="h-4 w-6 inline-block" />
            : <span className="font-bold">{value}</span>}
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Service data ────────────────────────────────────────────────────────────

type ServiceStatus = "live" | "building" | "soon";
type ColSpan = "normal" | "wide";

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
  buttonColor?: string;
  badge: string;
  status: ServiceStatus;
  colSpan: ColSpan;
}

const SERVICES: ServiceDef[] = [
  // ── Live tools (row 1: [1][1][2]) ──────────────────────────────────────
  {
    title: "Mint IP Asset",
    subtitle: "Register creative work on Starknet",
    description: "Turn any creative file into a programmable IP NFT. Gasless, permanent, and immediately tradeable.",
    features: ["Gasless transaction via ChipiPay", "IPFS metadata anchored on-chain", "Programmable licensing built-in"],
    icon: ImagePlus,
    href: "/create/asset",
    buttonLabel: "Mint asset",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    buttonColor: "bg-brand-blue",
    badge: "~1 min",
    status: "live",
    colSpan: "normal",
  },
  {
    title: "Create Collection",
    subtitle: "Deploy a named ERC-721 catalog",
    description: "Group your IP assets into a branded collection with its own page, metadata, and on-chain identity.",
    features: ["Factory-deployed ERC-721", "Collection page on medialane.io", "Add assets at any time"],
    icon: Layers,
    href: "/create/collection",
    buttonLabel: "Create collection",
    gradient: "from-purple-500/10 to-violet-500/10",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    buttonColor: "bg-brand-purple",
    badge: "~2 min",
    status: "live",
    colSpan: "normal",
  },
  {
    title: "Remix an Asset",
    subtitle: "Derivative works with on-chain attribution",
    description: "Create a licensed derivative of any IP asset with full on-chain provenance and attribution to the original creator.",
    features: ["On-chain attribution chain", "License terms enforced at mint", "Royalties flow to original creator"],
    icon: GitBranch,
    href: "/marketplace",
    buttonLabel: "Browse to remix",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    buttonColor: "bg-brand-rose",
    badge: "~3 min",
    status: "live",
    colSpan: "wide",
  },

  // ── Live services (row 2: [2][2]) ───────────────────────────────────────
  {
    title: "Proof of Participation",
    subtitle: "Soulbound credentials for events & education",
    description: "Issue non-transferable on-chain credentials for bootcamps, workshops, hackathons, and conferences. Each attendee claims one soulbound badge — permanently tied to their wallet.",
    features: [
      "Soulbound · non-transferable ERC-721",
      "One credential per wallet address",
      "Claim window with optional allowlist",
      "Organizer-deployed via POP Factory",
    ],
    icon: Award,
    href: "/launchpad/pop",
    buttonLabel: "View events",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    buttonColor: "bg-green-600",
    badge: "Live",
    status: "live",
    colSpan: "wide",
  },
  {
    title: "Collection Drop",
    subtitle: "Limited edition timed releases with a supply cap",
    description: "Launch a fixed-supply ERC-721 drop with a defined mint window and per-wallet limit. Set your open date, let your community race to collect before supply runs out.",
    features: [
      "Fixed supply cap you control",
      "Timed mint window (open → close)",
      "Per-wallet mint limit",
      "Free or paid mint with any ERC-20",
    ],
    icon: Package,
    href: "/launchpad/drop",
    buttonLabel: "View drops",
    gradient: "from-orange-500/10 to-amber-500/10",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    buttonColor: "bg-orange-600",
    badge: "Live",
    status: "live",
    colSpan: "wide",
  },

  // ── Coming soon (row 3+: [2][1][1], [2][2]) ────────────────────────────
  {
    title: "IP Tickets",
    subtitle: "Gate real-world experiences with NFTs",
    description: "Distribute tickets for concerts, workshops, and events. Each ticket doubles as verifiable on-chain proof of attendance.",
    features: ["Event access gating", "Proof-of-attendance built-in", "Transferable or soulbound"],
    icon: Ticket,
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    badge: "Building now",
    status: "building",
    colSpan: "wide",
  },
  {
    title: "Membership",
    subtitle: "Token-gated access passes for your community",
    description: "Create tiered membership passes that unlock exclusive content, private communities, and creator experiences.",
    features: ["Token-gated content", "Tiered access levels", "Superfan alignment"],
    icon: Users,
    gradient: "from-violet-500/10 to-purple-500/10",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    badge: "Soon",
    status: "soon",
    colSpan: "normal",
  },
  {
    title: "Subscriptions",
    subtitle: "Recurring revenue from your IP on-chain",
    description: "Monthly licensing, creator support tiers, and access passes — all auto-renewed without intermediaries.",
    features: ["Recurring on-chain revenue", "Auto-renewal protocol", "No platform fee middlemen"],
    icon: RefreshCw,
    gradient: "from-sky-500/10 to-blue-500/10",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    badge: "Soon",
    status: "soon",
    colSpan: "normal",
  },
  {
    title: "IP Coins",
    subtitle: "Fractional ownership of intellectual property",
    description: "Tokenize your IP catalog as fungible tokens. Enable fractional ownership and create liquid markets around creative work.",
    features: ["Fungible IP tokens (ERC-20)", "Fractional ownership model", "Liquid secondary markets"],
    icon: Coins,
    gradient: "from-amber-500/10 to-yellow-500/10",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    badge: "Soon",
    status: "soon",
    colSpan: "wide",
  },
  {
    title: "Creator Coins",
    subtitle: "Your personal social token for fans",
    description: "Launch a social token tied to your creative career. Let fans invest directly in your work — full economic alignment between creator and community.",
    features: ["Personal social token", "Fan investment mechanics", "Creator-community alignment"],
    icon: TrendingUp,
    gradient: "from-rose-500/10 to-pink-500/10",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    badge: "Soon",
    status: "soon",
    colSpan: "wide",
  },
];

// ── Service card ────────────────────────────────────────────────────────────
function ServiceCard({ s }: { s: ServiceDef }) {
  const live = s.status === "live";
  const building = s.status === "building";

  return (
    <div
      className={cn(
        "bento-cell flex flex-col relative overflow-hidden",
        s.colSpan === "wide" ? "sm:col-span-2 lg:col-span-2" : "",
        `bg-gradient-to-br ${s.gradient}`,
        !live && "opacity-80"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between p-5 pb-0">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.iconBg)}>
          <s.icon className={cn("h-5 w-5", s.iconColor)} />
        </div>
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 border",
          live
            ? s.badge === "Live"
              ? "text-green-600 bg-green-500/10 border-green-500/20 dark:text-green-400"
              : "text-muted-foreground bg-background/60 border-border/50"
            : building
              ? "text-primary bg-primary/10 border-primary/20"
              : "text-muted-foreground/60 bg-muted/40 border-border/30"
        )}>
          {!live && <Lock className="inline h-2.5 w-2.5 mr-0.5 -mt-px" />}
          {s.badge}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 pt-3 gap-3">
        <div>
          <p className="font-bold text-base leading-snug">{s.title}</p>
          <p className={cn("text-xs mt-0.5", live ? "text-muted-foreground" : "text-muted-foreground/60")}>
            {s.subtitle}
          </p>
          <p className={cn("text-sm mt-2 leading-relaxed", live ? "text-muted-foreground" : "text-muted-foreground/50")}>
            {s.description}
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-1 flex-1">
          {s.features.map((f) => (
            <li key={f} className={cn("flex items-start gap-2 text-xs", live ? "text-muted-foreground" : "text-muted-foreground/40")}>
              {live
                ? <CheckCircle2 className={cn("h-3.5 w-3.5 mt-px shrink-0", s.iconColor)} />
                : <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/20 shrink-0" />}
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {live ? (
          <div className="btn-border-animated p-[1px] rounded-xl mt-1">
            <Link href={s.href!}>
              <button className={cn(
                "w-full h-9 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]",
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
            className="mt-1 w-full h-9 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground/40 bg-muted/40 border border-border/30 cursor-not-allowed"
          >
            <Lock className="h-3.5 w-3.5" />
            Coming soon
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export function LaunchpadContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();

  return (
    <div className="pb-16 space-y-10">

      {/* ── Hero ────────────────────────────────────────────────── */}
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

      {/* ── Services bento grid ─────────────────────────────────── */}
      <section className="px-4 space-y-4">
        <FadeIn>
          <p className="section-label">Platform</p>
          <h2 className="text-xl font-bold mt-0.5">Everything you can build</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            A complete toolkit for creator capital markets — live now and on the roadmap.
          </p>
        </FadeIn>
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <StaggerItem key={s.title}>
              <ServiceCard s={s} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Drop Pages promo ────────────────────────────────────── */}
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

      {/* ── Portfolio shortcut (signed-in only) ─────────────────── */}
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

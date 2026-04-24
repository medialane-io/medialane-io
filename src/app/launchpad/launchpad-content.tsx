"use client";

import Link from "next/link";
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
import { LAUNCHPAD_SERVICE_DEFINITIONS } from "@medialane/ui";
import type { ServiceDefinition } from "@medialane/ui";
import {
  Zap, Package, Tag, ShoppingCart,
  Layers, Globe, ExternalLink, ArrowRight, Lock,
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

// ── Brand color map per service key ─────────────────────────────────────────
const SERVICE_COLORS: Record<string, { icon: string; button: string; chip: string; gradient: string }> = {
  "mint-ip-asset":      { icon: BRAND.blue.text,   button: "bg-brand-blue",   chip: "border-blue-500/30 text-blue-400 bg-blue-500/10",     gradient: "from-blue-500/50 via-cyan-400/20 to-blue-600/30"      },
  "create-collection":  { icon: BRAND.purple.text, button: "bg-brand-purple", chip: "border-purple-500/30 text-purple-400 bg-purple-500/10", gradient: "from-purple-500/50 via-violet-400/20 to-purple-700/30" },
  "ip-collection-1155": { icon: BRAND.rose.text,   button: "bg-brand-rose",   chip: "border-rose-500/30 text-rose-400 bg-rose-500/10",       gradient: "from-rose-500/50 via-pink-400/20 to-rose-700/30"      },
  "mint-editions":      { icon: BRAND.orange.text, button: "bg-brand-orange", chip: "border-orange-500/30 text-orange-400 bg-orange-500/10", gradient: "from-orange-500/50 via-amber-400/20 to-orange-700/30"  },
  "remix-asset":        { icon: BRAND.navy.text,   button: "bg-brand-navy",   chip: "border-indigo-700/30 text-indigo-300 bg-indigo-900/20", gradient: "from-blue-900/60 via-indigo-700/20 to-blue-800/30"     },
  "pop-protocol":       { icon: BRAND.orange.text, button: "bg-brand-orange", chip: "border-orange-500/30 text-orange-400 bg-orange-500/10", gradient: "from-orange-500/50 via-amber-400/20 to-orange-700/30"  },
  "collection-drop":    { icon: BRAND.rose.text,   button: "bg-brand-rose",   chip: "border-rose-500/30 text-rose-400 bg-rose-500/10",       gradient: "from-rose-500/50 via-red-400/20 to-rose-700/30"       },
  "ip-tickets":         { icon: BRAND.blue.text,   button: "bg-brand-blue",   chip: "border-blue-500/30 text-blue-400 bg-blue-500/10",     gradient: "from-blue-500/50 via-cyan-400/20 to-blue-600/30"      },
  "membership":         { icon: BRAND.purple.text, button: "bg-brand-purple", chip: "border-purple-500/30 text-purple-400 bg-purple-500/10", gradient: "from-purple-500/50 via-violet-400/20 to-purple-700/30" },
  "subscriptions":      { icon: BRAND.blue.text,   button: "bg-brand-blue",   chip: "border-blue-500/30 text-blue-400 bg-blue-500/10",     gradient: "from-blue-500/50 via-cyan-400/20 to-blue-600/30"      },
  "ip-coins":           { icon: BRAND.orange.text, button: "bg-brand-orange", chip: "border-orange-500/30 text-orange-400 bg-orange-500/10", gradient: "from-orange-500/50 via-amber-400/20 to-orange-700/30"  },
  "creator-coins":      { icon: BRAND.rose.text,   button: "bg-brand-rose",   chip: "border-rose-500/30 text-rose-400 bg-rose-500/10",       gradient: "from-rose-500/50 via-pink-400/20 to-rose-700/30"      },
};

// ── Local content overrides (title, subtitle, description, features, example)
interface ServiceContent {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  example: string;
}
const SERVICE_CONTENT: Record<string, ServiceContent> = {
  "mint-ip-asset": {
    title: "Mint NFT",
    subtitle: "Publish your creative work on Starknet",
    description: "Upload any photo, video, audio, or document and mint it as an IP NFT — with licensing, provenance, and ownership all locked on-chain.",
    features: ["Gasless via ChipiPay", "IPFS metadata", "Programmable licensing"],
    example: "e.g. A song, a photo, an ebook, a short film",
  },
  "create-collection": {
    title: "Create NFT Collection",
    subtitle: "Group your NFTs under a shared identity",
    description: "Deploy a branded ERC-721 collection with its own page and on-chain identity. Add assets to it at any time and share it with collectors.",
    features: ["Factory-deployed ERC-721", "Branded collection page", "Add assets at any time"],
    example: "e.g. A photography portfolio, a music catalog, a comic series",
  },
  "ip-collection-1155": {
    title: "Limited Editions",
    subtitle: "Deploy a contract for multi-copy NFT releases",
    description: "Create a collection built for editions — release music tracks, art prints, or any IP in numbered multiples. Each edition token is tradeable on Medialane.",
    features: ["Multi-edition ERC-1155", "Numbered tokens", "Tradeable on Medialane"],
    example: "e.g. 50 copies of a limited print, a music EP released in 100 editions",
  },
  "mint-editions": {
    title: "Mint Limited Edition",
    subtitle: "Add new editions to an existing collection",
    description: "Pick one of your Limited Edition contracts, upload artwork, set the supply, and release to collectors — all in a few clicks.",
    features: ["Choose any edition collection", "Set edition supply", "IPFS metadata"],
    example: "e.g. Drop 25 numbered prints from your art series",
  },
  "remix-asset": {
    title: "Remix Asset",
    subtitle: "Derivative works with on-chain attribution",
    description: "Create a licensed derivative of any IP asset with full provenance and attribution flowing back to the original creator on-chain.",
    features: ["On-chain attribution", "License-enforced at mint", "Royalties to original creator"],
    example: "e.g. A remix of a song, a derivative artwork inspired by an original",
  },
  "pop-protocol": {
    title: "POP Protocol",
    subtitle: "Proof-of-participation for events & communities",
    description: "Issue soulbound credentials to your community — one non-transferable badge per wallet, permanently on-chain. No transferring, no faking.",
    features: ["Soulbound · non-transferable", "One credential per wallet", "Optional allowlist gating"],
    example: "e.g. Hackathon attendance badge, community membership, conference pass",
  },
  "collection-drop": {
    title: "Collection Drop",
    subtitle: "Timed NFT releases with mint windows",
    description: "Launch a time-gated mint campaign — set a price, supply cap, start and end time, and let collectors mint directly from your drop page.",
    features: ["Timed mint window", "Price + supply cap", "Branded drop page"],
    example: "e.g. A 48-hour drop of 200 NFTs at 5 USDC each",
  },
};

// ── App-specific hrefs per service key ──────────────────────────────────────
const IO_HREFS: Record<string, { href?: string; buttonLabel?: string; browseHref?: string }> = {
  "mint-ip-asset":      { href: "/create/asset",            buttonLabel: "Mint NFT"               },
  "create-collection":  { href: "/create/collection",       buttonLabel: "Create NFT Collection"   },
  "remix-asset":        { href: "/marketplace",             buttonLabel: "Browse to remix"         },
  "pop-protocol":       { href: "/launchpad/pop/create",    buttonLabel: "Create event",     browseHref: "/launchpad/pop"  },
  "collection-drop":    { href: "/launchpad/drop/create",   buttonLabel: "Launch drop",      browseHref: "/launchpad/drop" },
  "ip-collection-1155": { href: "/launchpad/nfteditions/create", buttonLabel: "Create Limited Edition contract" },
  "mint-editions":      { href: "/launchpad/nfteditions",        buttonLabel: "Mint Limited Edition"           },
};

// ── Service card ─────────────────────────────────────────────────────────────
function ServiceCard({
  def,
  href,
  buttonLabel,
  browseHref,
}: {
  def: ServiceDefinition;
  href?: string;
  buttonLabel?: string;
  browseHref?: string;
}) {
  const { key, icon: Icon, badge, status, browseLinkLabel } = def;
  const content = SERVICE_CONTENT[key] ?? {
    title: def.title,
    subtitle: def.subtitle,
    description: def.description,
    features: def.features,
    example: "",
  };
  const { title, subtitle, description, features, example } = content;
  const live = status === "live";
  const building = status === "building";
  const active = live || building;
  const colors = SERVICE_COLORS[key] ?? { icon: BRAND.blue.text, button: "bg-brand-blue", chip: "border-border/50 text-muted-foreground bg-muted/30", gradient: "from-border/40 to-border/20" };

  const card = (
    <div
      className={cn(
        "rounded-[15px] bg-card flex flex-col overflow-hidden min-h-[420px]",
        "transition-all duration-200 flex-1",
        !active && "opacity-60",
      )}
    >
      <div className="flex flex-col flex-1 p-6 gap-5">

        {/* Icon + status badge */}
        <div className="flex items-start justify-between">
          <Icon
            className={cn(
              "h-9 w-9 transition-transform duration-300",
              active ? colors.icon : "text-muted-foreground/25",
            )}
          />
          <span
            className={cn(
              "text-[10px] font-semibold tracking-widest uppercase rounded-full px-2.5 py-1 flex items-center gap-1.5",
              live
                ? "text-emerald-500 bg-emerald-500/10"
                : building
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-muted-foreground/40 bg-muted/30",
            )}
          >
            {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {!active && <Lock className="h-2.5 w-2.5" />}
            {badge}
          </span>
        </div>

        {/* Title + subtitle */}
        <div className="space-y-1.5">
          <p className={cn("text-xl font-bold leading-snug tracking-tight", !active && "text-foreground/40")}>
            {title}
          </p>
          <p className={cn("text-xs leading-relaxed", active ? "text-muted-foreground" : "text-muted-foreground/30")}>
            {subtitle}
          </p>
        </div>

        {/* Description */}
        <div className="flex-1 space-y-2">
          <p className={cn("text-sm leading-relaxed", active ? "text-muted-foreground" : "text-muted-foreground/30")}>
            {description}
          </p>
          {example && active && (
            <p className="text-xs text-muted-foreground/60 italic">{example}</p>
          )}
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium",
                active
                  ? colors.chip
                  : "bg-muted/10 border-border/15 text-muted-foreground/25",
              )}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        {live && href ? (
          <div className="space-y-2">
            <Link
              href={href}
              className={cn(
                "flex items-center justify-between w-full h-10 px-4 rounded-xl",
                "text-sm font-semibold text-white",
                "transition-all hover:brightness-110 active:scale-[0.98]",
                colors.button,
              )}
            >
              {buttonLabel ?? "Get started"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {browseHref && browseLinkLabel && (
              <Link
                href={browseHref}
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {browseLinkLabel}
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

  return live ? (
    <div className={cn("p-[1px] rounded-2xl bg-gradient-to-br", colors.gradient, "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25 flex flex-col")}>
      {card}
    </div>
  ) : (
    <div className="rounded-2xl border border-border/25 flex flex-col">
      {card}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export function LaunchpadContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();

  return (
    <div className="pb-16 space-y-10">

      {/* ── Hero ─────────────────────────────────────────────── */}
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

      {/* ── Services grid ─────────────────────────────────────── */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {LAUNCHPAD_SERVICE_DEFINITIONS.map((def) => {
            const { href, buttonLabel, browseHref } = IO_HREFS[def.key] ?? {};
            return (
              <ServiceCard
                key={def.key}
                def={def}
                href={href}
                buttonLabel={buttonLabel}
                browseHref={browseHref}
              />
            );
          })}
        </motion.div>
      </section>

      {/* ── Drop Pages promo ──────────────────────────────────── */}
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
                    BRAND.purple.bgSolid,
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

      {/* ── Portfolio shortcut ────────────────────────────────── */}
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

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

// ── Portrait gradients per service key ──────────────────────────────────────
const SERVICE_GRADIENTS: Record<string, string> = {
  "mint-ip-asset":      "from-blue-500 to-cyan-500",
  "create-collection":  "from-violet-500 to-purple-600",
  "ip-collection-1155": "from-violet-600 to-fuchsia-600",
  "mint-editions":      "from-fuchsia-500 to-violet-600",
  "remix-asset":        "from-rose-500 to-pink-600",
  "pop-protocol":       "from-emerald-400 to-teal-500",
  "collection-drop":    "from-orange-400 to-rose-500",
  "ip-tickets":         "from-teal-500 to-cyan-600",
  "membership":         "from-indigo-500 to-violet-600",
  "subscriptions":      "from-sky-500 to-blue-600",
  "ip-coins":           "from-amber-500 to-yellow-500",
  "creator-coins":      "from-pink-500 to-rose-600",
};

interface ServiceHref {
  href?: string;
  buttonLabel?: string;
  browseHref?: string;
}

const IO_HREFS: Record<string, ServiceHref> = {
  "mint-ip-asset":      { href: "/create/asset",            buttonLabel: "Mint asset"        },
  "create-collection":  { href: "/create/collection",       buttonLabel: "Create collection" },
  "remix-asset":        { href: "/marketplace",             buttonLabel: "Browse to remix"   },
  "pop-protocol":       { href: "/launchpad/pop/create",    buttonLabel: "Create event",     browseHref: "/launchpad/pop"  },
  "collection-drop":    { href: "/launchpad/drop/create",   buttonLabel: "Launch drop",      browseHref: "/launchpad/drop" },
  "ip-collection-1155": { href: "/launchpad/ip1155/create", buttonLabel: "Create collection" },
  "mint-editions":      { href: "/launchpad/ip1155",        buttonLabel: "Mint editions"     },
};

// ── Portrait service card ────────────────────────────────────────────────────
function PortraitServiceCard({ def, href, buttonLabel }: { def: ServiceDefinition; href?: string; buttonLabel?: string }) {
  const { key, title, subtitle, icon: Icon, status, badge } = def;
  const gradient = SERVICE_GRADIENTS[key] ?? "from-slate-500 to-slate-600";
  const live = status === "live";
  const building = status === "building";

  const inner = (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden aspect-[3/4] bg-gradient-to-br transition-all duration-300",
        gradient,
        live && "group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/20",
        building && "opacity-65",
        status === "soon" && "opacity-50",
      )}
    >
      {/* Radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_25%,rgba(255,255,255,0.14),transparent_60%)]" />

      {/* Large ghost icon */}
      <div className="absolute -bottom-6 -right-6 opacity-[0.12] pointer-events-none">
        <Icon className="h-36 w-36 text-white" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Top row: icon widget + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shrink-0 transition-colors duration-300 group-hover:bg-white/[0.18]">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span
            className={cn(
              "text-[9px] font-bold tracking-widest uppercase rounded-full px-2 py-1 flex items-center gap-1 mt-0.5",
              live    ? "bg-emerald-500/25 text-emerald-200" :
              building ? "bg-amber-500/25 text-amber-200"   :
                         "bg-white/10 text-white/40"
            )}
          >
            {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
            {!live && !building && <Lock className="h-2.5 w-2.5 shrink-0" />}
            {badge}
          </span>
        </div>

        {/* Bottom: title + subtitle + cta hint */}
        <div className="space-y-1">
          <p className="text-base font-black text-white leading-tight tracking-tight">{title}</p>
          <p className="text-xs text-white/65 leading-relaxed">{subtitle}</p>
          {live && (
            <div className="flex items-center gap-1 text-white/80 text-xs font-semibold pt-1">
              {buttonLabel ?? "Get started"} <ArrowRight className="h-3 w-3" />
            </div>
          )}
          {building && (
            <p className="text-[11px] text-white/40 font-medium pt-1">In development</p>
          )}
          {status === "soon" && (
            <p className="text-[11px] text-white/40 font-medium pt-1">Coming soon</p>
          )}
        </div>
      </div>
    </div>
  );

  if (live && href) {
    return (
      <Link href={href} className="group block">
        {inner}
      </Link>
    );
  }
  return <div className="group">{inner}</div>;
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {LAUNCHPAD_SERVICE_DEFINITIONS.map((def) => {
            const { href, buttonLabel } = IO_HREFS[def.key] ?? {};
            return (
              <PortraitServiceCard
                key={def.key}
                def={def}
                href={href}
                buttonLabel={buttonLabel}
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

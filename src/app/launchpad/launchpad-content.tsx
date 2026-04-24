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
const SERVICE_COLORS: Record<string, { icon: string; button: string }> = {
  "mint-ip-asset":      { icon: BRAND.blue.text,   button: "bg-brand-blue"   },
  "create-collection":  { icon: BRAND.purple.text, button: "bg-brand-purple" },
  "ip-collection-1155": { icon: BRAND.purple.text, button: "bg-brand-purple" },
  "mint-editions":      { icon: BRAND.purple.text, button: "bg-brand-purple" },
  "remix-asset":        { icon: BRAND.rose.text,   button: "bg-brand-rose"   },
  "pop-protocol":       { icon: BRAND.orange.text, button: "bg-brand-orange" },
  "collection-drop":    { icon: BRAND.orange.text, button: "bg-brand-orange" },
  "ip-tickets":         { icon: BRAND.blue.text,   button: "bg-brand-blue"   },
  "membership":         { icon: BRAND.purple.text, button: "bg-brand-purple" },
  "subscriptions":      { icon: BRAND.blue.text,   button: "bg-brand-blue"   },
  "ip-coins":           { icon: BRAND.orange.text, button: "bg-brand-orange" },
  "creator-coins":      { icon: BRAND.rose.text,   button: "bg-brand-rose"   },
};

// ── App-specific hrefs per service key ──────────────────────────────────────
const IO_HREFS: Record<string, { href?: string; buttonLabel?: string; browseHref?: string }> = {
  "mint-ip-asset":      { href: "/create/asset",            buttonLabel: "Mint asset"        },
  "create-collection":  { href: "/create/collection",       buttonLabel: "Create collection" },
  "remix-asset":        { href: "/marketplace",             buttonLabel: "Browse to remix"   },
  "pop-protocol":       { href: "/launchpad/pop/create",    buttonLabel: "Create event",     browseHref: "/launchpad/pop"  },
  "collection-drop":    { href: "/launchpad/drop/create",   buttonLabel: "Launch drop",      browseHref: "/launchpad/drop" },
  "ip-collection-1155": { href: "/launchpad/nfteditions/create", buttonLabel: "Create collection" },
  "mint-editions":      { href: "/launchpad/nfteditions",        buttonLabel: "Mint editions"     },
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
  const { key, title, subtitle, description, features, icon: Icon, badge, status, browseLinkLabel } = def;
  const live = status === "live";
  const building = status === "building";
  const active = live || building;
  const colors = SERVICE_COLORS[key] ?? { icon: BRAND.blue.text, button: "bg-brand-blue" };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card flex flex-col overflow-hidden",
        "transition-all duration-200",
        live && "hover:-translate-y-0.5 hover:border-border/70 hover:shadow-md hover:shadow-black/20",
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
              live && "group-hover:scale-110",
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
        <p className={cn("text-sm leading-relaxed flex-1", active ? "text-muted-foreground" : "text-muted-foreground/30")}>
          {description}
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium",
                active
                  ? "bg-muted/30 border-border/50 text-muted-foreground"
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

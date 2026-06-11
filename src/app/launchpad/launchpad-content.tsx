"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { LaunchpadGroupedSections, type ServiceOverrides } from "@medialane/ui";
import {
  Zap, Package, Tag, ShoppingCart,
  Layers, Globe, ExternalLink, ArrowRight,
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

// ── io-specific service overrides (hrefs, rollout flips, gasless-rail copy) ──
const IO_OVERRIDES: ServiceOverrides = {
  "mint-ip-asset":      { href: "/create/asset" },
  "create-collection":  { href: "/create/collection" },
  "remix-asset":        { href: "/marketplace" },
  "pop-protocol":       { href: "/launchpad/pop/create",  browseHref: "/launchpad/pop"  },
  "collection-drop":    { href: "/launchpad/drop/create", browseHref: "/launchpad/drop" },
  "ip-collection-1155": { href: "/launchpad/nfteditions/create" },
  "mint-editions":      { href: "/launchpad/nfteditions" },
  // Coins are live on io ahead of the shared default (per-app rollout; ui flips it next bump)
  "creator-coins":      { href: "/launchpad/coin/create", status: "live" },
  "claim-memecoin":     { href: "/launchpad/memecoin",    status: "live" },
  "claim-username":         { href: "/claim" },
  "claim-collection":       { href: "/claim" },
  "claim-collection-name":  { href: "/claim" },
};

// ── Page ────────────────────────────────────────────────────────────────────
export function LaunchpadContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();

  return (
    <div className="pb-20 space-y-12 sm:space-y-20">

      {/* ── Floating Starknet dapp widget — top right, glass pill ─ */}
      <a
        href="https://dapp.medialane.io/launchpad"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-3 right-4 sm:right-6 lg:right-8 z-40 flex items-center gap-2 h-10 pl-3.5 pr-4 rounded-full border border-border/50 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/10 text-sm hover:bg-background/90 active:scale-[0.98] transition-all"
      >
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline text-muted-foreground">Web3 version</span>
        <span className="font-semibold">Starknet dapp</span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </a>

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
              Publish your work, grow your community, and earn from what you create —
              it&apos;s always yours.
            </p>
          </FadeIn>
          {isSignedIn && walletAddress && (
            <FadeIn delay={0.24}>
              <HeroStats address={walletAddress} />
            </FadeIn>
          )}
        </div>
      </section>

      {/* ── Grouped services (shared @medialane/ui component) ─── */}
      <section className="px-4">
        <LaunchpadGroupedSections overrides={IO_OVERRIDES} />
      </section>

      {/* ── Web3 dapp callout ─────────────────────────────────── */}
      <section className="px-4">
        <FadeIn>
          <div className="rounded-2xl border border-border/40 p-5 bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="section-label">Web3 version</p>
              <p className="font-bold text-base mt-0.5">Prefer connecting your own wallet?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Every launchpad service is also available on the full web3 dapp, with Ready, Braavos, and other Starknet wallets.
              </p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <a href="https://dapp.medialane.io/launchpad" target="_blank" rel="noopener noreferrer">
                Open the dapp <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        </FadeIn>
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

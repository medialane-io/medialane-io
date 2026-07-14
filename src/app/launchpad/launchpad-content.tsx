"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { getService } from "@medialane/sdk";
import { LaunchpadGroupedSections, LaunchpadFilterBar, useLaunchpadFilter, type ServiceOverrides } from "@medialane/ui";
import {
  Package, Tag, ShoppingCart,
  ExternalLink, ArrowRight,
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
  "nfts":             { href: "/launchpad/nfts" },
  "limited-editions": { href: "/launchpad/nfteditions" },
  "remix-asset":      { href: "/launchpad/remix" },
  "pop-protocol":     { href: "/launchpad/pop" },
  "collection-drop":  { href: "/launchpad/drop" },
  "creator-coins":    { href: "/launchpad/coin/create" },
  "claim-memecoin":   { href: "/launchpad/memecoin" },
  "claim-username":        { href: "/claim/username" },
  "claim-collection":      { href: "/claim/collection" },
  "claim-collection-name": { href: "/claim/collection-name" },
  // IP Tickets is live on the Starknet app; the io flow targeted a contract
  // generation that no longer exists on-chain and was removed — the card stays
  // not-live here until the io lens gets its own tickets pass.
  "ip-tickets":     { status: "building" },
  "ip-club":        { href: "/launchpad/club" },
  "ip-sponsorship": { href: "/launchpad/sponsorship" },
};

// ── Page ────────────────────────────────────────────────────────────────────
export function LaunchpadContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const filter = useLaunchpadFilter();
  const { collections } = useCollectionsByOwner(walletAddress ?? null);

  // Live per-user facts on the cards — real counts, shown only when nonzero.
  const overrides = useMemo<ServiceOverrides>(() => {
    const nftCount = collections.filter((c) => getService(c.service)?.id === "mip-erc721").length;
    const editionsCount = collections.filter((c) => c.standard === "ERC1155").length;
    const withMeta = (key: string, count: number): ServiceOverrides =>
      count > 0 ? { [key]: { ...IO_OVERRIDES[key], meta: `${count} collection${count === 1 ? "" : "s"}` } } : {};
    return { ...IO_OVERRIDES, ...withMeta("nfts", nftCount), ...withMeta("limited-editions", editionsCount) };
  }, [collections]);

  return (
    <div className="relative pb-20 space-y-8 sm:space-y-10">

      {/* ── Starknet dapp widget — top right, scrolls with the page ─ */}
      <a
        href="https://starknet.medialane.io/launchpad"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-4 sm:right-6 lg:right-8 z-20 flex items-center gap-2 h-10 pl-3.5 pr-4 rounded-full border border-border/50 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/10 text-sm hover:bg-background/90 active:scale-[0.98] transition-all"
      >
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline text-muted-foreground">Web3 version</span>
        <span className="font-semibold">Starknet dapp</span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </a>

      {/* ── Header ───────────────────────────────────────────── */}
      <section className="px-4 pt-16 sm:pt-20 space-y-5">
        <FadeIn>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">Launchpad</h1>
            <p className="text-muted-foreground mt-1.5">Create, mint, and launch your work.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <LaunchpadFilterBar
            query={filter.query}
            onQueryChange={filter.setQuery}
            groups={filter.filterableGroups}
            activeGroups={filter.activeGroups}
            onToggleGroup={filter.toggleGroup}
            resultCount={filter.totalMatches}
          />
        </FadeIn>
        {isSignedIn && walletAddress && (
          <FadeIn delay={0.16}>
            <HeroStats address={walletAddress} />
          </FadeIn>
        )}
      </section>

      {/* ── Grouped services (shared @medialane/ui component) ─── */}
      <section className="px-4">
        <LaunchpadGroupedSections
          overrides={overrides}
          query={filter.query}
          activeGroups={filter.activeGroups}
          onClearFilters={filter.clear}
        />
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
              <a href="https://starknet.medialane.io/launchpad" target="_blank" rel="noopener noreferrer">
                Open the dapp <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
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

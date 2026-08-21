"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { Button } from "@/components/ui/button";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { FadeIn } from "@/components/ui/motion-primitives";
import { getService } from "@medialane/sdk";
import {
  LaunchpadGroupedSections,
  LaunchpadFilterBar,
  useLaunchpadFilter,
  type ServiceOverrides,
} from "@medialane/ui";
import { PublishFlow } from "@/components/launchpad/publish-flow";
import { ExternalLink, ArrowRight } from "lucide-react";

const IO_OVERRIDES: ServiceOverrides = {
  "nfts":             { href: "/launchpad/single-editions" },
  "limited-editions": { href: "/launchpad/nfteditions" },
  "remix-asset":      { href: "/launchpad/remix" },
  "pop-protocol":     { href: "/launchpad/pop" },
  "collection-drop":  { href: "/launchpad/drop" },
  "creator-coins":    { href: "/launchpad/coin/create" },
  "claim-memecoin":   { href: "/launchpad/memecoin" },
  "claim-username":        { href: "/claim/username" },
  "claim-collection":      { href: "/claim/collection" },
  "claim-collection-name": { href: "/claim/collection-name" },
  "ip-tickets":     { href: "/launchpad/tickets" },
  "ip-club":        { href: "/launchpad/club" },
  "ip-sponsorship": { href: "/launchpad/sponsorship" },
};

export function LaunchpadContent() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const filter = useLaunchpadFilter();
  const { collections } = useCollectionsByOwner(walletAddress ?? null);

  const overrides = useMemo<ServiceOverrides>(() => {
    const nftCount = collections.filter((c) => getService(c.service)?.id === "mip-erc721").length;
    const editionsCount = collections.filter((c) => c.standard === "ERC1155").length;
    const withMeta = (key: string, count: number): ServiceOverrides =>
      count > 0 ? { [key]: { ...IO_OVERRIDES[key], meta: `${count} collection${count === 1 ? "" : "s"}` } } : {};
    return { ...IO_OVERRIDES, ...withMeta("nfts", nftCount), ...withMeta("limited-editions", editionsCount) };
  }, [collections]);

  return (
    <div className="relative pb-20 space-y-16 sm:space-y-24">

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 space-y-6">
        <FadeIn>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">Creator Launchpad</h1>
        </FadeIn>
        <FadeIn delay={0.06}>
          <PublishFlow />
        </FadeIn>
      </section>

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">Launchpad Services</h2>
        </FadeIn>
        <FadeIn delay={0.06}>
          <LaunchpadFilterBar
            query={filter.query}
            onQueryChange={filter.setQuery}
            groups={filter.filterableGroups}
            activeGroups={filter.activeGroups}
            onToggleGroup={filter.toggleGroup}
          />
        </FadeIn>
        <LaunchpadGroupedSections
          overrides={overrides}
          query={filter.query}
          activeGroups={filter.activeGroups}
          onClearFilters={filter.clear}
        />
      </section>

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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

      {hasWallet && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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

"use client";

import { useMemo } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { FadeIn } from "@/components/ui/motion-primitives";
import { getService } from "@medialane/sdk";
import {
  LaunchpadGroupedSections,
  LaunchpadFilterBar,
  LAUNCHPAD_ROUTE_OVERRIDES,
  useLaunchpadFilter,
  type ServiceOverrides,
} from "@medialane/ui";
import { FastMint } from "@/components/launchpad/fast-mint";

export function LaunchpadContent() {
  const { address: walletAddress } = useWalletNativeSession();
  const filter = useLaunchpadFilter();
  const { collections } = useCollectionsByOwner(walletAddress ?? null);

  const overrides = useMemo<ServiceOverrides>(() => {
    const nftCount = collections.filter((c) => getService(c.service)?.id === "mip-erc721").length;
    const editionsCount = collections.filter((c) => c.standard === "ERC1155").length;
    const withMeta = (key: string, count: number): ServiceOverrides =>
      count > 0 ? { [key]: { ...LAUNCHPAD_ROUTE_OVERRIDES[key], meta: `${count} collection${count === 1 ? "" : "s"}` } } : {};
    return { ...LAUNCHPAD_ROUTE_OVERRIDES, ...withMeta("nfts", nftCount), ...withMeta("limited-editions", editionsCount) };
  }, [collections]);

  return (
    <div className="relative pb-20 space-y-16 sm:space-y-24">

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 space-y-6">
        <FadeIn>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">Creator Launchpad</h1>
        </FadeIn>
        <FadeIn delay={0.06}>
          <FastMint />
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

    </div>
  );
}

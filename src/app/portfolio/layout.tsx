"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { AddressDisplay } from "@/components/shared/address-display";
import { Briefcase, Wallet } from "lucide-react";
import { useUserOrders } from "@/hooks/use-orders";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { markOffersAsSeen } from "@/hooks/use-unread-offers";
import { useRemixOffers } from "@/hooks/use-remix-offers";
import { useSessionKey } from "@/hooks/use-session-key";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { HelpIcon } from "@/components/ui/help-icon";
import {
  PortfolioSubnav,
  derivePortfolioCounts,
  type PortfolioNavGroup,
} from "@medialane/ui";

const NAV_GROUPS: PortfolioNavGroup[] = [
  {
    label: "My Items",
    items: [
      { label: "Assets",            href: "/portfolio/assets" },
      { label: "Collections",       href: "/portfolio/collections" },
    ],
  },
  {
    label: "Trading",
    items: [
      { label: "Listings",          href: "/portfolio/listings" },
      { label: "Offers received",   href: "/portfolio/received", badge: { key: "offers", variant: "destructive" } },
      { label: "Offers sent",       href: "/portfolio/offers" },
      { label: "Counter-offers",    href: "/portfolio/counter-offers", badge: { key: "counters", variant: "warning" } },
      { label: "Remixes",           href: "/portfolio/remix-offers", badge: { key: "remixes", variant: "primary" } },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Activity",          href: "/portfolio/activity" },
      { label: "Wallet",            href: "/portfolio/wallet" },
      { label: "Settings",          href: "/portfolio/settings" },
    ],
  },
];

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { walletAddress, isLoadingWallet, refetchWallet } = useSessionKey();
  const pathname = usePathname();
  const address = walletAddress;
  const { orders } = useUserOrders(address ?? null);
  const { meta: tokenMeta } = useTokensByOwner(address ?? null, 1);
  const { offers: remixOffers } = useRemixOffers("creator");

  const counts = derivePortfolioCounts(orders, remixOffers, address);

  const totalAssetsCount = tokenMeta?.total ?? null;

  useEffect(() => {
    const receivedOffers = orders.filter(
      (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20"
    );
    if (receivedOffers.length > 0) {
      markOffersAsSeen(receivedOffers.map((o) => o.orderHash));
    }
  }, [orders]);

  if (!isLoaded || (isLoadingWallet && !walletAddress)) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your Portfolio</h1>
        <p className="text-muted-foreground">Sign in to view your assets, listings, and offers.</p>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  if (!address) {
    const walletCreated = user?.publicMetadata?.walletCreated === true;

    if (walletCreated) {
      return (
        <div className="px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Connecting to your wallet…</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your wallet exists but couldn&apos;t be loaded right now. Please retry.
          </p>
          <Button onClick={() => refetchWallet()}>Retry</Button>
        </div>
      );
    }

    return (
      <div className="px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Secure your account</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Protect your account to unlock your portfolio and start trading.
        </p>
        <Button asChild>
          <Link href="/onboarding?redirect_url=/portfolio/assets">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Briefcase className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Portfolio</span>
        </div>
        <AddressDisplay address={address} chars={6} className="text-sm font-mono" />
        {/* Stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {totalAssetsCount !== null ? (
            <span className="bg-muted rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
              {totalAssetsCount} Assets
            </span>
          ) : (
            <span className="bg-muted rounded-full px-3 py-1 w-20 h-6 animate-pulse inline-block" />
          )}
          <span className="flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
            {counts.listings} Listings
            <HelpIcon content="Your active marketplace listings — assets currently for sale" side="bottom" />
          </span>
          {counts.received > 0 && (
            <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              {counts.received} Offers received
              <HelpIcon content="Buyers have made offers on your assets — go to Offers received to accept, counter, or decline" side="bottom" />
            </span>
          )}
        </div>
      </div>

      {/* Subnav */}
      <PortfolioSubnav
        groups={NAV_GROUPS}
        pathname={pathname}
        badgeCounts={{
          offers: counts.received,
          remixes: counts.remix,
          counters: counts.counter,
        }}
      />

      {/* Page content */}
      {children}
    </div>
  );
}

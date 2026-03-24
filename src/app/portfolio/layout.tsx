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
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "My Activity",
    items: [
      { label: "Assets",            href: "/portfolio/assets" },
      { label: "Listings",          href: "/portfolio/listings" },
      { label: "Offers sent",       href: "/portfolio/offers" },
      { label: "Offers received",   href: "/portfolio/received", badge: "offers" as const },
      { label: "Remixes",           href: "/portfolio/remix-offers", badge: "remixes" as const },
      { label: "Counter-offers",    href: "/portfolio/counter-offers", badge: "counters" as const },
      { label: "Activity",          href: "/portfolio/activity" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Wallet",            href: "/portfolio/wallet" },
      { label: "Collections",       href: "/portfolio/collections" },
      { label: "Claim Collection",  href: "/portfolio/claim" },
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

  const receivedCount = orders.filter(
    (o) =>
      o.status === "ACTIVE" &&
      o.offer.itemType === "ERC20" &&
      o.offerer.toLowerCase() !== (address ?? "").toLowerCase()
  ).length;

  const activeListingsCount = orders.filter(
    (o) => o.offer.itemType === "ERC721" && o.status === "ACTIVE"
  ).length;

  const pendingRemixCount = remixOffers.filter(
    (o) => o.status === "PENDING" || o.status === "AUTO_PENDING"
  ).length;

  // Bids the user made that a seller has countered — buyer needs to respond
  const pendingCounterCount = orders.filter(
    (o) =>
      o.offer.itemType === "ERC20" &&
      o.offerer.toLowerCase() === (address ?? "").toLowerCase() &&
      (o.status as string) === "COUNTER_OFFERED"
  ).length;

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
      <div className="px-4 sm:px-6 lg:px-8 pt-14 pb-8 space-y-6">
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
        <h1 className="text-2xl font-bold">Wallet not found</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          You need a Starknet wallet to use your portfolio. Set one up to get started.
        </p>
        <Button asChild>
          <Link href="/onboarding?redirect_url=/portfolio/assets">Set up wallet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-14 pb-8 space-y-6">
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
          <span className="bg-muted rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
            {activeListingsCount} Listings
          </span>
          {receivedCount > 0 && (
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              {receivedCount} Offers received
            </span>
          )}
        </div>
      </div>

      {/* Subnav */}
      <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-border/60">
        <div className="flex items-center min-w-max gap-0">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label} className="flex items-center">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap transition-colors shrink-0 border-b-2 min-h-10",
                      active
                        ? "border-primary text-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {item.badge === "offers" && receivedCount > 0 && (
                      <span className="h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                        {receivedCount}
                      </span>
                    )}
                    {item.badge === "remixes" && pendingRemixCount > 0 && (
                      <span className="h-4 min-w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1">
                        {pendingRemixCount}
                      </span>
                    )}
                    {item.badge === "counters" && pendingCounterCount > 0 && (
                      <span className="h-4 min-w-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center px-1">
                        {pendingCounterCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              {groupIndex < NAV_GROUPS.length - 1 && (
                <span className="w-px h-4 bg-border/40 mx-1 self-center shrink-0" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Briefcase, Wallet } from "lucide-react";
import { useUserOrders } from "@/hooks/use-orders";
import { markOffersAsSeen } from "@/hooks/use-unread-offers";
import { useRemixOffers } from "@/hooks/use-remix-offers";
import { useSessionKey } from "@/hooks/use-session-key";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRewards } from "@/hooks/use-rewards";
import { useMySponsorshipDealCounts } from "@/hooks/use-sponsorship";
import {
  PortfolioHeader,
  PortfolioNav,
  derivePortfolioCounts,
  type PortfolioNavSection,
} from "@medialane/ui";

const NAV_SECTIONS: PortfolioNavSection[] = [
  { label: "Overview", href: "/portfolio" },
  {
    label: "Items",
    href: "/portfolio/assets",
    children: [
      { label: "Assets",      href: "/portfolio/assets" },
      { label: "Collections", href: "/portfolio/collections" },
    ],
  },
  {
    label: "Trading",
    href: "/portfolio/listings",
    children: [
      { label: "Listings",        href: "/portfolio/listings" },
      { label: "Offers received", href: "/portfolio/received", badge: { key: "offers", variant: "destructive" } },
      { label: "Offers sent",     href: "/portfolio/offers" },
      { label: "Counter-offers",  href: "/portfolio/counter-offers", badge: { key: "counters", variant: "warning" } },
      { label: "Licensing",       href: "/portfolio/licensing", badge: { key: "remixes", variant: "primary" } },
      { label: "Sponsorships",    href: "/portfolio/sponsorships", badge: { key: "sponsorships", variant: "primary" } },
    ],
  },
  { label: "Activity", href: "/portfolio/activity" },
  {
    label: "Settings",
    href: "/portfolio/settings",
    children: [
      { label: "Profile", href: "/portfolio/settings" },
      { label: "Wallet",  href: "/portfolio/wallet" },
    ],
  },
];

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { walletAddress, isLoadingWallet, refetchWallet } = useSessionKey();
  const pathname = usePathname();
  const address = walletAddress;
  const { orders } = useUserOrders(address ?? null);
  const { offers: remixOffers } = useRemixOffers("creator");
  const { data: rewards } = useRewards(address);
  const { pendingCount: sponsorshipPendingCount } = useMySponsorshipDealCounts(address);

  const counts = derivePortfolioCounts(orders, remixOffers, address, sponsorshipPendingCount);

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
          <Link href="/onboarding?redirect_url=/portfolio">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 space-y-6">
      <PortfolioHeader
        address={address}
        score={
          rewards
            ? {
                levelName: rewards.currentLevelName,
                totalXp: rewards.totalXp,
                href: "/rewards",
              }
            : null
        }
      />

      <PortfolioNav
        sections={NAV_SECTIONS}
        pathname={pathname}
        badgeCounts={{
          offers: counts.received,
          remixes: counts.remix,
          counters: counts.counter,
          sponsorships: counts.sponsorships,
        }}
      />

      {/* Page content */}
      {children}
    </div>
  );
}

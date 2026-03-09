"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { AddressDisplay } from "@/components/shared/address-display";
import { Briefcase, Wallet } from "lucide-react";
import { useUserOrders } from "@/hooks/use-orders";
import { markOffersAsSeen } from "@/hooks/use-unread-offers";
import { useSessionKey } from "@/hooks/use-session-key";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Assets",           href: "/portfolio/assets" },
  { label: "Collections",      href: "/portfolio/collections" },
  { label: "Listings",         href: "/portfolio/listings" },
  { label: "Offers sent",      href: "/portfolio/offers" },
  { label: "Offers received",  href: "/portfolio/received", badge: true },
  { label: "Activity",         href: "/portfolio/activity" },
];

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { walletAddress, isLoadingWallet } = useSessionKey();
  const pathname = usePathname();
  const address = walletAddress;
  const { orders } = useUserOrders(address ?? null);

  const receivedCount = orders.filter(
    (o) =>
      o.status === "ACTIVE" &&
      o.offer.itemType === "ERC20" &&
      o.offerer.toLowerCase() !== (address ?? "").toLowerCase()
  ).length;

  useEffect(() => {
    const receivedOffers = orders.filter(
      (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20"
    );
    if (receivedOffers.length > 0) {
      markOffersAsSeen(receivedOffers.map((o) => o.orderHash));
    }
  }, [orders]);

  if (!isLoaded || isLoadingWallet) return null;

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
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
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
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
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground text-sm">Your Starknet wallet:</p>
          <AddressDisplay address={address} chars={6} className="text-sm" />
        </div>
      </div>

      {/* Subnav */}
      <nav className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors shrink-0",
                active
                  ? "text-foreground font-medium bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {item.label}
              {item.badge && receivedCount > 0 && (
                <span className="h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                  {receivedCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}

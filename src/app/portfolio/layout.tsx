"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useUserOrders } from "@/hooks/use-orders";
import { markOffersAsSeen } from "@/hooks/use-unread-offers";
import { useRemixOffers } from "@/hooks/use-remix-offers";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import Link from "next/link";
import { useRewards } from "@/hooks/use-rewards";
import { useMySponsorshipDealCounts } from "@/hooks/use-sponsorship";
import {
  PortfolioHeader,
  PortfolioChipFilter,
  derivePortfolioCounts,
  type PortfolioChipFilterOption,
} from "@medialane/ui";

/** Every portfolio destination, flat — this chip bar is the section's only navigation, on every page. */
const PORTFOLIO_SECTIONS: { key: string; label: string; href: string }[] = [
  { key: "overview",    label: "Overview",            href: "/portfolio" },
  { key: "assets",      label: "Assets",               href: "/portfolio/assets" },
  { key: "collections", label: "Collections",           href: "/portfolio/collections" },
  { key: "listings",    label: "Listings",              href: "/portfolio/listings" },
  { key: "received",    label: "Offers received",       href: "/portfolio/received" },
  { key: "offers",      label: "Offers sent",           href: "/portfolio/offers" },
  { key: "counter",     label: "Counter-offers",        href: "/portfolio/counter-offers" },
  { key: "licensing",   label: "Licensing",             href: "/portfolio/licensing" },
  { key: "sponsorship", label: "Sponsorships",          href: "/portfolio/sponsorships" },
  { key: "activity",    label: "Activity",              href: "/portfolio/activity" },
];

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const { hasWallet, address } = useWalletNativeSession();
  const pathname = usePathname();
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

  if (!hasWallet) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Secure your account</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Set up your wallet to unlock your portfolio and start trading.
        </p>
        <Button asChild>
          <Link href="/wallet-onboarding?redirect_url=/portfolio">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 space-y-6">
      <PortfolioHeader
        address={address ?? ""}
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

      <PortfolioChipFilter
        options={PORTFOLIO_SECTIONS.map((s): PortfolioChipFilterOption => ({
          key: s.key,
          href: s.href,
          label:
            s.key === "received" && counts.received > 0
              ? `${s.label} (${counts.received})`
              : s.key === "counter" && counts.counter > 0
                ? `${s.label} (${counts.counter})`
                : s.key === "licensing" && counts.remix > 0
                  ? `${s.label} (${counts.remix})`
                  : s.key === "sponsorship" && counts.sponsorships > 0
                    ? `${s.label} (${counts.sponsorships})`
                    : s.label,
        }))}
        value={pathname}
        onChange={() => {}}
        showAll={false}
      />

      {children}
    </div>
  );
}

"use client";

import { PortfolioOrders, useMedialaneApp } from "@medialane/ui";
import { useCounterOfferActions } from "@/components/portfolio/portfolio-actions";

export default function PortfolioCounterOffersPage() {
  const { walletAddress } = useMedialaneApp();
  return walletAddress ? <PortfolioOrders view="counter-offers" address={walletAddress} useActions={useCounterOfferActions} /> : null;
}

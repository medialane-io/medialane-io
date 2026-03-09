"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { OffersTable } from "@/components/portfolio/offers-table";

export default function PortfolioOffersPage() {
  const { walletAddress } = useSessionKey();
  return <OffersTable address={walletAddress!} />;
}

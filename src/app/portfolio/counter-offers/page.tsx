"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { CounterOffersTable } from "@/components/portfolio/counter-offers-table";

export default function PortfolioCounterOffersPage() {
  const { walletAddress } = useSessionKey();
  return <CounterOffersTable address={walletAddress!} />;
}

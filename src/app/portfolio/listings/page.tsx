"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { ListingsTable } from "@/components/portfolio/listings-table";

export default function PortfolioListingsPage() {
  const { walletAddress } = useSessionKey();
  return <ListingsTable address={walletAddress!} />;
}

"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { PortfolioActivity } from "@/components/portfolio/portfolio-activity";

export default function PortfolioActivityPage() {
  const { walletAddress } = useSessionKey();
  return <PortfolioActivity address={walletAddress ?? null} />;
}

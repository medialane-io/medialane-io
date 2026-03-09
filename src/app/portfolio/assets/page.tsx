"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { AssetsGrid } from "@/components/portfolio/assets-grid";

export default function PortfolioAssetsPage() {
  const { walletAddress } = useSessionKey();
  return <AssetsGrid address={walletAddress} />;
}

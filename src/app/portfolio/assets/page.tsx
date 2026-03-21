"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { AssetsGrid } from "@/components/portfolio/assets-grid";

export default function PortfolioAssetsPage() {
  const { walletAddress } = useSessionKey();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your assets</h2>
      </div>
      <AssetsGrid key={walletAddress ?? "no-wallet"} address={walletAddress ?? null} />
    </div>
  );
}

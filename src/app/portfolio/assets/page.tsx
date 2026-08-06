"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { AssetsGrid } from "@/components/portfolio/assets-grid";

export default function PortfolioAssetsPage() {
  const { address: walletAddress } = useWalletNativeSession();

  return (
    <div className="space-y-4">
      <AssetsGrid key={walletAddress ?? "no-wallet"} address={walletAddress ?? null} />
    </div>
  );
}

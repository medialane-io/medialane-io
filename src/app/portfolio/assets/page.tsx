"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { AssetsGrid } from "@/components/portfolio/assets-grid";

export default function PortfolioAssetsPage() {
  const { walletAddress, isLoadingWallet } = useSessionKey();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your assets</h2>
      </div>
      {isLoadingWallet ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse">
              <div className="aspect-square w-full bg-muted-foreground/10" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AssetsGrid key={walletAddress ?? "no-wallet"} address={walletAddress ?? null} />
      )}
    </div>
  );
}

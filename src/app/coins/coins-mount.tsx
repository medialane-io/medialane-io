"use client";

import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { CoinsExplorer, GradientButton } from "@medialane/ui";
import { useCoinsAdapter, useCoinPriceAdapter, coinHref } from "@/lib/coin-adapters";

export function CoinsMount({ heading = true }: { heading?: boolean }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      {heading && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-semibold">Coins</span>
            </div>
            <h1 className="text-3xl">Creator coins & memecoins</h1>
          </div>
          <GradientButton wrapperClassName="w-auto shrink-0" onClick={() => router.push("/launchpad/coin/create")}>
            Launch a coin
          </GradientButton>
        </div>
      )}
      <CoinsExplorer
        useCoins={useCoinsAdapter}
        usePrice={useCoinPriceAdapter}
        coinHref={coinHref}
        heading={false}
      />
    </div>
  );
}

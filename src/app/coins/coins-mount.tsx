"use client";

import { CoinsExplorer } from "@medialane/ui";
import { useCoinsAdapter, useCoinPriceAdapter, coinHref } from "@/lib/coin-adapters";

/** Client mount binding io's adapters to the shared CoinsExplorer. */
export function CoinsMount({ heading = true }: { heading?: boolean }) {
  return (
    <CoinsExplorer
      useCoins={useCoinsAdapter}
      usePrice={useCoinPriceAdapter}
      coinHref={coinHref}
      heading={heading}
    />
  );
}

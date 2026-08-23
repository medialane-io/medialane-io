"use client";

import { useRouter } from "next/navigation";
import { CoinsExplorer, GradientButton } from "@medialane/ui";
import { useCoinsAdapter, useCoinPriceAdapter, coinHref } from "@/lib/coin-adapters";

export function CoinsMount({ heading = true }: { heading?: boolean }) {
  const router = useRouter();

  return (
    <CoinsExplorer
      useCoins={useCoinsAdapter}
      usePrice={useCoinPriceAdapter}
      coinHref={coinHref}
      heading={heading}
      action={
        <GradientButton
          wrapperClassName="w-auto shrink-0"
          onClick={() => router.push("/launchpad/coin/create")}
        >
          Launch a coin
        </GradientButton>
      }
    />
  );
}

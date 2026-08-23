"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { CoinsExplorer, GradientButton, Button } from "@medialane/ui";
import { useCoinsAdapter, useCoinPriceAdapter, usePriceMapAdapter, coinHref } from "@/lib/coin-adapters";

export function CoinsMount({ heading = true }: { heading?: boolean }) {
  const router = useRouter();

  return (
    <CoinsExplorer
      useCoins={useCoinsAdapter}
      usePrice={useCoinPriceAdapter}
      usePriceMap={usePriceMapAdapter}
      coinHref={coinHref}
      heading={heading}
      action={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/launchpad/memecoin">Claim a coin</Link>
          </Button>
          <GradientButton
            wrapperClassName="w-auto shrink-0"
            onClick={() => router.push("/launchpad/coin/create")}
          >
            Launch a coin
          </GradientButton>
        </div>
      }
    />
  );
}

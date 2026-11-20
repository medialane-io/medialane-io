"use client";

import { useRouter } from "@medialane/ui/router";
import Link from "@medialane/ui/link";
import { CoinsExplorer, ActionButton, Button } from "@medialane/ui";
import { useCoinsAdapter, useCoinPriceAdapter, usePriceMapAdapter, coinHref } from "@/lib/coin-adapters";
import { useT } from "@medialane/ui/i18n";

export function CoinsMount({ heading = true }: { heading?: boolean }) {
  const t = useT();
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
          <Button asChild variant="soft">
            <Link href="/claim/memecoin">{t("Claim a coin")}</Link>
          </Button>
          <ActionButton solid className="shrink-0" onClick={() => router.push("/launchpad/coin/create")}>
            {t("Launch a coin")}
          </ActionButton>
        </div>
      }
    />
  );
}

"use client";

import { useEffect, useState } from "react";

export type UsdPrices = Partial<Record<"STRK" | "ETH" | "USDC" | "USDT" | "WBTC", number>>;

const REFRESH_MS = 60_000;

export function useUsdPrices(): UsdPrices | null {
  const [prices, setPrices] = useState<UsdPrices | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/proxy/v1/prices")
        .then((r) => r.json())
        .then((r: { data?: { usd?: UsdPrices } }) => {
          if (!cancelled && r.data?.usd) setPrices(r.data.usd);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return prices;
}

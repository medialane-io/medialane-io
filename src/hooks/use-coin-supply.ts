"use client";

/**
 * useCoinSupply — total supply of a coin, from the indexed backend.
 *
 * Creator coins are fixed-supply (immutable after deploy) and Coin.totalSupply
 * is populated at index time (see medialane-backend's readTotalSupply). External
 * ERC-20s not yet claimed/added may still come through with totalSupply: null —
 * the caller hides the stat in that case, same as before. Works for logged-out
 * visitors on /coins too — the backend proxy attaches io's own app key
 * regardless of visitor login state, same as every other public coin read.
 */

import useSWR from "swr";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useCoinSupply(coinAddress?: string | null, decimals = 18) {
  const { data, isLoading } = useSWR<bigint | null>(
    coinAddress ? `coin-supply-${coinAddress}` : null,
    async () => {
      const res = await getMedialaneClient().api.getCoin(coinAddress as string);
      return res.data.totalSupply ? BigInt(res.data.totalSupply) : null;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false, onError: () => {} }
  );
  const raw = data ?? null;
  const supply = raw !== null ? Number(raw / 10n ** BigInt(decimals)) : null;
  return { raw, supply, isLoading };
}

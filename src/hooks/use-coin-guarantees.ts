"use client";

import useSWR from "swr";
import type { CreatorCoinGuarantees } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useCoinGuarantees(coinAddress?: string | null, enabled = true) {
  const { data, error, isLoading } = useSWR<CreatorCoinGuarantees | null>(
    coinAddress && enabled ? `coin-guarantees-${coinAddress}` : null,
    () => getMedialaneClient().api.chainReads.coinGuarantees(coinAddress as string),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { guarantees: data ?? null, isLoading, error };
}

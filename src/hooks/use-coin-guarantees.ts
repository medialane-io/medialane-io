"use client";

import useSWR from "swr";
import { getCreatorCoinGuarantees, type CreatorCoinGuarantees } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";

export function useCoinGuarantees(coinAddress?: string | null, enabled = true) {
  const { data, error, isLoading } = useSWR<CreatorCoinGuarantees>(
    coinAddress && enabled ? `coin-guarantees-${coinAddress}` : null,
    () => getCreatorCoinGuarantees(coinAddress as string, starknetProvider),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { guarantees: data ?? null, isLoading, error };
}

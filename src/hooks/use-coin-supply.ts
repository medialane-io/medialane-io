"use client";

/**
 * useCoinSupply — total supply of an arbitrary ERC-20 coin, read on-chain.
 *
 * The backend only indexes supply for natively-tracked coins; external ERC-20s
 * (claimed memecoins) come through with `totalSupply: null`. Reading the ERC-20
 * `total_supply()` straight from the chain — via the public read provider, like
 * `useCoinPrice`, so it works for logged-out visitors on /coins — gives a real
 * supply for every coin. Returns null when the call fails (caller hides the stat
 * rather than showing an empty box).
 */

import useSWR from "swr";
import { publicReadProvider } from "@/lib/starknet";

async function readTotalSupply(coinAddress: string): Promise<bigint> {
  // Cairo ERC-20s expose the getter under either name depending on the
  // OpenZeppelin version (snake_case `total_supply` or camelCase `totalSupply`).
  let res: string[];
  try {
    res = await publicReadProvider.callContract({ contractAddress: coinAddress, entrypoint: "total_supply", calldata: [] });
  } catch {
    res = await publicReadProvider.callContract({ contractAddress: coinAddress, entrypoint: "totalSupply", calldata: [] });
  }
  // ERC-20 returns a u256 as [low, high].
  const low = BigInt(res[0] ?? "0");
  const high = BigInt(res[1] ?? "0");
  return low + (high << 128n);
}

export function useCoinSupply(coinAddress?: string | null, decimals = 18) {
  const { data, isLoading } = useSWR<bigint>(
    coinAddress ? `coin-supply-${coinAddress}` : null,
    () => readTotalSupply(coinAddress as string),
    { revalidateOnFocus: false, shouldRetryOnError: false, onError: () => {} }
  );
  const raw = data ?? null;
  const supply = raw !== null ? Number(raw / 10n ** BigInt(decimals)) : null;
  return { raw, supply, isLoading };
}

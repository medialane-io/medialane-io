"use client";

import useSWR from "swr";
import { starknetProvider } from "@/lib/starknet";
import { getListableTokens, parseAmount } from "@medialane/sdk";

async function fetchErc20Balance(tokenAddress: string, holderAddress: string): Promise<bigint> {
  const result = await starknetProvider.callContract(
    {
      contractAddress: tokenAddress,
      entrypoint: "balanceOf",
      calldata: [holderAddress],
    },
    "latest"
  );
  // ERC-20 balanceOf returns a u256: [low, high]
  const low = BigInt(result[0]);
  const high = BigInt(result[1]);
  return low + (high << 128n);
}

/** Raw bigint balance for any ERC-20 token by contract address. Refreshes every 30s. */
export function useErc20Balance(tokenAddress: string | null, holderAddress: string | null) {
  const { data, isLoading } = useSWR(
    tokenAddress && holderAddress ? ["erc20-balance", tokenAddress, holderAddress] : null,
    ([, addr, holder]) => fetchErc20Balance(addr, holder),
    { refreshInterval: 30_000, revalidateOnFocus: false, shouldRetryOnError: false }
  );
  return { rawBalance: data ?? null, isLoading };
}

/** Balance for a token identified by symbol (e.g. "USDC"). Includes decimals for formatting. */
export function useTokenBalance(symbol: string | null, holderAddress: string | null) {
  const token = symbol ? getListableTokens().find((t) => t.symbol === symbol) ?? null : null;
  const { rawBalance, isLoading } = useErc20Balance(token?.address ?? null, holderAddress);
  return { rawBalance, isLoading, decimals: token?.decimals ?? 18 };
}

/**
 * Returns true when the holder has enough balance to cover the required amount.
 * Returns null when balance is still loading or the amount is unparseable.
 */
export function hasSufficientBalance(
  rawBalance: bigint | null,
  requiredHuman: string,
  decimals: number
): boolean | null {
  if (rawBalance === null) return null;
  const n = parseFloat(requiredHuman);
  if (!requiredHuman || isNaN(n) || n <= 0) return null;
  const required = BigInt(parseAmount(requiredHuman, decimals));
  return rawBalance >= required;
}

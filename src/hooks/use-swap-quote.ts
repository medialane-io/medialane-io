"use client";

import useSWR from "swr";
import type { ApiSession, ApiSwapQuote } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { useSession } from "@/hooks/use-session";

export type SwapQuoteSummary = ApiSwapQuote;

export type SwapToken = string | { address: string };

function tokenKey(token: SwapToken): string {
  return typeof token === "string" ? token : token.address;
}

function tokenBody(token: SwapToken, side: "sell" | "buy") {
  return typeof token === "string"
    ? { [`${side}Symbol`]: token }
    : { [`${side}TokenAddress`]: token.address };
}

export type SwapAmountMode = "sell" | "buy";

function fetchQuote(
  sell: SwapToken,
  buy: SwapToken,
  amountRaw: string,
  amountMode: SwapAmountMode,
  takerAddress: string | null
): Promise<SwapQuoteSummary> {
  return getMedialaneClient().api.getSwapQuote({
    ...tokenBody(sell, "sell"),
    ...tokenBody(buy, "buy"),
    [`${amountMode}AmountRaw`]: amountRaw,
    takerAddress: takerAddress ?? undefined,
  });
}

export function swapQuoteKey(
  session: ApiSession | null,
  sell: SwapToken | null,
  buy: SwapToken | null,
  amountRaw: string | null,
  amountMode: SwapAmountMode,
  takerAddress: string | null
) {
  return session && sell && buy && amountRaw
    ? (["swap-quote", tokenKey(sell), tokenKey(buy), amountRaw, amountMode, takerAddress] as const)
    : null;
}

export function useSwapQuote(
  sell: SwapToken | null,
  buy: SwapToken | null,
  amountRaw: string | null,
  takerAddress: string | null,
  amountMode: SwapAmountMode = "buy"
) {
  const { session } = useSession();
  const { data, error, isLoading } = useSWR(
    swapQuoteKey(session, sell, buy, amountRaw, amountMode, takerAddress),
    () => fetchQuote(sell!, buy!, amountRaw!, amountMode, takerAddress),
    {
      refreshInterval: 20_000,
      dedupingInterval: 15_000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  return { quote: data ?? null, isLoading, error: error as Error | undefined };
}

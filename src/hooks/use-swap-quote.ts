"use client";

import useSWR from "swr";

export interface SwapQuoteSummary {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: string;
  buyTokenAddress: string;
  buyAmount: string;
}

/** A swap-route token: either a catalogue symbol (STRK, ETH, …) or an
 * arbitrary contract address (a creator coin/memecoin). */
export type SwapToken = string | { address: string };

function tokenKey(token: SwapToken): string {
  return typeof token === "string" ? token : token.address;
}

function tokenBody(token: SwapToken, side: "sell" | "buy") {
  return typeof token === "string"
    ? { [`${side}Symbol`]: token }
    : { [`${side}TokenAddress`]: token.address };
}

/** Which side of the trade the given raw amount fixes — AVNU only quotes one
 * side at a time. "buy" (exact output) is what checkout needs; "sell" (exact
 * input) is the natural mode for a "how much am I paying" trade widget. */
export type SwapAmountMode = "sell" | "buy";

async function fetchQuote(
  sell: SwapToken,
  buy: SwapToken,
  amountRaw: string,
  amountMode: SwapAmountMode,
  takerAddress: string | null
): Promise<SwapQuoteSummary> {
  const res = await fetch("/api/wallet/swap/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...tokenBody(sell, "sell"),
      ...tokenBody(buy, "buy"),
      [`${amountMode}AmountRaw`]: amountRaw,
      takerAddress: takerAddress ?? undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to fetch swap quote");
  }
  const { quote } = (await res.json()) as { quote: SwapQuoteSummary };
  return quote;
}

export function useSwapQuote(
  sell: SwapToken | null,
  buy: SwapToken | null,
  amountRaw: string | null,
  takerAddress: string | null,
  amountMode: SwapAmountMode = "buy"
) {
  const key = sell && buy && amountRaw
    ? (["swap-quote", tokenKey(sell), tokenKey(buy), amountRaw, amountMode, takerAddress] as const)
    : null;
  const { data, error, isLoading } = useSWR(
    key,
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

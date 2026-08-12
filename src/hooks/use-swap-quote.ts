"use client";

import useSWR from "swr";

export interface SwapQuoteSummary {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: string;
  buyTokenAddress: string;
  buyAmount: string;
}

async function fetchQuote(
  sellSymbol: string,
  buySymbol: string,
  buyAmountRaw: string,
  takerAddress: string | null
): Promise<SwapQuoteSummary> {
  const res = await fetch("/api/wallet/swap/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sellSymbol, buySymbol, buyAmountRaw, takerAddress: takerAddress ?? undefined }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to fetch swap quote");
  }
  const { quote } = (await res.json()) as { quote: SwapQuoteSummary };
  return quote;
}

/**
 * Browsing-estimate swap quote for the "pay with" picker — stale-tolerant,
 * refreshed periodically, informational only. Never reused to build calls;
 * the buy-time flow fetches its own fresh quote via /api/wallet/swap/build
 * (see buildSwapCalls in lib/wallet/swap-calls.ts).
 */
export function useSwapQuote(
  sellSymbol: string | null,
  buySymbol: string | null,
  buyAmountRaw: string | null,
  takerAddress: string | null
) {
  const key = sellSymbol && buySymbol && buyAmountRaw
    ? (["swap-quote", sellSymbol, buySymbol, buyAmountRaw, takerAddress] as const)
    : null;
  const { data, error, isLoading } = useSWR(
    key,
    ([, sell, buy, amount, taker]) => fetchQuote(sell, buy, amount, taker),
    {
      refreshInterval: 20_000,
      dedupingInterval: 15_000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  return { quote: data ?? null, isLoading, error: error as Error | undefined };
}

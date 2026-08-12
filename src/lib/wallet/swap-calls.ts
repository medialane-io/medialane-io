import type { Call } from "starknet";

export interface BuiltSwap {
  calls: Call[];
  chainId: string;
  quote: { quoteId: string; sellAmount: string; buyAmount: string; sellTokenAddress: string; buyTokenAddress: string };
}

/**
 * Buy-time swap-call builder — always fetches a fresh AVNU quote server-side
 * (never reuses the picker's browsing estimate) and returns ready-to-execute
 * approve+swap calls for the exact buyAmountRaw needed. Throws on any
 * failure (no route, quote/build error, insufficient credits) — callers
 * should surface this as "price moved, try again" rather than proceed.
 */
export async function buildSwapCalls(params: {
  sellSymbol: string;
  buySymbol: string;
  buyAmountRaw: string;
  takerAddress: string;
}): Promise<BuiltSwap> {
  const res = await fetch("/api/wallet/swap/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to prepare swap");
  }
  return res.json();
}

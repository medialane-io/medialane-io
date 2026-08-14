import type { Call } from "starknet";

export interface BuiltSwap {
  calls: Call[];
  chainId: string;
  quote: { quoteId: string; sellAmount: string; buyAmount: string; sellTokenAddress: string; buyTokenAddress: string };
}

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

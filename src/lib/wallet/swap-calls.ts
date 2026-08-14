import type { Call } from "starknet";
import type { SwapAmountMode, SwapToken } from "@/hooks/use-swap-quote";

export interface BuiltSwap {
  calls: Call[];
  chainId: string;
  quote: { quoteId: string; sellAmount: string; buyAmount: string; sellTokenAddress: string; buyTokenAddress: string };
}

function tokenBody(token: SwapToken, side: "sell" | "buy") {
  return typeof token === "string"
    ? { [`${side}Symbol`]: token }
    : { [`${side}TokenAddress`]: token.address };
}

interface BuildSwapCallsParams {
  sell: SwapToken;
  buy: SwapToken;
  takerAddress: string;
  amountRaw: string;
  /** Which side amountRaw fixes. Defaults to "buy" (exact output) — what
   * checkout needs to pay an exact price. Pass "sell" for a trade widget
   * quoting off "amount the user is paying". */
  amountMode?: SwapAmountMode;
}

export async function buildSwapCalls(params: BuildSwapCallsParams): Promise<BuiltSwap> {
  const amountMode = params.amountMode ?? "buy";
  const res = await fetch("/api/wallet/swap/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...tokenBody(params.sell, "sell"),
      ...tokenBody(params.buy, "buy"),
      [`${amountMode}AmountRaw`]: params.amountRaw,
      takerAddress: params.takerAddress,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to prepare swap");
  }
  return res.json();
}

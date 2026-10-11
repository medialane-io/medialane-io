import type { Call } from "starknet";
import { getTokenBySymbol, type ApiClient } from "@medialane/sdk";
import type { SwapAmountMode, SwapToken } from "@/hooks/use-swap-quote";

interface CreateSwapIntentParams {
  sell: SwapToken;
  buy: SwapToken;
  takerAddress: string;
  amountRaw: string;

  amountMode?: SwapAmountMode;
}

function tokenAddress(token: SwapToken): string {
  if (typeof token !== "string") return token.address;
  const known = getTokenBySymbol(token);
  if (!known) throw new Error(`Unsupported currency: ${token}`);
  return known.address;
}

export async function createSwapIntent(
  api: Pick<ApiClient, "createSwapIntent">,
  params: CreateSwapIntentParams,
): Promise<{ id: string; calls: Call[] }> {
  const amountMode = params.amountMode ?? "buy";
  const created = await api.createSwapIntent({
    taker: params.takerAddress,
    sellTokenAddress: tokenAddress(params.sell),
    buyTokenAddress: tokenAddress(params.buy),
    [`${amountMode}AmountRaw`]: params.amountRaw,
  });
  const intent = created.data as { id: string; calls: Call[] };
  return { id: intent.id, calls: intent.calls };
}

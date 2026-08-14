import { validateAndParseAddress } from "starknet";
import { getTokenBySymbol } from "@medialane/sdk";

export interface SwapTokenInput {
  symbol?: string;
  address?: string;
}

/** Resolves a swap-route token from either a catalogue symbol (STRK, ETH, …)
 * or an arbitrary contract address (a creator coin/memecoin, not in
 * @medialane/sdk's SUPPORTED_TOKENS). Exactly one of symbol/address must be
 * given. */
export function resolveSwapToken(input: SwapTokenInput): { address: string } | null {
  const hasSymbol = !!input.symbol;
  const hasAddress = !!input.address;
  if (hasSymbol === hasAddress) return null;

  if (hasSymbol) {
    const token = getTokenBySymbol(input.symbol!);
    return token ? { address: token.address } : null;
  }

  try {
    return { address: validateAndParseAddress(input.address!.trim()) };
  } catch {
    return null;
  }
}

/** AVNU quotes are fixed on exactly one side — sell-amount-fixed (user
 * specifies what they're paying) or buy-amount-fixed (used by checkout,
 * which needs an exact price). Exactly one of the two raw amounts must be
 * given. */
export function resolveSwapAmount(input: {
  sellAmountRaw?: string;
  buyAmountRaw?: string;
}): { sellAmount: bigint } | { buyAmount: bigint } | null {
  const hasSell = !!input.sellAmountRaw;
  const hasBuy = !!input.buyAmountRaw;
  if (hasSell === hasBuy) return null;
  try {
    return hasSell ? { sellAmount: BigInt(input.sellAmountRaw!) } : { buyAmount: BigInt(input.buyAmountRaw!) };
  } catch {
    return null;
  }
}

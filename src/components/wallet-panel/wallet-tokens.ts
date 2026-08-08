import { getTokenBySymbol } from "@medialane/sdk";

export type WalletTokenSymbol = "STRK" | "ETH" | "USDC" | "WBTC";

export interface WalletToken {
  symbol: WalletTokenSymbol;
  name: string;
  address: string;
  decimals: number;
}

const tokenFor = (symbol: WalletTokenSymbol, name: string): WalletToken => {
  const t = getTokenBySymbol(symbol)!;
  return { symbol, name, address: t.address, decimals: t.decimals };
};

// The four tokens io's own wallet UI already pins (Settings → Account),
// matching media-wallet's pinned set minus USDT.
export const WALLET_TOKENS: WalletToken[] = [
  tokenFor("STRK", "Starknet"),
  tokenFor("ETH", "Ethereum"),
  tokenFor("USDC", "USD Coin"),
  tokenFor("WBTC", "Wrapped BTC"),
];

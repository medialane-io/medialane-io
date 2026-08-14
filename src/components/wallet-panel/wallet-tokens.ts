import { getTokenBySymbol } from "@medialane/sdk";

/** STRK/ETH/USDC/WBTC for the pinned dashboard, or any coin/memecoin symbol
 * when a WalletToken is built ad-hoc from a coin's own contract address. */
export type WalletTokenSymbol = string;

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

export const WALLET_TOKENS: WalletToken[] = [
  tokenFor("STRK", "Starknet"),
  tokenFor("ETH", "Ethereum"),
  tokenFor("USDC", "USD Coin"),
  tokenFor("WBTC", "Wrapped BTC"),
];

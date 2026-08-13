"use client";

import { getTokenBySymbol, SUPPORTED_TOKENS } from "@medialane/sdk";
import { Loader2, Wallet } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useErc20Balance } from "@/hooks/use-erc20-balance";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";
import { fmt } from "@/lib/wallet-format";
import { cn } from "@/lib/utils";

interface PayWithOptionProps {
  symbol: string;
  decimals: number;
  rawBalance: bigint;
  orderCurrency: string;
  requiredRaw: bigint;
  walletAddress: string | null;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Only ever rendered for a token the wallet actually holds (balance > 0) —
 * PayWithPicker filters zero-balance tokens out before this even mounts, so
 * "Insufficient" here always means "some, but not enough for this specific
 * purchase," never "nothing at all."
 */
function PayWithOption({
  symbol, decimals, rawBalance, orderCurrency, requiredRaw, walletAddress, selected, onSelect,
}: PayWithOptionProps) {
  const { quote, isLoading } = useSwapQuote(symbol, orderCurrency, requiredRaw.toString(), walletAddress);

  const sellAmount = quote ? BigInt(quote.sellAmount) : null;
  const insufficient = sellAmount !== null && rawBalance < sellAmount;

  return (
    <button
      type="button"
      disabled={insufficient}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
        insufficient && "opacity-40 pointer-events-none"
      )}
    >
      <CurrencyIcon symbol={symbol} size={18} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{symbol}</p>
        <p className="text-xs text-muted-foreground">
          Balance: {fmt(rawBalance, decimals, 4)}
        </p>
      </div>
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
      ) : sellAmount !== null ? (
        <p className="text-xs text-muted-foreground shrink-0">
          ≈ {fmt(sellAmount, decimals, 4)} {symbol}
        </p>
      ) : insufficient ? (
        <p className="text-xs text-amber-500 shrink-0">Insufficient</p>
      ) : null}
    </button>
  );
}

interface PayWithPickerProps {
  orderCurrency: string;
  requiredRaw: bigint;
  walletAddress: string | null;
  selected: string | null;
  onSelect: (symbol: string) => void;
}

/**
 * Shown only when the buyer's balance in the order's own currency is
 * insufficient — lets them pay with any other SUPPORTED_TOKENS currency
 * instead, auto-swapped into the order's currency as part of the same
 * atomic purchase transaction.
 *
 * Balances for the fixed 5-token universe are fetched here (one explicit
 * useErc20Balance call per known symbol, not a loop — hook order must
 * never depend on props) so this component can decide, up front, which
 * tokens are even worth offering: a zero balance can never cover a swap
 * regardless of rate, so those rows are filtered out entirely instead of
 * shown disabled. If every token is zero, the picker is replaced by a
 * "fund your wallet" prompt rather than an empty, unusable list.
 */
export function PayWithPicker({ orderCurrency, requiredRaw, walletAddress, selected, onSelect }: PayWithPickerProps) {
  const { open: openWalletPanel } = useWalletPanel();
  const alternatives = SUPPORTED_TOKENS.filter((t) => t.listable && t.symbol !== orderCurrency);

  const ethBalance = useErc20Balance(getTokenBySymbol("ETH")?.address ?? null, walletAddress);
  const strkBalance = useErc20Balance(getTokenBySymbol("STRK")?.address ?? null, walletAddress);
  const usdcBalance = useErc20Balance(getTokenBySymbol("USDC")?.address ?? null, walletAddress);
  const usdtBalance = useErc20Balance(getTokenBySymbol("USDT")?.address ?? null, walletAddress);
  const wbtcBalance = useErc20Balance(getTokenBySymbol("WBTC")?.address ?? null, walletAddress);
  const balancesBySymbol: Record<string, ReturnType<typeof useErc20Balance>> = {
    ETH: ethBalance, STRK: strkBalance, USDC: usdcBalance, USDT: usdtBalance, WBTC: wbtcBalance,
  };

  const stillLoading = alternatives.some((t) => balancesBySymbol[t.symbol]?.isLoading);
  const held = alternatives
    .map((token) => ({ token, rawBalance: balancesBySymbol[token.symbol]?.rawBalance ?? null }))
    .filter((entry): entry is { token: (typeof alternatives)[number]; rawBalance: bigint } =>
      entry.rawBalance !== null && entry.rawBalance > 0n
    );

  if (stillLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking your balances…
      </div>
    );
  }

  if (held.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
        <Wallet className="mx-auto h-5 w-5 text-amber-500" />
        <p className="text-sm font-medium">Your wallet has no funds</p>
        <p className="text-xs text-muted-foreground">
          Add STRK, ETH, USDC, USDT, or WBTC to your Medialane wallet to complete this purchase.
        </p>
        <button
          type="button"
          onClick={openWalletPanel}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Fund your wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Your {orderCurrency} balance is too low — pay with another token instead:
      </p>
      <div className="space-y-1.5">
        {held.map(({ token, rawBalance }) => (
          <PayWithOption
            key={token.symbol}
            symbol={token.symbol}
            decimals={token.decimals}
            rawBalance={rawBalance}
            orderCurrency={orderCurrency}
            requiredRaw={requiredRaw}
            walletAddress={walletAddress}
            selected={selected === token.symbol}
            onSelect={() => onSelect(token.symbol)}
          />
        ))}
      </div>
    </div>
  );
}

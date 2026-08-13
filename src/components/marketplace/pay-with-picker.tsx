"use client";

import { getTokenBySymbol, SUPPORTED_TOKENS } from "@medialane/sdk";
import { Loader2, Wallet } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useErc20Balance } from "@/hooks/use-erc20-balance";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";
import { fmt } from "@/lib/wallet-format";
import { cn } from "@/lib/utils";

/** Purely presentational — every value it needs is computed by the parent,
 *  which already fetched the balance and quote to decide whether this row
 *  (and the picker as a whole) has anything selectable at all. */
function PayWithOption({
  symbol, decimals, rawBalance, sellAmount, isLoading, insufficient, selected, onSelect,
}: {
  symbol: string;
  decimals: number;
  rawBalance: bigint;
  sellAmount: bigint | null;
  isLoading: boolean;
  insufficient: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
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

function FundWalletPrompt({ message, onFund }: { message: string; onFund: () => void }) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
      <Wallet className="mx-auto h-5 w-5 text-amber-500" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">
        Add STRK, ETH, USDC, USDT, or WBTC to your Medialane wallet to complete this purchase.
      </p>
      <button
        type="button"
        onClick={onFund}
        className="text-xs font-semibold text-primary hover:underline"
      >
        Fund your wallet
      </button>
    </div>
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
 * Balances AND quotes for the fixed 5-token universe are fetched here (one
 * explicit call per known symbol, never in a loop — hook order must never
 * depend on props), not inside each row, so this component can tell —
 * before rendering anything — whether the picker has a single genuinely
 * selectable option. Two distinct "you can't do this" states, not one:
 * holding nothing at all (never worth quoting) vs. holding some of a
 * token but not enough to cover the swap (e.g. 0.97 STRK when the swap
 * needs ~5714 STRK) — both replace the picker with an honest message and
 * a path to fund the wallet, instead of a "pay with another token" header
 * and an unusable "Select a token" button sitting over an all-insufficient
 * list.
 */
export function PayWithPicker({ orderCurrency, requiredRaw, walletAddress, selected, onSelect }: PayWithPickerProps) {
  const { open: openWalletPanel } = useWalletPanel();
  const alternatives = SUPPORTED_TOKENS.filter((t) => t.listable && t.symbol !== orderCurrency);

  const balanceETH = useErc20Balance(getTokenBySymbol("ETH")?.address ?? null, walletAddress);
  const balanceSTRK = useErc20Balance(getTokenBySymbol("STRK")?.address ?? null, walletAddress);
  const balanceUSDC = useErc20Balance(getTokenBySymbol("USDC")?.address ?? null, walletAddress);
  const balanceUSDT = useErc20Balance(getTokenBySymbol("USDT")?.address ?? null, walletAddress);
  const balanceWBTC = useErc20Balance(getTokenBySymbol("WBTC")?.address ?? null, walletAddress);
  const balances: Record<string, ReturnType<typeof useErc20Balance>> = {
    ETH: balanceETH, STRK: balanceSTRK, USDC: balanceUSDC, USDT: balanceUSDT, WBTC: balanceWBTC,
  };

  // Only worth a quote (a credit-metered call) when the token is a real
  // alternative (not the order's own currency) AND the wallet holds any of
  // it at all — a zero balance can never cover a swap regardless of rate.
  // useSwapQuote already treats a null sellSymbol as "don't fetch."
  const requiredStr = requiredRaw.toString();
  const quoteFor = (symbol: string) =>
    symbol !== orderCurrency && (balances[symbol].rawBalance ?? 0n) > 0n ? symbol : null;
  const quoteETH = useSwapQuote(quoteFor("ETH"), orderCurrency, requiredStr, walletAddress);
  const quoteSTRK = useSwapQuote(quoteFor("STRK"), orderCurrency, requiredStr, walletAddress);
  const quoteUSDC = useSwapQuote(quoteFor("USDC"), orderCurrency, requiredStr, walletAddress);
  const quoteUSDT = useSwapQuote(quoteFor("USDT"), orderCurrency, requiredStr, walletAddress);
  const quoteWBTC = useSwapQuote(quoteFor("WBTC"), orderCurrency, requiredStr, walletAddress);
  const quotes: Record<string, ReturnType<typeof useSwapQuote>> = {
    ETH: quoteETH, STRK: quoteSTRK, USDC: quoteUSDC, USDT: quoteUSDT, WBTC: quoteWBTC,
  };

  const rows = alternatives.map((token) => {
    const balance = balances[token.symbol];
    const quote = quotes[token.symbol];
    const rawBalance = balance.rawBalance ?? 0n;
    const hasBalance = rawBalance > 0n;
    const sellAmount = quote.quote ? BigInt(quote.quote.sellAmount) : null;
    const isLoading = hasBalance && quote.isLoading;
    const sufficient = hasBalance && sellAmount !== null && rawBalance >= sellAmount;
    return { token, rawBalance, hasBalance, sellAmount, isLoading, sufficient };
  });

  const held = rows.filter((r) => r.hasBalance);
  const anyBalanceLoading = alternatives.some((t) => balances[t.symbol].isLoading);
  const anyStillQuoting = held.some((r) => r.isLoading);
  const anySufficient = held.some((r) => r.sufficient);

  if (anyBalanceLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking your balances…
      </div>
    );
  }

  if (held.length === 0) {
    return <FundWalletPrompt message="Your wallet has no funds" onFund={openWalletPanel} />;
  }

  if (anyStillQuoting) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking exchange rates…
      </div>
    );
  }

  if (!anySufficient) {
    return (
      <FundWalletPrompt
        message="You don't have enough of any supported token to complete this purchase"
        onFund={openWalletPanel}
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Your {orderCurrency} balance is too low — pay with another token instead:
      </p>
      <div className="space-y-1.5">
        {held.map((row) => (
          <PayWithOption
            key={row.token.symbol}
            symbol={row.token.symbol}
            decimals={row.token.decimals}
            rawBalance={row.rawBalance}
            sellAmount={row.sellAmount}
            isLoading={row.isLoading}
            insufficient={!row.sufficient}
            selected={selected === row.token.symbol}
            onSelect={() => onSelect(row.token.symbol)}
          />
        ))}
      </div>
    </div>
  );
}

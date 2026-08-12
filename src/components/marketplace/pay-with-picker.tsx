"use client";

import { SUPPORTED_TOKENS } from "@medialane/sdk";
import { Loader2 } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useErc20Balance } from "@/hooks/use-erc20-balance";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import { fmt } from "@/lib/wallet-format";
import { cn } from "@/lib/utils";

interface PayWithOptionProps {
  symbol: string;
  address: string;
  decimals: number;
  orderCurrency: string;
  requiredRaw: bigint;
  walletAddress: string | null;
  selected: boolean;
  onSelect: () => void;
}

function PayWithOption({
  symbol, address, decimals, orderCurrency, requiredRaw, walletAddress, selected, onSelect,
}: PayWithOptionProps) {
  const { rawBalance } = useErc20Balance(address, walletAddress);
  const hasBalance = rawBalance !== null && rawBalance > 0n;

  // Only fetch a browsing quote for tokens the user actually holds — a zero
  // balance can never cover the purchase regardless of rate, so there's no
  // reason to spend a credit finding out.
  const { quote, isLoading } = useSwapQuote(
    hasBalance ? symbol : null,
    orderCurrency,
    hasBalance ? requiredRaw.toString() : null,
    walletAddress
  );

  const sellAmount = quote ? BigInt(quote.sellAmount) : null;
  const insufficient = !hasBalance || (sellAmount !== null && rawBalance! < sellAmount);

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
      {hasBalance && isLoading ? (
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
 */
export function PayWithPicker({ orderCurrency, requiredRaw, walletAddress, selected, onSelect }: PayWithPickerProps) {
  const alternatives = SUPPORTED_TOKENS.filter((t) => t.listable && t.symbol !== orderCurrency);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Your {orderCurrency} balance is too low — pay with another token instead:
      </p>
      <div className="space-y-1.5">
        {alternatives.map((token) => (
          <PayWithOption
            key={token.symbol}
            symbol={token.symbol}
            address={token.address}
            decimals={token.decimals}
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";
import { getTokenBySymbol, parseAmount, formatAmount } from "@medialane/sdk";
import { GradientButton } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useErc20Balance, useTokenBalance } from "@/hooks/use-erc20-balance";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import { buildSwapCalls } from "@/lib/wallet/swap-calls";
import { cn } from "@/lib/utils";

interface CoinSwapWidgetProps {
  coinAddress: string;
  coinSymbol: string;
  coinDecimals: number;
  quoteSymbol: string;
}

type Side = "buy" | "sell";

export function CoinSwapWidget({
  coinAddress,
  coinSymbol,
  coinDecimals,
  quoteSymbol,
}: CoinSwapWidgetProps) {
  const quoteDecimals = getTokenBySymbol(quoteSymbol)?.decimals ?? 18;
  const { hasWallet, address } = useWalletNativeSession();
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const action = useWalletWriteAction();

  const payDecimals = side === "buy" ? quoteDecimals : coinDecimals;
  const receiveSymbol = side === "buy" ? coinSymbol : quoteSymbol;
  const paySymbol = side === "buy" ? quoteSymbol : coinSymbol;

  const sellToken = side === "buy" ? quoteSymbol : { address: coinAddress };
  const buyToken = side === "buy" ? { address: coinAddress } : quoteSymbol;

  const { rawBalance: quoteBalance } = useTokenBalance(quoteSymbol, address);
  const { rawBalance: coinBalance } = useErc20Balance(coinAddress, address);
  const payBalance = side === "buy" ? quoteBalance : coinBalance;

  let payAmountRaw: bigint | null = null;
  try {
    payAmountRaw = amount.trim() ? BigInt(parseAmount(amount.trim(), payDecimals)) : null;
  } catch {
    payAmountRaw = null;
  }
  const overBalance = payAmountRaw != null && payBalance != null && payAmountRaw > payBalance;

  const { quote, isLoading: quoting } = useSwapQuote(
    sellToken,
    buyToken,
    payAmountRaw != null && payAmountRaw > 0n ? payAmountRaw.toString() : null,
    address,
    "sell"
  );

  const receiveAmount = useMemo(() => {
    if (!quote) return null;
    const receiveDecimals = side === "buy" ? coinDecimals : quoteDecimals;
    return formatAmount(quote.buyAmount, receiveDecimals);
  }, [quote, side, coinDecimals, quoteDecimals]);

  const ready = hasWallet && payAmountRaw != null && payAmountRaw > 0n && !overBalance && !!quote && !quoting;

  const submit = () => {
    if (!ready || !address) return;
    void action.run(async (signer) => {
      const built = await buildSwapCalls({
        sell: sellToken,
        buy: buyToken,
        amountRaw: quote!.sellAmount,
        amountMode: "sell",
        takerAddress: address,
      });
      const result = await signer.execute(built.calls);
      setAmount("");
      return result;
    });
  };

  if (!hasWallet) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/70 p-5 text-center space-y-3">
        <Wallet className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Secure your account to trade {coinSymbol}.</p>
        <Link
          href="/wallet-onboarding"
          className="inline-flex items-center justify-center rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Secure your account
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-foreground/[0.05] p-1">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); setAmount(""); }}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold transition-colors capitalize",
              side === s ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s} {coinSymbol}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>You pay</span>
          {payBalance != null && (
            <button
              className="hover:text-foreground"
              onClick={() => setAmount(formatAmount(payBalance.toString(), payDecimals))}
            >
              Balance: {formatAmount(payBalance.toString(), payDecimals)} {paySymbol}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.0"
            inputMode="decimal"
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold tabular-nums outline-none"
          />
          <span className="shrink-0 text-sm font-semibold text-muted-foreground">{paySymbol}</span>
        </div>
        {overBalance && <p className="px-1 text-xs text-destructive">Insufficient {paySymbol} balance.</p>}
      </div>

      <div className="space-y-1.5">
        <p className="px-1 text-xs text-muted-foreground">You receive</p>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
          <span className="min-w-0 flex-1 text-lg font-semibold tabular-nums text-muted-foreground">
            {quoting ? "…" : receiveAmount ?? "0.0"}
          </span>
          <span className="shrink-0 text-sm font-semibold text-muted-foreground">{receiveSymbol}</span>
        </div>
      </div>

      {action.error && <p className="px-1 text-xs text-destructive">{action.error}</p>}
      {action.status === "success" && (
        <p className="px-1 text-xs text-emerald-500">
          {side === "buy" ? "Bought" : "Sold"} {coinSymbol}. Balances update in a few seconds.
        </p>
      )}

      <GradientButton
        onClick={action.status === "success" ? action.reset : submit}
        disabled={action.status === "success" ? false : !ready || action.status === "processing" || action.status === "confirming"}
        className="w-full"
      >
        {action.status === "processing" || action.status === "confirming" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming…
          </span>
        ) : action.status === "success" ? (
          "Trade again"
        ) : (
          `${side === "buy" ? "Buy" : "Sell"} ${coinSymbol}`
        )}
      </GradientButton>
    </div>
  );
}

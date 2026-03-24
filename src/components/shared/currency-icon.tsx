import Image from "next/image";
import { cn } from "@/lib/utils";

const CURRENCY_ICONS: Record<string, string> = {
  USDC: "/usdc.svg",
  USDT: "/usdt.svg",
  ETH: "/eth.svg",
  STRK: "/strk.svg",
  WBTC: "/btc.svg",
};

interface CurrencyIconProps {
  symbol: string | null | undefined;
  size?: number;
  className?: string;
}

export function CurrencyIcon({ symbol, size = 16, className }: CurrencyIconProps) {
  const src = symbol ? CURRENCY_ICONS[symbol] : undefined;
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={symbol ?? ""}
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      unoptimized
    />
  );
}

/** Inline price + currency icon. Replaces `{amount} {symbol}` patterns. */
interface CurrencyAmountProps {
  amount: string;
  symbol: string | null | undefined;
  amountClassName?: string;
  iconSize?: number;
  className?: string;
}

export function CurrencyAmount({
  amount,
  symbol,
  amountClassName,
  iconSize = 14,
  className,
}: CurrencyAmountProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <CurrencyIcon symbol={symbol} size={iconSize} />
      <span className={amountClassName}>{amount}</span>
    </span>
  );
}

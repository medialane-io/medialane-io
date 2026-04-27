"use client";

import Image from "next/image";

const CURRENCY_ICONS: Record<string, string> = {
  USDC: "/usdc.svg",
  USDT: "/usdt.svg",
  ETH: "/eth.svg",
  STRK: "/strk.svg",
  WBTC: "/btc.svg",
};

export interface CurrencyIconProps {
  symbol: string | null | undefined;
  size?: number;
  className?: string;
}

export interface CurrencyAmountProps {
  symbol: string | null | undefined;
  amount: string;
  size?: number;
  className?: string;
}

export function CurrencyIcon({ symbol, size = 16, className = "" }: CurrencyIconProps) {
  const normalized = symbol?.toUpperCase();
  const src = normalized ? CURRENCY_ICONS[normalized] : undefined;
  if (!src) {
    return <span className={`text-xs font-semibold text-white/70 ${className}`}>{symbol ?? ""}</span>;
  }
  return (
    <Image
      src={src}
      alt={symbol ?? "Currency"}
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
    />
  );
}

export function CurrencyAmount({ symbol, amount, size = 16, className = "" }: CurrencyAmountProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {amount}
      <CurrencyIcon symbol={symbol} size={size} />
    </span>
  );
}

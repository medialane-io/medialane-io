import { formatAmount } from "@medialane/sdk";
import type { UsdPrices } from "@/hooks/use-usd-prices";

export const fmt = (raw: bigint | null, decimals = 18, dp = 4): string => {
  if (raw == null) return "—";
  const [whole, frac = ""] = formatAmount(raw.toString(), decimals).split(".");
  const t = frac.slice(0, dp).replace(/0+$/, "");
  return t ? `${whole}.${t}` : whole;
};

export const fmtUsd = (n: number): string =>
  n > 0 && n < 0.01 ? "<$0.01" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const usdValueFor = (
  amountFormatted: string | null | undefined,
  currency: string | null | undefined,
  usdPrices: UsdPrices | null
): string | null => {
  if (!amountFormatted || !currency || !usdPrices) return null;
  const rate = usdPrices[currency.toUpperCase() as keyof UsdPrices];
  if (rate == null) return null;
  const amount = parseFloat(amountFormatted);
  if (isNaN(amount)) return null;
  return fmtUsd(amount * rate);
};

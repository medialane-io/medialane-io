/** App-layer guards + math for the Creator Coin launch flow.
 *  Price is the fixed, smoke-validated 0.01 quote/coin (VALIDATED_EKUBO_PARAMS);
 *  supply is the lever. Coins are always 18-decimal. v1 quote tokens are 18-dec. */

export const COIN_DECIMALS = 18;
export const LAUNCH_PRICE_QUOTE_PER_COIN = 0.01; // fixed; matches VALIDATED_EKUBO_PARAMS
export const MIN_SUPPLY = 1_000n;
export const MAX_SUPPLY = 1_000_000_000_000n; // 1e12 (audit M-3 ceiling)
export const MAX_FELT_BYTES = 31;             // felt252 short string

function byteLen(s: string): number {
  return new TextEncoder().encode(s).length;
}

export function validateName(s: string): string | null {
  if (!s.trim()) return "Name is required";
  if (byteLen(s) > MAX_FELT_BYTES) return `Name must be at most ${MAX_FELT_BYTES} bytes`;
  return null;
}

export function validateSymbol(s: string): string | null {
  if (!s.trim()) return "Symbol is required";
  if (byteLen(s) > MAX_FELT_BYTES) return `Symbol must be at most ${MAX_FELT_BYTES} bytes`;
  return null;
}

export function validateSupply(human: string): string | null {
  if (!/^\d+$/.test(human.trim())) return "Supply must be a whole number";
  const v = BigInt(human.trim());
  if (v < MIN_SUPPLY) return `Supply must be at least ${MIN_SUPPLY.toString()}`;
  if (v > MAX_SUPPLY) return `Supply must be at most ${MAX_SUPPLY.toString()}`;
  return null;
}

/** Human integer → raw base units (default 18-dec coin). */
export function toRaw(human: bigint, decimals = COIN_DECIMALS): bigint {
  return human * 10n ** BigInt(decimals);
}

/** Team allocation in raw coin units. `pct` is whole-percent 0–10. */
export function teamCoinsRaw(supplyRaw: bigint, pct: number): bigint {
  const bps = BigInt(Math.round(pct * 100)); // 5% -> 500 bps
  return (supplyRaw * bps) / 10_000n;
}

/** Quote (raw) needed to buy the team allocation back out of the pool:
 *  teamCoins(human) × 0.01, in the quote token's raw units.
 *  = teamCoinsRaw × 10^quoteDecimals / (100 × 10^18). For 18-dec quote → /100. */
export function buybackQuoteRaw(teamCoinsRawValue: bigint, quoteDecimals: number): bigint {
  return (teamCoinsRawValue * 10n ** BigInt(quoteDecimals)) / (100n * 10n ** BigInt(COIN_DECIMALS));
}

/** Fully-diluted value (human, in quote) for the live preview. */
export function fdvHuman(supplyHuman: number): number {
  return supplyHuman * LAUNCH_PRICE_QUOTE_PER_COIN;
}

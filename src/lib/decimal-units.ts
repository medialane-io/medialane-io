/** Parse a decimal string into base units using integer-safe string math. */
export function parseDecimalToUnits(value: string, decimals: number): string {
  const trimmed = value.trim();
  // Integer, optional fraction, or leading-dot fraction (e.g. .5, -.5); allows trailing "."
  if (!/^-?(\d+\.\d*|\d+|\.\d+)$/.test(trimmed)) {
    throw new Error("Invalid decimal value");
  }
  const isNegative = trimmed.startsWith("-");
  const unsigned = isNegative ? trimmed.slice(1) : trimmed;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const normalizedFraction = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const raw = `${whole}${normalizedFraction}`.replace(/^0+(?=\d)/, "");
  const result = BigInt(raw || "0");
  const signed = isNegative && result !== 0n ? -result : result;
  return signed.toString();
}

/** Format raw integer units into a decimal string without precision loss. */
export function formatUnitsToDecimal(raw: string, decimals: number): string {
  const n = BigInt(raw);
  const sign = n < 0n ? "-" : "";
  const abs = n < 0n ? -n : n;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;
  if (decimals === 0) return `${sign}${whole.toString()}`;
  const frac = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return frac ? `${sign}${whole.toString()}.${frac}` : `${sign}${whole.toString()}`;
}

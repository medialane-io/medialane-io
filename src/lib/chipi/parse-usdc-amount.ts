/** Parse a human USDC decimal string (e.g. "12.34") to 6-decimal base units as bigint. */
export function parseUsdcHumanToBaseUnits(amountStr: string): bigint {
  const s = amountStr.trim();
  if (!/^\d+(\.\d*)?$/.test(s)) throw new Error("Invalid amount");
  const [wholePart, fracPart = ""] = s.split(".");
  const whole = wholePart === "" ? "0" : wholePart;
  const frac = (fracPart + "000000").slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(frac);
}

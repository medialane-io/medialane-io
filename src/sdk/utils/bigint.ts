/**
 * Recursively convert all BigInt values to their decimal string representations.
 * Required before JSON serialisation and before passing objects to starknet.js
 * functions that expect string felts.
 */
export function stringifyBigInts(obj: unknown): unknown {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        key,
        stringifyBigInts(value),
      ])
    );
  }
  return obj;
}

/**
 * Convert a u256 represented as { low: string; high: string } to a single BigInt.
 */
export function u256ToBigInt(low: string, high: string): bigint {
  return BigInt(low) + (BigInt(high) << 128n);
}

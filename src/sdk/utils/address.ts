/**
 * Normalize a Starknet address to a 0x-prefixed 64-character hex string.
 */
export function normalizeAddress(address: string): string {
  const hex = address.replace(/^0x/, "").toLowerCase();
  return "0x" + hex.padStart(64, "0");
}

/**
 * Shorten an address to "0x1234...abcd" format.
 */
export function shortenAddress(address: string, chars = 4): string {
  const norm = normalizeAddress(address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
}

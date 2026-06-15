// Shared allowlist helpers for the Collection Drop create flow + manage page.

/** Parse a free-form textarea (newline/comma/space separated) into valid Starknet addresses. */
export function parseAddresses(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((a) => a.trim())
    .filter((a) => /^0x[0-9a-fA-F]+$/.test(a));
}

/** Cairo Span<ContractAddress> calldata: [len, ...addresses]. */
export function batchAllowlistCalldata(addresses: string[]): string[] {
  return [addresses.length.toString(), ...addresses];
}

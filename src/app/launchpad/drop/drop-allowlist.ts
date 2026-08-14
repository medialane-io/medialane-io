

export function parseAddresses(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((a) => a.trim())
    .filter((a) => /^0x[0-9a-fA-F]+$/.test(a));
}

export function batchAllowlistCalldata(addresses: string[]): string[] {
  return [addresses.length.toString(), ...addresses];
}

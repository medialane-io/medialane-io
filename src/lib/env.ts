type HexAddress = `0x${string}`;

function isHexAddress(value: string): value is HexAddress {
  return /^0x[0-9a-fA-F]{1,64}$/.test(value);
}

export function readAddressEnv(
  value: string | undefined,
  // `fallback` is `string` (not HexAddress): the SDK's address constants are
  // typed `string` since the 0.37 chain-registry refactor. We validate whichever
  // value wins, so the HexAddress return is still guaranteed.
  fallback: string,
  name: string
): HexAddress {
  const chosen = value || fallback;
  if (!isHexAddress(chosen)) {
    throw new Error(`Invalid ${name}: expected a Starknet hex address starting with 0x`);
  }
  return chosen;
}

export function readOptionalAddressEnv(value: string | undefined, name: string): HexAddress | "" {
  if (!value) return "";
  if (!isHexAddress(value)) {
    throw new Error(`Invalid ${name}: expected a Starknet hex address starting with 0x`);
  }
  return value;
}

export function readStringEnv(value: string | undefined, fallback = ""): string {
  return value ?? fallback;
}

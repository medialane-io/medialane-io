import { byteArray as starkByteArray } from "starknet";

/**
 * Serialize a JS string into Cairo ByteArray calldata felts.
 *
 * starknet.js 6.x encodes ByteArray as felt252 shortstring via contract.populate(),
 * producing wrong calldata. This manual encoding is required for all direct
 * entrypoint calls that accept a Cairo ByteArray argument.
 */
export function serializeByteArray(str: string): string[] {
  const ba = starkByteArray.byteArrayFromString(str);
  return [
    ba.data.length.toString(),
    ...ba.data.map(String),
    String(ba.pending_word),
    ba.pending_word_len.toString(),
  ];
}

/** Split a bigint into low/high felt252 halves for a Cairo u256. */
export function encodeU256(n: bigint): [string, string] {
  return [
    (n & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString(),
    (n >> BigInt(128)).toString(),
  ];
}

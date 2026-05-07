/**
 * Serialize a JS string into Cairo ByteArray calldata felts.
 *
 * starknet.js byteArrayFromString is ASCII-only. This encodes as UTF-8 first,
 * then packs bytes into 31-byte felt252 chunks (Cairo ByteArray layout),
 * supporting any Unicode string (accented chars, CJK, emoji, etc.).
 */
export function serializeByteArray(str: string): string[] {
  const bytes = new TextEncoder().encode(str);
  const data: string[] = [];
  let i = 0;
  while (i + 31 <= bytes.length) {
    let value = 0n;
    for (let j = 0; j < 31; j++) value = (value << 8n) | BigInt(bytes[i + j]);
    data.push("0x" + value.toString(16));
    i += 31;
  }
  const remaining = bytes.slice(i);
  let pendingWord = 0n;
  for (const byte of remaining) pendingWord = (pendingWord << 8n) | BigInt(byte);
  const pending_word = "0x" + pendingWord.toString(16);
  const pending_word_len = remaining.length;
  return [
    data.length.toString(),
    ...data,
    pending_word,
    pending_word_len.toString(),
  ];
}

/** Split a bigint into low/high felt252 halves for a Cairo u256. */
export function encodeU256(n: bigint): [string, string] {
  return [
    (n & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString(),
    (n >> BigInt(128)).toString(),
  ];
}

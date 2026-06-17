/** Heuristic for Chipi decrypt / PIN mismatch errors shown to the user. */
export function looksLikeEncryptionFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("incorrect") ||
    m.includes("pin") ||
    m.includes("decrypt") ||
    m.includes("encryption") ||
    m.includes("encryptkey") ||
    // CryptoES throws these when AES decryption runs with the wrong key (wrong
    // PIN / wrong auth method) — neither contains the words above, so without
    // these the recovery hint never fired for ~30% of wrong-PIN cases.
    m.includes("malformed utf-8") ||
    m.includes("resulted in empty string")
  );
}

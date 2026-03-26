/** Heuristic for Chipi decrypt / PIN mismatch errors shown to the user. */
export function looksLikeEncryptionFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("incorrect") ||
    m.includes("pin") ||
    m.includes("decrypt") ||
    m.includes("encryption") ||
    m.includes("encryptkey")
  );
}

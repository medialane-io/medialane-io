/**
 * User- and support-friendly copy when Starknet RPC / Alchemy quota fails.
 * Juniors: this is NOT a user "hack" — it usually means the app's RPC provider
 * (e.g. Alchemy) hit a monthly or rate limit while reading the chain.
 */

export function isLikelyRpcCapacityError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("monthly capacity") ||
    m.includes("scaling policy") ||
    (m.includes("alchemy") && (m.includes("limit") || m.includes("billing"))) ||
    m.includes("rate limit") ||
    m.includes("too many requests") ||
    m.includes("quota")
  );
}

export function formatStarknetInfrastructureError(
  raw: string,
  options?: { txHash?: string; operation?: string }
): string {
  const op = options?.operation ?? "This step";
  const hashLine = options?.txHash
    ? ` Transaction hash (for support): ${options.txHash}`
    : "";

  if (isLikelyRpcCapacityError(raw)) {
    return (
      `${op} hit a blockchain RPC limit (provider quota). ` +
      `Your on-chain transaction may still have succeeded — check the explorer link or your portfolio in a few minutes.${hashLine} ` +
      `If nothing shows up, contact support and mention "RPC limit" or share this error.`
    );
  }

  const short = raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
  return (
    `${op} failed because of a network or infrastructure error.${hashLine} ` +
    `Try again in a moment. If it keeps happening, contact support. Technical detail: ${short}`
  );
}

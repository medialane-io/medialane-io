import { createHmac, timingSafeEqual } from "crypto";

/**
 * Server-side SIWS token verifier.
 * Mirrors the logic in medialane-backend/src/utils/siwsToken.ts (and
 * medialane-starknet's identical `lib/siws-server.ts`).
 * Requires SIWS_SECRET env var (same value as the backend).
 *
 * Returns the wallet address on success, null on any failure.
 */
export function verifySiwsToken(raw: string): string | null {
  const secret = process.env.SIWS_SECRET;
  if (!secret) return null;
  if (!raw.startsWith("siws_")) return null;

  const inner = raw.slice(5);
  const dot = inner.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = inner.slice(0, dot);
  const provided = inner.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  if (provided.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }

  let data: { sub?: string; exp?: number };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!data.sub || !data.exp) return null;
  if (data.exp < Math.floor(Date.now() / 1000)) return null;

  return data.sub;
}

/** Extract and verify the SIWS token from an Authorization: Bearer header. */
export function getSiwsWallet(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifySiwsToken(authHeader.slice(7));
}

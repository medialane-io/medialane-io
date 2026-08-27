import { verifySiwsToken } from "@medialane/sdk";

/**
 * Binds the platform secret to the shared token verifier in @medialane/sdk.
 *
 * The verification itself deliberately does not live here. It used to, as one
 * of three separate copies — this app, the dapp, and the backend that issues
 * the tokens — all sharing a secret with nothing keeping them in step. When the
 * backend changed how the signature was computed, these copies kept checking
 * the old one, which would have returned 401 on every route below that gate,
 * including all of this app's upload routes.
 */
export function getSiwsWallet(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const secret = process.env.SIWS_SECRET;
  if (!secret) return null;

  return verifySiwsToken(secret, authHeader.slice(7))?.address ?? null;
}

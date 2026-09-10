import { verifySiwsToken } from "@medialane/sdk";

export function getSiwsWallet(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const secret = process.env.SIWS_SECRET;
  if (!secret) return null;

  return verifySiwsToken(secret, authHeader.slice(7))?.address ?? null;
}

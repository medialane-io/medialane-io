import type { MedialaneClient } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import { normalizeAddress } from "@/lib/utils";

export type WalletEncryptionPreference = "PIN" | "PASSKEY";

/**
 * PATCH creator profile `preferredEncryption` (upserts CreatorProfile row).
 * Use from server actions or client; requires Clerk JWT (chipipay template).
 */
export async function patchCreatorPreferredEncryption(
  walletAddress: string,
  preference: WalletEncryptionPreference,
  clerkToken: string
): Promise<boolean> {
  const norm = normalizeAddress(walletAddress);
  const base = MEDIALANE_BACKEND_URL.replace(/\/$/, "");
  const url = `${base}/v1/creators/${norm}/profile`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
        ...(MEDIALANE_API_KEY ? { "x-api-key": MEDIALANE_API_KEY } : {}),
      },
      body: JSON.stringify({ preferredEncryption: preference }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * If the profile has no `preferredEncryption` yet, PATCH after a successful tx.
 * Skips when already PIN or PASSKEY (first choice wins).
 */
export async function maybeSavePreferredEncryptionIfUnset(
  walletAddress: string,
  preference: WalletEncryptionPreference,
  getClerkToken: () => Promise<string | null | undefined>,
  client: MedialaneClient
): Promise<void> {
  const token = await getClerkToken();
  if (!token || !walletAddress) return;

  const norm = normalizeAddress(walletAddress);
  try {
    const profile = (await client.api.getCreatorProfile(norm)) as {
      preferredEncryption?: string | null;
    } | null;
    if (
      profile?.preferredEncryption === "PIN" ||
      profile?.preferredEncryption === "PASSKEY"
    ) {
      return;
    }
  } catch {
    /* no row yet — still PATCH to create */
  }

  await patchCreatorPreferredEncryption(norm, preference, token);
}

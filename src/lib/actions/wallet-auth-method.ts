"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export type WalletAuthMethod = "pin" | "passkey";

/**
 * Persist the wallet's unlock method to Clerk `publicMetadata` — the
 * authoritative, cross-device record of whether this account's wallet is
 * sealed with a PIN or a passkey.
 *
 * Why this exists: ChipiPay's own passkey detection (`hasWalletPasskey`)
 * reads `localStorage` only, so it's device-local — a passkey user on a fresh
 * browser reads `false` and would be wrongly routed to a PIN that can never
 * decrypt their passkey-sealed key ("Malformed UTF-8 data"). This flag lets
 * `useWalletUnlock` know the truth on any device.
 *
 * Written at: wallet creation (onboarding), passkey migration, and
 * opportunistic backfill the first time a device reports a local passkey.
 * Only ever upgrades to "passkey" via backfill — absence of a local passkey
 * credential is NOT proof of "pin", so we never auto-write "pin".
 */
export async function recordWalletAuthMethod(method: WalletAuthMethod): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const client = await clerkClient();
    const existing = await client.users.getUser(userId);
    if ((existing.publicMetadata?.walletAuthMethod as WalletAuthMethod | undefined) === method) {
      return { ok: true }; // idempotent — avoid redundant writes
    }
    await client.users.updateUser(userId, {
      publicMetadata: { ...existing.publicMetadata, walletAuthMethod: method },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * ChipiPay's passkey credential metadata, as stored under
 * `localStorage["chipi_wallet_passkey_credential"]`. The `credentialId` is a
 * PUBLIC WebAuthn handle — NOT a secret (the passkey private key never leaves
 * the authenticator), so mirroring it to Clerk is safe and lets a new device
 * target the user's SYNCED passkey (iCloud/Google) — the PRF-derived key is
 * identical across devices, so it decrypts the same wallet.
 */
export interface PasskeyCredentialRecord {
  credentialId: string;
  createdAt?: string;
  userId?: string;
  prfSupported?: boolean;
  transports?: string[];
}

/** Persist the passkey credential handle to Clerk so other devices can restore it. */
export async function recordPasskeyCredential(credential: PasskeyCredentialRecord): Promise<{ ok: boolean }> {
  try {
    if (!credential?.credentialId) return { ok: false };
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const client = await clerkClient();
    const existing = await client.users.getUser(userId);
    const current = existing.publicMetadata?.passkeyCredential as PasskeyCredentialRecord | undefined;
    if (current?.credentialId === credential.credentialId) {
      return { ok: true }; // already mirrored
    }
    await client.users.updateUser(userId, {
      publicMetadata: { ...existing.publicMetadata, passkeyCredential: credential },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

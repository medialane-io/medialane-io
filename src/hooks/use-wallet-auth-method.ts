"use client";

import { useUser } from "@clerk/nextjs";
import { usePasskeyAuth, usePasskeyStatus } from "@chipi-stack/chipi-passkey/hooks";
import type { WalletAuthMethod } from "@/lib/actions/wallet-auth-method";

/**
 * Single source of truth for "does this wallet unlock with a passkey or a PIN."
 *
 * Two signals, in priority order:
 *  1. The authoritative, cross-device record in Clerk
 *     `publicMetadata.walletAuthMethod` — written ONLY from proven events
 *     (PIN→passkey migration, and a verified unlock; see `recordWalletAuthMethod`).
 *  2. Failing a record, this device's local passkey credential as a *hint*.
 *
 * IMPORTANT: a passkey credential in localStorage does NOT prove the *wallet*
 * is passkey-sealed — a PIN user can carry a stray/old credential. So
 * `usesPasskey` is only ever a hint about which method to TRY first; unlock
 * MUST fall back to a PIN dialog on any passkey failure (never hard-fail).
 * (We previously backfilled the authoritative record from this device flag,
 * which wrongly flagged PIN wallets as passkey — removed.)
 *
 * Used by `useWalletUnlock` (write flows) AND the bespoke unlock UIs (airdrop
 * mint, wallet panel) so every surface agrees on the method.
 */
export function useWalletAuthMethod() {
  const { user } = useUser();
  const { status: { hasPasskey, isSupported } } = usePasskeyStatus();
  const { authenticate, encryptKey } = usePasskeyAuth();

  const recordedMethod = user?.publicMetadata?.walletAuthMethod as WalletAuthMethod | undefined;
  const deviceHasPasskey = hasPasskey && isSupported;

  // Authoritative record wins; absent a record, treat a local credential as a
  // hint to TRY passkey first (unlock always falls back to PIN on failure).
  const usesPasskey = recordedMethod === "passkey" || (recordedMethod == null && deviceHasPasskey);

  return {
    /** The authoritative method when known, else undefined. */
    recordedMethod,
    /** Hint: try a passkey first. NOT a guarantee — unlock must PIN-fallback on failure. */
    usesPasskey,
    /** Passkey primitives for flows that drive their own unlock UI. */
    authenticate,
    encryptKey,
  };
}

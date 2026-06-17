"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { usePasskeyAuth, usePasskeyStatus } from "@chipi-stack/chipi-passkey/hooks";
import { recordWalletAuthMethod, type WalletAuthMethod } from "@/lib/actions/wallet-auth-method";

/**
 * Single source of truth for "does this wallet unlock with a passkey or a PIN."
 *
 * ChipiPay's own passkey detection (`hasWalletPasskey`) reads `localStorage`
 * only — device-local — so a passkey user on a fresh browser reads "no
 * passkey" and gets routed to a PIN that can never decrypt their passkey-sealed
 * key ("Malformed UTF-8 data"). We therefore prefer the authoritative,
 * cross-device record in Clerk `publicMetadata.walletAuthMethod`, fall back to
 * the device-local flag when there's no record yet, and opportunistically
 * backfill the record the first time a device reports a local passkey.
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

  // Authoritative record wins; absent a record, trust this device's credential.
  const usesPasskey = recordedMethod === "passkey" || (recordedMethod == null && deviceHasPasskey);

  // Opportunistic backfill — upgrades existing passkey users (who predate the
  // record) so OTHER devices route them to passkey instead of a doomed PIN.
  // Only ever writes "passkey": a device lacking a local credential is NOT
  // proof of "pin".
  const backfilledRef = useRef(false);
  useEffect(() => {
    if (backfilledRef.current) return;
    if (deviceHasPasskey && recordedMethod !== "passkey") {
      backfilledRef.current = true;
      void recordWalletAuthMethod("passkey").then((r) => { if (r.ok) void user?.reload(); });
    }
  }, [deviceHasPasskey, recordedMethod, user]);

  return {
    /** The authoritative method when known, else undefined. */
    recordedMethod,
    /** Whether this wallet unlocks with a passkey (authoritative, else device guess). */
    usesPasskey,
    /** True only when we hold an authoritative "passkey" record (vs a device guess). */
    isPasskeyAuthoritative: recordedMethod === "passkey",
    /** Passkey primitives for flows that drive their own unlock UI. */
    authenticate,
    encryptKey,
  };
}

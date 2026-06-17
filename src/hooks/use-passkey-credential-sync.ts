"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getStoredCredential } from "@chipi-stack/chipi-passkey";
import { recordPasskeyCredential, type PasskeyCredentialRecord } from "@/lib/actions/wallet-auth-method";

// Must match @chipi-stack/chipi-passkey's localStorage key.
const CHIPI_CREDENTIAL_KEY = "chipi_wallet_passkey_credential";

/**
 * Cross-device passkey enablement.
 *
 * ChipiPay stores the passkey credential handle in `localStorage` only, and
 * `getWalletEncryptKey` targets the passkey via `allowCredentials: [{ id }]` —
 * so on a fresh device (empty localStorage) it throws "No wallet passkey
 * found", even though the passkey itself SYNCS (iCloud/Google) and would
 * derive the identical PRF key.
 *
 * This hook mirrors that public credential handle through Clerk
 * `publicMetadata.passkeyCredential`:
 *  - UP:   device has a local credential the cloud doesn't → persist it.
 *  - DOWN: cloud has a credential this device lacks → restore it to
 *          localStorage so ChipiPay can target the synced passkey.
 *
 * The credentialId is a PUBLIC handle, not a secret — restoring it does not
 * grant access; unlocking still requires the authenticator (Face ID / Touch
 * ID) on a device where the passkey is present/synced.
 *
 * Mount once, high in the tree (app shell), before any unlock is attempted.
 */
export function usePasskeyCredentialSync() {
  const { user, isLoaded } = useUser();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || syncedRef.current) return;
    if (typeof window === "undefined") return;

    const local = getStoredCredential() as PasskeyCredentialRecord | null;
    const cloud = user.publicMetadata?.passkeyCredential as PasskeyCredentialRecord | undefined;

    // DOWN — restore the synced passkey's handle onto this device.
    if (!local?.credentialId && cloud?.credentialId) {
      syncedRef.current = true;
      try {
        localStorage.setItem(CHIPI_CREDENTIAL_KEY, JSON.stringify(cloud));
      } catch {
        /* localStorage unavailable — nothing we can do */
      }
      return;
    }

    // UP — mirror this device's credential to the cloud for other devices.
    if (local?.credentialId && cloud?.credentialId !== local.credentialId) {
      syncedRef.current = true;
      void recordPasskeyCredential(local);
    }
  }, [isLoaded, user]);
}

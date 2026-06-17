"use client";

import { useCallback, useRef, useState } from "react";
import { useWalletAuthMethod } from "@/hooks/use-wallet-auth-method";

/**
 * Wallet-unlock orchestration shared by every write flow.
 *
 * An io wallet is unlocked by EITHER a PIN or a passkey — chosen once at
 * signup, never both. A passkey user has no PIN, so any PIN-only flow locks
 * them out: `decryptPrivateKey` runs with the wrong secret and fails as
 * "Malformed UTF-8 data" / "Decryption resulted in empty string".
 *
 * Authoritative vs device-local signal: ChipiPay's `hasWalletPasskey()` reads
 * `localStorage` only — it's device-local, so a passkey user on a fresh
 * browser reads `false`. We therefore prefer the cross-device record we keep
 * in Clerk `publicMetadata.walletAuthMethod` (see `recordWalletAuthMethod`),
 * and use the device-local flag only as a fallback / to backfill the record.
 *
 * This hook centralises the decision so flows never hard-code a PIN prompt:
 *  - passkey users unlock silently with Face ID / Touch ID (no PIN dialog);
 *  - PIN users get the PIN dialog;
 *  - a passkey failure falls through to the PIN dialog so no one is hard-stuck.
 *
 * Usage:
 *   const { unlock, pinDialogProps } = useWalletUnlock();
 *   await unlock((secret) => executeTransaction({ pin: secret, calls }));
 *   <PinDialog {...pinDialogProps} title="…" description="…" />
 */
export function useWalletUnlock() {
  // Authoritative passkey-vs-PIN signal + passkey primitives, shared with the
  // bespoke unlock UIs (airdrop, wallet panel).
  const { usesPasskey, isPasskeyAuthoritative, authenticate, encryptKey } = useWalletAuthMethod();

  const [pinOpen, setPinOpen] = useState(false);
  const runRef = useRef<((secret: string) => void | Promise<void>) | null>(null);

  const unlock = useCallback(
    async (run: (secret: string) => void | Promise<void>) => {
      if (usesPasskey) {
        let key: string | null | undefined = null;
        try {
          key = encryptKey ?? (await authenticate());
        } catch {
          key = null; // passkey auth failed/cancelled
        }
        if (key) {
          await run(key);
          return;
        }
        // Passkey is the wallet's only method and it didn't yield a key. Falling
        // back to a PIN dialog would just fail (the key is passkey-sealed), so
        // surface a clear, actionable error instead of a doomed PIN prompt.
        if (isPasskeyAuthoritative) {
          throw new Error(
            "This wallet unlocks with Face ID / Touch ID. Approve the prompt to continue — or open it on the device where you set up your passkey."
          );
        }
        // Device-only guess (no authoritative record) — fall through to PIN.
      }
      runRef.current = run;
      setPinOpen(true);
    },
    [usesPasskey, isPasskeyAuthoritative, encryptKey, authenticate],
  );

  const onSubmit = useCallback(async (pin: string) => {
    setPinOpen(false);
    const run = runRef.current;
    runRef.current = null;
    if (run) await run(pin);
  }, []);

  const onCancel = useCallback(() => {
    setPinOpen(false);
    runRef.current = null;
  }, []);

  return {
    /** Trigger an action behind the right unlock method. Call after the wallet-setup gate. */
    unlock,
    /** Whether this wallet unlocks with a passkey (true) or a PIN (false). */
    usesPasskey,
    /** Spread onto a <PinDialog> — supply your own title/description. */
    pinDialogProps: { open: pinOpen, onSubmit, onCancel },
  };
}

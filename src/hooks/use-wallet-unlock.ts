"use client";

import { useCallback, useRef, useState } from "react";
import { usePasskeyAuth, usePasskeyStatus } from "@chipi-stack/chipi-passkey/hooks";

/**
 * Wallet-unlock orchestration shared by every write flow.
 *
 * An io wallet is unlocked by EITHER a PIN or a passkey — chosen once at
 * signup, never both. A passkey user has no PIN, so any PIN-only flow locks
 * them out: `decryptPrivateKey` runs with the wrong secret and fails as
 * "Malformed UTF-8 data" / "Decryption resulted in empty string".
 *
 * This hook centralises the decision so flows never hard-code a PIN prompt:
 *  - passkey users unlock silently with Face ID / Touch ID (no PIN dialog);
 *  - PIN users get the PIN dialog;
 *  - a passkey failure falls through to the PIN dialog so no one is hard-stuck.
 *
 * Usage:
 *   const { unlock, pinDialogProps } = useWalletUnlock();
 *   // when the user confirms an action (after any wallet-setup gate):
 *   await unlock((secret) => executeTransaction({ pin: secret, calls }));
 *   // render once:
 *   <PinDialog {...pinDialogProps} title="…" description="…" />
 *
 * The `secret` passed to the callback is the unlock material — a typed PIN or
 * the passkey-derived encrypt key — and goes straight to executeTransaction's
 * `pin` param (which feeds decryptPrivateKey).
 */
export function useWalletUnlock() {
  const { status: { hasPasskey, isSupported } } = usePasskeyStatus();
  const { authenticate, encryptKey } = usePasskeyAuth();

  const [pinOpen, setPinOpen] = useState(false);
  // The pending action, held while the PIN dialog is open.
  const runRef = useRef<((secret: string) => void | Promise<void>) | null>(null);

  const usesPasskey = hasPasskey && isSupported;

  const unlock = useCallback(
    async (run: (secret: string) => void | Promise<void>) => {
      if (usesPasskey) {
        try {
          const key = encryptKey ?? (await authenticate());
          if (key) {
            await run(key);
            return;
          }
        } catch {
          /* passkey auth failed/cancelled — fall through to PIN entry */
        }
      }
      runRef.current = run;
      setPinOpen(true);
    },
    [usesPasskey, encryptKey, authenticate],
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

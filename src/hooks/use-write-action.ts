"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWalletUnlock } from "@/hooks/use-wallet-unlock";
import { useChipiTransaction, type ChipiTransactionStatus } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { mapWriteError } from "@/lib/chipi/map-write-error";

export type WriteStatus = "idle" | "processing" | "confirming" | "success" | "error";

export interface PrepareResult {
  status: string;
  txHash?: string | null;
  revertReason?: string;
}

interface UseWriteActionOptions {
  /** "off" (default) or "activate" — opt in to SNIP-9 session activation before executing. */
  session?: "off" | "activate";
  /** Clears a stale session when the action's value exceeds a cap (marketplace). */
  sessionAmountCap?: (value: number) => Promise<boolean>;
}

/**
 * The single write-orchestration primitive: gate (signed-in/wallet) → unlock
 * (passkey-or-PIN via useWalletUnlock) → execute → result, with opt-in SNIP-9
 * session activation. It does NOT build calls — the caller's `prepare` does,
 * via the returned `executeTransaction` (or any marketplace write fn).
 *
 * Synchronous-passkey rule: the passkey path runs synchronously, so `prepare`
 * MUST close over freshly-passed values, never a useState value set in the same
 * handler tick — call `run((secret) => doIt(values, secret))`.
 */
export function useWriteAction(opts: UseWriteActionOptions = {}) {
  const { session = "off", sessionAmountCap } = opts;
  const { isSignedIn } = useAuth();
  const { unlock, pinDialogProps } = useWalletUnlock();
  const { executeTransaction, status: txStatus, txHash } = useChipiTransaction();
  const { hasWallet, walletAddress, hasActiveSession, setupSession } = useSessionKey();

  const [status, setStatus] = useState<WriteStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [authHint, setAuthHint] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);

  const run = useCallback(
    async (
      prepare: (secret: string) => Promise<PrepareResult>,
      runOpts?: { value?: number },
    ) => {
      if (!isSignedIn || !walletAddress) {
        if (!hasWallet) setWalletSetupOpen(true);
        return;
      }
      // Passes the unlock secret through the branch (passkey: silent; PIN: dialog).
      // `unlock` itself can throw before `prepare` runs — e.g. a passkey-only
      // wallet whose passkey is unavailable on this device — so wrap it too.
      try {
        await unlock(async (secret) => {
          setError(null);
          setAuthHint(false);
          setStatus("processing");
          try {
            if (session === "activate") {
              if (sessionAmountCap && runOpts?.value != null) await sessionAmountCap(runOpts.value);
              if (!hasActiveSession) await setupSession(secret);
            }
            const result = await prepare(secret);
            if (result.status === "reverted") {
              throw new Error(result.revertReason || "Transaction reverted on chain");
            }
            setStatus("success");
          } catch (err: unknown) {
            const raw = err instanceof Error ? err.message : "Something went wrong";
            const mapped = mapWriteError(raw);
            setError(mapped.message);
            setAuthHint(mapped.authHint);
            setStatus("error");
          }
        });
      } catch (unlockErr: unknown) {
        // Unlock-level failure (e.g. passkey required but unavailable here).
        const raw = unlockErr instanceof Error ? unlockErr.message : "Could not unlock your wallet";
        const mapped = mapWriteError(raw);
        setError(mapped.message);
        setAuthHint(true);
        setStatus("error");
      }
    },
    [isSignedIn, walletAddress, hasWallet, unlock, session, sessionAmountCap, hasActiveSession, setupSession],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setAuthHint(false);
  }, []);

  return {
    status,
    txStatus: txStatus as ChipiTransactionStatus,
    txHash,
    error,
    authHint,
    walletSetupOpen,
    setWalletSetupOpen,
    pinDialogProps,
    executeTransaction,
    run,
    reset,
  };
}

export type WriteAction = ReturnType<typeof useWriteAction>;

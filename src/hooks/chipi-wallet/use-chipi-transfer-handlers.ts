"use client";

import { useCallback } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import type { WalletData } from "@chipi-stack/types";
import type { PinDialogSubmitOptions } from "@/components/chipi/pin-dialog";
import { looksLikeEncryptionFailure } from "@/lib/chipi/looks-like-encryption-failure";
import { resolveEncryptKey } from "@/lib/chipi/wallet/resolve-encrypt-key";
import {
  executeOwnerTransfer,
  executeSessionTransfer,
} from "@/lib/chipi/wallet/transfer-execution";

export type FallbackSignReason = "session_error" | "owner_sign";

type Params = {
  walletAddress: string | null;
  wallet: WalletData | null;
  storedSession: unknown | null;
  userId: string | null;
  authMethod: "pin" | "passkey";
  pin: string;
  passkeySupported: boolean;
  encryptKey: string | null | undefined;
  authenticate: () => Promise<string | null | undefined>;
  amount: string;
  toAddress: string;
  rememberSessionUiOn: boolean;
  hasRegisteredSigningSession: boolean;
  sessionUnlockKey: string | null;
  getBearerToken: () => Promise<string | null>;
  hasActiveSession: boolean;
  setupSession: (pin: string) => Promise<unknown>;
  clearSession: () => Promise<void>;
  maybeClearSessionForAmountCap: (amountUsdc: number) => Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transferAsync: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeWithSessionAsync: (args: any) => Promise<any>;
  clearSessionUnlockKey: () => void;
  setSessionUnlockKey: (key: string) => void;
  setToAddress: (value: string) => void;
  setAmount: (value: string) => void;
  setSessionUnlockOpen: (open: boolean) => void;
  setFallbackTransferOpen: (open: boolean) => void;
  setFallbackSignReason: (reason: FallbackSignReason) => void;
  setError: (value: string | null) => void;
  setEncryptionMismatchSuggestion: (value: "pin" | "passkey" | null) => void;
  setIsSubmitting: (value: boolean) => void;
};

export function useChipiTransferHandlers(params: Params) {
  const {
    walletAddress,
    wallet,
    storedSession,
    userId,
    authMethod,
    pin,
    passkeySupported,
    encryptKey,
    authenticate,
    amount,
    toAddress,
    rememberSessionUiOn,
    hasRegisteredSigningSession,
    sessionUnlockKey,
    getBearerToken,
    hasActiveSession,
    setupSession,
    clearSession,
    maybeClearSessionForAmountCap,
    transferAsync,
    executeWithSessionAsync,
    clearSessionUnlockKey,
    setSessionUnlockKey,
    setToAddress,
    setAmount,
    setSessionUnlockOpen,
    setFallbackTransferOpen,
    setFallbackSignReason,
    setError,
    setEncryptionMismatchSuggestion,
    setIsSubmitting,
  } = params;

  const getEncryptKey = useCallback(
    () =>
      resolveEncryptKey({
        authMethod,
        pin,
        passkeySupported,
        cachedEncryptKey: encryptKey,
        authenticate,
      }),
    [authMethod, pin, passkeySupported, encryptKey, authenticate]
  );

  const runOwnerTransfer = useCallback(
    async (derivedEncryptKey: string, usePasskeyForChipi: boolean, capCleared: boolean) => {
      const txHash = await executeOwnerTransfer({
        walletAddress,
        wallet,
        getBearerToken,
        capCleared,
        hasActiveSession,
        setupSession,
        derivedEncryptKey,
        usePasskeyForChipi,
        amount,
        toAddress,
        userId,
        transferAsync,
      });

      setToAddress("");
      setAmount("");
      toast.success("Transfer submitted successfully.", {
        description: txHash ? `Tx hash: ${txHash}` : undefined,
      });
    },
    [
      walletAddress,
      wallet,
      getBearerToken,
      hasActiveSession,
      setupSession,
      amount,
      toAddress,
      userId,
      transferAsync,
      setToAddress,
      setAmount,
    ]
  );

  const runSessionTransfer = useCallback(
    async (encryptKeyForSession: string) => {
      await executeSessionTransfer({
        walletAddress,
        wallet,
        storedSession,
        getBearerToken,
        amount,
        toAddress,
        encryptKeyForSession,
        executeWithSessionAsync,
      });
      setToAddress("");
      setAmount("");
      toast.success("Transfer submitted successfully.");
    },
    [
      walletAddress,
      wallet,
      storedSession,
      getBearerToken,
      amount,
      toAddress,
      executeWithSessionAsync,
      setToAddress,
      setAmount,
    ]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setEncryptionMismatchSuggestion(null);

      if (!walletAddress || !wallet) {
        setError("Wallet not found. Please create a wallet first.");
        return;
      }

      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        setError("Amount must be greater than 0.");
        toast.error("Invalid amount", { description: "Enter an amount greater than 0." });
        return;
      }

      const hadSessionBypass = rememberSessionUiOn;
      let sessionExecuteAttempted = false;

      try {
        setIsSubmitting(true);

        const capCleared = await maybeClearSessionForAmountCap(numAmount);
        if (capCleared && hadSessionBypass) {
          toast.info("Large transfer — fresh signing session", {
            description:
              "Your saved session was cleared. Registering a new session for this transfer size.",
          });
          toast.message("Enter PIN or passkey", {
            description: "This transfer needs your wallet key after the session was reset.",
          });
          setFallbackSignReason("session_error");
          setFallbackTransferOpen(true);
          return;
        }

        const bearerToken = await getBearerToken();
        if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

        if (rememberSessionUiOn && !capCleared) {
          if (hasRegisteredSigningSession && storedSession != null) {
            if (!sessionUnlockKey) {
              setSessionUnlockOpen(true);
              return;
            }
            sessionExecuteAttempted = true;
            await runSessionTransfer(sessionUnlockKey);
            return;
          }
          setFallbackSignReason("owner_sign");
          setFallbackTransferOpen(true);
          return;
        }

        const derivedEncryptKey = await getEncryptKey();
        await runOwnerTransfer(derivedEncryptKey, authMethod === "passkey", capCleared);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        if (sessionExecuteAttempted) {
          clearSessionUnlockKey();
          await clearSession();
          toast.error("Something went wrong", {
            description: err instanceof Error ? err.message : undefined,
          });
          setFallbackSignReason("session_error");
          setFallbackTransferOpen(true);
          return;
        }
        setError(msg);
        if (looksLikeEncryptionFailure(msg)) {
          setEncryptionMismatchSuggestion(authMethod === "pin" ? "passkey" : "pin");
        }
        toast.error("Transfer failed", { description: msg });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      setError,
      setEncryptionMismatchSuggestion,
      walletAddress,
      wallet,
      amount,
      rememberSessionUiOn,
      setIsSubmitting,
      maybeClearSessionForAmountCap,
      getBearerToken,
      hasRegisteredSigningSession,
      storedSession,
      sessionUnlockKey,
      setSessionUnlockOpen,
      runSessionTransfer,
      setFallbackSignReason,
      setFallbackTransferOpen,
      getEncryptKey,
      runOwnerTransfer,
      authMethod,
      clearSessionUnlockKey,
      clearSession,
    ]
  );

  const handleSessionUnlockAndSend = useCallback(
    async (key: string, _opts?: PinDialogSubmitOptions) => {
      setSessionUnlockOpen(false);
      setError(null);
      setEncryptionMismatchSuggestion(null);
      let sessionTried = false;
      try {
        setIsSubmitting(true);
        const numAmt = Number(amount);
        if (!Number.isFinite(numAmt) || numAmt <= 0) {
          toast.error("Invalid amount", { description: "Enter an amount greater than 0." });
          return;
        }
        if (!walletAddress || !wallet) return;

        const capCleared = await maybeClearSessionForAmountCap(numAmt);
        if (capCleared) {
          toast.info("Large transfer — fresh signing session", {
            description:
              "Your saved session was cleared. Registering a new session for this transfer size.",
          });
          setFallbackSignReason("session_error");
          setFallbackTransferOpen(true);
          return;
        }

        setSessionUnlockKey(key);
        sessionTried = true;
        await runSessionTransfer(key);
      } catch (err) {
        if (sessionTried) {
          clearSessionUnlockKey();
          await clearSession();
          toast.error("Something went wrong", {
            description: err instanceof Error ? err.message : undefined,
          });
          setFallbackSignReason("session_error");
          setFallbackTransferOpen(true);
        } else {
          const msg = err instanceof Error ? err.message : "Unexpected error";
          toast.error("Could not unlock session", { description: msg });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      setSessionUnlockOpen,
      setError,
      setEncryptionMismatchSuggestion,
      setIsSubmitting,
      amount,
      walletAddress,
      wallet,
      maybeClearSessionForAmountCap,
      setFallbackSignReason,
      setFallbackTransferOpen,
      setSessionUnlockKey,
      runSessionTransfer,
      clearSessionUnlockKey,
      clearSession,
    ]
  );

  const handleFallbackTransfer = useCallback(
    async (derivedEncryptKey: string, opts?: PinDialogSubmitOptions) => {
      setFallbackTransferOpen(false);
      setError(null);
      setEncryptionMismatchSuggestion(null);
      try {
        setIsSubmitting(true);
        const capCleared = await maybeClearSessionForAmountCap(Number(amount));
        if (capCleared) {
          toast.info("Large transfer — fresh signing session", {
            description:
              "Your saved session was cleared. Registering a new session for this transfer size.",
          });
        }
        await runOwnerTransfer(derivedEncryptKey, opts?.usedPasskey === true, capCleared);
        if (rememberSessionUiOn) {
          setSessionUnlockKey(derivedEncryptKey);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        setError(msg);
        if (looksLikeEncryptionFailure(msg)) {
          setEncryptionMismatchSuggestion(opts?.usedPasskey ? "pin" : "passkey");
        }
        toast.error("Transfer failed", { description: msg });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      setFallbackTransferOpen,
      setError,
      setEncryptionMismatchSuggestion,
      setIsSubmitting,
      maybeClearSessionForAmountCap,
      amount,
      runOwnerTransfer,
      rememberSessionUiOn,
      setSessionUnlockKey,
    ]
  );

  return {
    handleSubmit,
    handleSessionUnlockAndSend,
    handleFallbackTransfer,
    runOwnerTransfer,
  };
}


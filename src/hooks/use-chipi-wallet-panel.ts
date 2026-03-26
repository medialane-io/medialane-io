"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import type { WalletData } from "@chipi-stack/types";
import {
  useTransfer,
  useExecuteWithSession,
  isWebAuthnSupported,
  useUpdateWalletEncryption,
} from "@chipi-stack/nextjs";
import { usePasskeyAuth, usePasskeySetup } from "@chipi-stack/chipi-passkey/hooks";

import { useWalletWithBalance } from "@/hooks/use-wallet-with-balance";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiSessionUnlock } from "@/contexts/chipi-session-unlock-context";
import { useRememberSessionReset } from "@/hooks/chipi-wallet/use-remember-session-reset";
import { useChipiTransferHandlers } from "@/hooks/chipi-wallet/use-chipi-transfer-handlers";
import { usePinMigrationHandler } from "@/hooks/chipi-wallet/use-pin-migration-handler";

export type FallbackSignReason = "session_error" | "owner_sign";

export function useChipiWalletPanel() {
  const {
    wallet,
    walletAddress,
    hasWallet,
    isLoadingWallet,
    balance,
    isLoadingBalance,
    refetchWallet,
    refetchBalance,
    storedSession,
    sessionPreferences,
  } = useWalletWithBalance();

  const { userId, getToken } = useAuth();
  const { sessionUnlockKey, setSessionUnlockKey, clearSessionUnlockKey } =
    useChipiSessionUnlock();
  const { hasActiveSession, setupSession, clearSession, maybeClearSessionForAmountCap } =
    useSessionKey();

  const { transferAsync, isLoading: isTransferring } = useTransfer();
  const { executeWithSessionAsync, isLoading: isSessionExecuting } =
    useExecuteWithSession();
  const { authenticate, encryptKey } = usePasskeyAuth();
  const { setupPasskey } = usePasskeySetup();
  const { updateWalletEncryptionAsync, isLoading: isUpdatingEncryption } =
    useUpdateWalletEncryption();

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );

  const [authMethod, setAuthMethod] = useState<"pin" | "passkey">("pin");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [isPinMigrationDialogOpen, setIsPinMigrationDialogOpen] = useState(false);
  const [fallbackTransferOpen, setFallbackTransferOpen] = useState(false);
  const [sessionUnlockOpen, setSessionUnlockOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionMismatchSuggestion, setEncryptionMismatchSuggestion] = useState<
    "pin" | "passkey" | null
  >(null);
  const [fallbackSignReason, setFallbackSignReason] =
    useState<FallbackSignReason>("session_error");

  const loading = isLoadingWallet || isLoadingBalance;
  const walletSupportsSessionKeys = !wallet || wallet.walletType !== "READY";
  const rememberSessionUiOn =
    sessionPreferences?.enabled === true && walletSupportsSessionKeys;
  const hasRegisteredSigningSession = rememberSessionUiOn && hasActiveSession;

  useRememberSessionReset({
    rememberSessionUiOn,
    sessionPreferencesKnown: sessionPreferences != null,
    clearSession,
    onTurnedOn: () => {
      setSessionUnlockOpen(false);
      setFallbackTransferOpen(false);
    },
    onTurnedOff: () => {
      setSessionUnlockOpen(false);
      setFallbackTransferOpen(false);
      setError(null);
      setEncryptionMismatchSuggestion(null);
    },
  });

  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );

  const { handleSubmit, handleSessionUnlockAndSend, handleFallbackTransfer } =
    useChipiTransferHandlers({
      walletAddress,
      wallet: (wallet as WalletData) ?? null,
      storedSession,
      userId: userId ?? null,
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
    });

  const { handlePinMigrationSubmit } = usePinMigrationHandler({
    wallet: (wallet as WalletData) ?? null,
    userId: userId ?? null,
    getBearerToken,
    setupPasskey,
    updateWalletEncryptionAsync,
    refetchWallet,
    refetchBalance,
    clearSession,
    clearSessionUnlockKey,
    setAuthMethod,
    setPin,
    setIsPinMigrationDialogOpen,
    setError,
  });

  return {
    wallet,
    walletAddress,
    hasWallet,
    loading,
    balance,
    refetchWallet,
    refetchBalance,
    userId,
    passkeySupported,
    isUpdatingEncryption,
    authMethod,
    setAuthMethod,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    pin,
    setPin,
    isPinMigrationDialogOpen,
    setIsPinMigrationDialogOpen,
    fallbackTransferOpen,
    setFallbackTransferOpen,
    sessionUnlockOpen,
    setSessionUnlockOpen,
    isSubmitting,
    error,
    encryptionMismatchSuggestion,
    setEncryptionMismatchSuggestion,
    fallbackSignReason,
    rememberSessionUiOn,
    hasRegisteredSigningSession,
    sessionUnlockKey,
    isTransferring,
    isSessionExecuting,
    handleSubmit,
    handleSessionUnlockAndSend,
    handleFallbackTransfer,
    handlePinMigrationSubmit,
    setError,
  };
}

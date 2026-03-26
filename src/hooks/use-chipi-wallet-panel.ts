"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { uint256 } from "starknet";
import CryptoES from "crypto-es";
import { ChainToken, TransferHookInput, WalletData } from "@chipi-stack/types";
import {
  useTransfer,
  useExecuteWithSession,
  isWebAuthnSupported,
  useUpdateWalletEncryption,
} from "@chipi-stack/nextjs";
import { usePasskeyAuth, usePasskeySetup } from "@chipi-stack/chipi-passkey/hooks";
import { toast } from "sonner";

import { useWalletWithBalance } from "@/hooks/use-wallet-with-balance";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiSessionUnlock } from "@/contexts/chipi-session-unlock-context";
import { SUPPORTED_TOKENS } from "@/lib/constants";
import { parseUsdcHumanToBaseUnits } from "@/lib/chipi/parse-usdc-amount";
import { looksLikeEncryptionFailure } from "@/lib/chipi/looks-like-encryption-failure";
import type { PinDialogSubmitOptions } from "@/components/chipi/pin-dialog";

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

  const prevRememberSessionUiOnRef = useRef<boolean>(rememberSessionUiOn);
  useEffect(() => {
    const prev = prevRememberSessionUiOnRef.current;
    prevRememberSessionUiOnRef.current = rememberSessionUiOn;

    if (sessionPreferences == null) return;

    if (!prev && rememberSessionUiOn) {
      setSessionUnlockOpen(false);
      setFallbackTransferOpen(false);
    }

    if (rememberSessionUiOn) return;
    void clearSession();
    setSessionUnlockOpen(false);
    setFallbackTransferOpen(false);
    setError(null);
    setEncryptionMismatchSuggestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rememberSessionUiOn]);

  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );

  const getEncryptKey = async () => {
    if (authMethod === "pin") {
      if (!pin) throw new Error("Enter your PIN to transfer.");
      return pin;
    }
    if (!passkeySupported) {
      throw new Error("Passkey is not supported on this device.");
    }
    if (encryptKey) return encryptKey;
    const derived = await authenticate();
    if (!derived) throw new Error("Passkey authentication failed.");
    return derived;
  };

  const runOwnerTransfer = useCallback(
    async (
      derivedEncryptKey: string,
      usePasskeyForChipi: boolean,
      capCleared: boolean
    ) => {
      if (!walletAddress || !wallet) {
        throw new Error("Wallet not found. Please create a wallet first.");
      }

      const bearerToken = await getBearerToken();
      if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

      if (capCleared || !hasActiveSession) {
        await setupSession(derivedEncryptKey);
      }

      const publicKey =
        (wallet as WalletData)?.publicKey ??
        (wallet as WalletData)?.normalizedPublicKey ??
        walletAddress;

      const resultTxHash = await transferAsync({
        bearerToken,
        params: {
          amount: Number(amount),
          recipient: toAddress,
          token: ChainToken.USDC,
          encryptKey: derivedEncryptKey,
          usePasskey: usePasskeyForChipi,
          ...(usePasskeyForChipi ? { externalUserId: userId ?? undefined } : {}),
          wallet: {
            publicKey,
            encryptedPrivateKey: (wallet as WalletData)?.encryptedPrivateKey,
          },
        } as TransferHookInput,
      });

      setToAddress("");
      setAmount("");

      await Promise.all([refetchWallet(), refetchBalance()]);

      const txHash =
        typeof resultTxHash === "string" ? resultTxHash : undefined;
      toast.success("Transfer submitted successfully.", {
        description: txHash ? `Tx hash: ${txHash}` : undefined,
      });
    },
    [
      amount,
      toAddress,
      getBearerToken,
      walletAddress,
      wallet,
      hasActiveSession,
      setupSession,
      transferAsync,
      userId,
      refetchWallet,
      refetchBalance,
    ]
  );

  const runSessionTransfer = useCallback(
    async (encryptKeyForSession: string) => {
      if (!walletAddress || !wallet) {
        throw new Error("Wallet not found. Please create a wallet first.");
      }
      if (!storedSession) {
        throw new Error(
          "No signing session on file. Register one in Remember session settings."
        );
      }

      const bearerToken = await getBearerToken();
      if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

      const usdcToken = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC");
      if (!usdcToken?.address) throw new Error("USDC is not configured.");

      const baseUnits = parseUsdcHumanToBaseUnits(amount);
      const u256Parts = uint256.bnToUint256(baseUnits);

      await executeWithSessionAsync({
        bearerToken,
        params: {
          encryptKey: encryptKeyForSession,
          wallet: {
            publicKey: (wallet as WalletData).publicKey,
            encryptedPrivateKey: (wallet as WalletData).encryptedPrivateKey,
            walletType: "CHIPI",
          },
          session: storedSession,
          calls: [
            {
              contractAddress: usdcToken.address,
              entrypoint: "transfer",
              calldata: [
                toAddress,
                u256Parts.low.toString(),
                u256Parts.high.toString(),
              ],
            },
          ],
        },
      });

      setToAddress("");
      setAmount("");
      await Promise.all([refetchWallet(), refetchBalance()]);
      toast.success("Transfer submitted successfully.");
    },
    [
      amount,
      toAddress,
      walletAddress,
      wallet,
      storedSession,
      getBearerToken,
      executeWithSessionAsync,
      refetchWallet,
      refetchBalance,
    ]
  );

  const handleSubmit = async (e: FormEvent) => {
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
      toast.error("Invalid amount", {
        description: "Enter an amount greater than 0.",
      });
      return;
    }

    const hadSessionBypass = rememberSessionUiOn;
    let sessionExecuteAttempted = false;

    try {
      setIsSubmitting(true);

      const capCleared = await maybeClearSessionForAmountCap(numAmount);
      if (capCleared) {
        toast.info("Large transfer — fresh signing session", {
          description:
            "Your saved session was cleared. Registering a new session for this transfer size.",
        });
        if (hadSessionBypass) {
          toast.message("Enter PIN or passkey", {
            description:
              "This transfer needs your wallet key after the session was reset.",
          });
          setFallbackSignReason("session_error");
          setFallbackTransferOpen(true);
          return;
        }
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
        const suggested = authMethod === "pin" ? "passkey" : "pin";
        setEncryptionMismatchSuggestion(suggested);
      }

      toast.error("Transfer failed", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSessionUnlockAndSend = async (
    key: string,
    _opts?: PinDialogSubmitOptions
  ) => {
    setSessionUnlockOpen(false);
    setError(null);
    setEncryptionMismatchSuggestion(null);
    let sessionTried = false;
    try {
      setIsSubmitting(true);
      const numAmt = Number(amount);
      if (!Number.isFinite(numAmt) || numAmt <= 0) {
        toast.error("Invalid amount", {
          description: "Enter an amount greater than 0.",
        });
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
  };

  const handleFallbackTransfer = async (
    derivedEncryptKey: string,
    opts?: PinDialogSubmitOptions
  ) => {
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
        const suggested = opts?.usedPasskey ? "pin" : "passkey";
        setEncryptionMismatchSuggestion(suggested);
      }
      toast.error("Transfer failed", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinMigrationSubmit = async (oldEncryptKey: string) => {
    if (!wallet || !userId) {
      setIsPinMigrationDialogOpen(false);
      toast.error("Migration failed", {
        description: "Wallet or user session not found.",
      });
      return;
    }
    try {
      const bearerToken = await getBearerToken();
      if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

      const decryptedPkBytes = CryptoES.AES.decrypt(
        (wallet as WalletData).encryptedPrivateKey,
        oldEncryptKey
      );
      const decryptedPrivateKey = decryptedPkBytes.toString(CryptoES.enc.Utf8);
      if (!decryptedPrivateKey) {
        throw new Error("Incorrect PIN. Please try again.");
      }

      const passkeyData = await setupPasskey(userId, userId);
      const newEncryptedPrivateKey = CryptoES.AES.encrypt(
        decryptedPrivateKey,
        passkeyData.encryptKey
      ).toString();

      await updateWalletEncryptionAsync({
        externalUserId: userId,
        publicKey: (wallet as WalletData).publicKey,
        newEncryptedPrivateKey,
        bearerToken,
      });

      await Promise.all([refetchWallet(), refetchBalance()]);
      await clearSession();
      clearSessionUnlockKey();
      setAuthMethod("passkey");
      setPin("");
      setIsPinMigrationDialogOpen(false);
      toast.success("Wallet migrated to passkey.", {
        description: "You can now transfer using passkey authentication.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Migration failed";
      setError(msg);
      toast.error("Migration failed", { description: msg });
    }
  };

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

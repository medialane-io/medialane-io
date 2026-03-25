"use client";

import { useState, FormEvent, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { uint256 } from "starknet";
import { useWalletWithBalance } from "@/hooks/use-wallet-with-balance";
import { useSessionKey } from "@/hooks/use-session-key";
import { ChainToken, TransferHookInput, WalletData } from "@chipi-stack/types";
import {
  useTransfer,
  useExecuteWithSession,
  isWebAuthnSupported,
  useUpdateWalletEncryption,
} from "@chipi-stack/nextjs";
import { usePasskeyAuth, usePasskeySetup } from "@chipi-stack/chipi-passkey/hooks";
import CryptoES from "crypto-es";

import { PinDialog } from "@/components/chipi/pin-dialog";
import type { PinDialogSubmitOptions } from "@/components/chipi/pin-dialog";
import { SessionPreferencesSwitch } from "@/components/chipi/session-preferences-switch";
import { useChipiSessionUnlock } from "@/contexts/chipi-session-unlock-context";
import { SUPPORTED_TOKENS } from "@/lib/constants";
import { parseUsdcHumanToBaseUnits } from "@/lib/chipi/parse-usdc-amount";
import { toast } from "sonner";

export function ChipiWalletPanel() {
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
  const [isPinMigrationDialogOpen, setIsPinMigrationDialogOpen] =
    useState(false);
  const [fallbackTransferOpen, setFallbackTransferOpen] = useState(false);
  const [sessionUnlockOpen, setSessionUnlockOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionMismatchSuggestion, setEncryptionMismatchSuggestion] = useState<
    "pin" | "passkey" | null
  >(null);

  const loading = isLoadingWallet || isLoadingBalance;

  /** READY accounts do not support Chipi session keys; everything else is treated as session-capable (incl. legacy wallets without walletType). */
  const walletSupportsSessionKeys = !wallet || wallet.walletType !== "READY";

  /** Matches the Remember session switch — prefs saved in Clerk, independent of whether a session is registered yet. */
  const rememberSessionUiOn =
    sessionPreferences?.enabled === true && walletSupportsSessionKeys;

  /** Clerk has a non-expired chipiSession; enables executeWithSession after unlock key. */
  const hasRegisteredSigningSession = rememberSessionUiOn && hasActiveSession;

  type FallbackSignReason = "session_error" | "owner_sign";
  const [fallbackSignReason, setFallbackSignReason] =
    useState<FallbackSignReason>("session_error");

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

  const looksLikeEncryptionFailure = (message: string) => {
    const m = message.toLowerCase();
    return (
      m.includes("incorrect") ||
      m.includes("pin") ||
      m.includes("decrypt") ||
      m.includes("encryption") ||
      m.includes("encryptkey")
    );
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
      maybeClearSessionForAmountCap,
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
        throw new Error("No signing session on file. Register one in Remember session settings.");
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
              calldata: [toAddress, u256Parts.low.toString(), u256Parts.high.toString()],
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
      toast.error("Invalid amount", { description: "Enter an amount greater than 0." });
      return;
    }

    /** Remember session UX: inline PIN/passkey hidden; dialogs handle signing. */
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
          clearSessionUnlockKey();
          toast.message("Enter PIN or passkey", {
            description: "This transfer needs your wallet key after the session was reset.",
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

  /** PIN/passkey to decrypt session blob (e.g. after reload). Persists key in memory for later sends. */
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
        clearSessionUnlockKey();
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

  if (loading) {
    return (
      <section className="space-y-2 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Loading wallet…</p>
      </section>
    );
  }

  if (!hasWallet) {
    return (
      <section className="space-y-3 rounded-lg border border-dashed border-border bg-card p-4">
        <h2 className="text-base font-semibold">Chipi wallet</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have a Chipi wallet yet. Create one to start sending and
          receiving funds.
        </p>
        {/* TODO: replace with MCP-derived create-wallet component */}
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Chipi wallet</h2>
          <p className="text-xs text-muted-foreground">
            Self-custodial Starknet wallet powered by Chipi.
          </p>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            refetchWallet();
            refetchBalance();
          }}
        >
          Refresh
        </button>
      </header>

      <SessionPreferencesSwitch variant="compact" className="mb-1" />

      <div className="space-y-3 rounded-md bg-muted px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-muted-foreground">Address</span>
          <code className="truncate text-[11px]">{walletAddress}</code>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-muted-foreground">Balance</span>
          <span className="font-mono text-sm">
            {balance ?? "0.0000"}
          </span>
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {rememberSessionUiOn ? (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Auth</span>
            {hasRegisteredSigningSession ? (
              <>
                <p className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground">
                  Session active — sends use your saved signing session when you confirm in the dialog.
                </p>
                {!sessionUnlockKey ? (
                  <p className="text-[11px] text-muted-foreground">
                    After a page reload, tap Send and enter PIN or passkey once in the dialog. Or use
                    &quot;Save &amp; register session now&quot; in Remember session to skip that until you
                    reload.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground">
                Remember session is on — use &quot;Save &amp; register session now&quot; in the panel above,
                or tap Send and sign once with PIN or passkey (we&apos;ll create a signing session for next
                time).
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-xs font-medium">Auth method</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={[
                  "rounded-md border px-2 py-1 text-xs",
                  authMethod === "pin"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                ].join(" ")}
                onClick={() => setAuthMethod("pin")}
              >
                Use PIN
              </button>
              <button
                type="button"
                disabled={!passkeySupported}
                className={[
                  "rounded-md border px-2 py-1 text-xs",
                  authMethod === "passkey"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-60",
                ].join(" ")}
                onClick={() => setAuthMethod("passkey")}
              >
                Use passkey
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="toAddress" className="text-xs font-medium">Recipient address</label>
          <input
            id="toAddress"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-0 focus-visible:border-primary"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="amount" className="text-xs font-medium">Amount</label>
            <input
              id="amount"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-0 focus-visible:border-primary"
              type="number"
              min="0"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              required
            />
          </div>
          {!rememberSessionUiOn && authMethod === "pin" && (
            <div className="flex-1 space-y-1">
              <label htmlFor="pin" className="text-xs font-medium">PIN</label>
              <input
                id="pin"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-0 focus-visible:border-primary"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Required to sign"
                required
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {encryptionMismatchSuggestion && (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-xs font-medium text-destructive">
              Transfer failed due to an encryption mismatch.
            </p>
            {encryptionMismatchSuggestion === "passkey" ? (
              <p className="text-xs text-destructive/90">
                Are you sure you created this wallet with a PIN?
                Try passkey instead.
              </p>
            ) : (
              <p className="text-xs text-destructive/90">
                Are you sure you created this wallet with a passkey?
                Try PIN instead.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMethod(encryptionMismatchSuggestion)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:text-foreground"
              >
                Switch to {encryptionMismatchSuggestion === "pin" ? "PIN" : "passkey"}
              </button>
              <button
                type="button"
                onClick={() => setEncryptionMismatchSuggestion(null)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            isTransferring ||
            isSessionExecuting ||
            !toAddress ||
            !amount ||
            (!rememberSessionUiOn && authMethod === "pin" ? !pin : false)
          }
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting || isSessionExecuting ? "Sending…" : "Send funds"}
        </button>
      </form>

      <div className="space-y-2 pt-2">
        <p className="text-[11px] text-muted-foreground">
          Want passkey support for PIN-protected wallets?
        </p>
        <button
          type="button"
          disabled={!wallet || !userId || !passkeySupported || isUpdatingEncryption}
          onClick={() => {
            if (!wallet) return;
            if (!userId) return;
            setError(null);
            setIsPinMigrationDialogOpen(true);
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs hover:text-foreground disabled:opacity-60"
        >
          Migrate PIN wallet to passkey
        </button>
      </div>

      <PinDialog
        open={sessionUnlockOpen}
        onCancel={() => setSessionUnlockOpen(false)}
        onSubmit={(key, opts) => handleSessionUnlockAndSend(key, opts)}
        title="Unlock signing session"
        description="Enter the PIN or passkey you use for this wallet — the same one you used when you registered the session."
      />

      <PinDialog
        open={fallbackTransferOpen}
        onCancel={() => setFallbackTransferOpen(false)}
        onSubmit={(key, opts) => handleFallbackTransfer(key, opts)}
        title="Sign this transfer"
        description={
          fallbackSignReason === "owner_sign"
            ? "Remember session is on, but no signing session is saved yet. Enter your PIN or passkey to send; we will register a signing session for your next transfers."
            : "Something went wrong with the signing session. Enter your PIN or use your passkey to send with your wallet key."
        }
      />

      <PinDialog
        open={isPinMigrationDialogOpen}
        onCancel={() => setIsPinMigrationDialogOpen(false)}
        onSubmit={async (oldEncryptKey) => {
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
            const normalizedPrivateKey = decryptedPrivateKey.startsWith("0x")
              ? decryptedPrivateKey.slice(2)
              : decryptedPrivateKey;
            const isValidHexPrivateKey = /^[0-9a-fA-F]{64}$/.test(normalizedPrivateKey);
            if (!decryptedPrivateKey || !isValidHexPrivateKey) {
              setError("Incorrect PIN. Please try again.");
              setIsSubmitting(false);
              return;
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
            } );

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
        }}
        title="Enter your wallet PIN"
        description="Your wallet is PIN-protected. Enter your PIN to migrate this wallet to passkey."
        allowPasskey={false}
      />
    </section>
  );
}

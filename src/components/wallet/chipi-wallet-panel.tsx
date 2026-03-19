"use client";

import { useState, FormEvent, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWalletWithBalance } from "@/hooks/use-wallet-with-balance";
import { useSessionKey } from "@/hooks/use-session-key";
import { ChainToken } from "@chipi-stack/types";
import {
  useTransfer,
  isWebAuthnSupported,
  useMigrateWalletToPasskey,
} from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";

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
  } = useWalletWithBalance();

  const { userId, getToken } = useAuth();
  const { hasActiveSession, setupSession, clearSession } = useSessionKey();

  const { transferAsync, isLoading: isTransferring } = useTransfer();
  const { authenticate, encryptKey } = usePasskeyAuth();
  const { migrateWalletToPasskeyAsync, isLoading: isMigrating } =
    useMigrateWalletToPasskey();

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );

  const [authMethod, setAuthMethod] = useState<"pin" | "passkey">("pin");

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionMismatchSuggestion, setEncryptionMismatchSuggestion] = useState<
    "pin" | "passkey" | null
  >(null);

  const loading = isLoadingWallet || isLoadingBalance;

  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );

  const ensureSession = async (encryptKey: string) => {
    if (hasActiveSession) return;
    await setupSession(encryptKey);
  };

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

    try {
      setIsSubmitting(true);

      const bearerToken = await getBearerToken();
      if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

      const encryptKey = await getEncryptKey();
      await ensureSession(encryptKey);

      const publicKey =
        // ChipiPay wallet data can expose different public key field names.
        (wallet as any)?.publicKey ??
        (wallet as any)?.walletPublicKey ??
        walletAddress;

      const resultTxHash = await transferAsync({
        bearerToken,
        params: {
          amount: Number(amount),
          recipient: toAddress,
          token: ChainToken.USDC,
          encryptKey,
          usePasskey: authMethod === "passkey",
          ...(authMethod === "passkey" ? { externalUserId: userId } : {}),
          wallet: {
            publicKey,
            encryptedPrivateKey: (wallet as any)?.encryptedPrivateKey,
          },
        } as any,
      });

      setToAddress("");
      setAmount("");

      await Promise.all([refetchWallet(), refetchBalance()]);

      const txHash =
        typeof resultTxHash === "string" ? resultTxHash : undefined;
      toast.success("Transfer submitted successfully.", {
        description: txHash ? `Tx hash: ${txHash}` : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
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

        <div className="space-y-1">
          <label className="text-xs font-medium">Recipient address</label>
          <input
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-0 focus-visible:border-primary"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium">Amount</label>
            <input
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
          {authMethod === "pin" && (
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium">PIN</label>
              <input
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
            !toAddress ||
            !amount ||
            (authMethod === "pin" ? !pin : false)
          }
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send funds"}
        </button>
      </form>

      <div className="space-y-2 pt-2">
        <p className="text-[11px] text-muted-foreground">
          Want passkey support for PIN-protected wallets?
        </p>
        <button
          type="button"
          disabled={!wallet || !userId || !passkeySupported || isMigrating}
          onClick={async () => {
            if (!wallet) return;
            if (!userId) return;
            if (!pin) {
              toast.error("PIN required to migrate.", {
                description: "Enter your wallet PIN above (Use PIN) to migrate this wallet to passkey.",
              });
              return;
            }
            setError(null);

            try {
              const bearerToken = await getBearerToken();
              if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

              await migrateWalletToPasskeyAsync({
                wallet: wallet as any,
                oldEncryptKey: pin,
                externalUserId: userId,
                bearerToken,
              } as any);

              await Promise.all([refetchWallet(), refetchBalance()]);
              await clearSession();
              setAuthMethod("passkey");
              toast.success("Wallet migrated to passkey.", {
                description: "You can now transfer using passkey authentication.",
              });
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Migration failed";
              setError(msg);
              toast.error("Migration failed", { description: msg });
            }
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs hover:text-foreground disabled:opacity-60"
        >
          Migrate PIN wallet to passkey
        </button>
      </div>
    </section>
  );
}


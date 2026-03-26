"use client";

import type { FormEvent } from "react";

type Props = {
  rememberSessionUiOn: boolean;
  hasRegisteredSigningSession: boolean;
  sessionUnlockKey: string | null;
  authMethod: "pin" | "passkey";
  setAuthMethod: (m: "pin" | "passkey") => void;
  passkeySupported: boolean;
  toAddress: string;
  setToAddress: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  pin: string;
  setPin: (v: string) => void;
  error: string | null;
  encryptionMismatchSuggestion: "pin" | "passkey" | null;
  setEncryptionMismatchSuggestion: (v: "pin" | "passkey" | null) => void;
  isSubmitting: boolean;
  isTransferring: boolean;
  isSessionExecuting: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function ChipiWalletTransferForm({
  rememberSessionUiOn,
  hasRegisteredSigningSession,
  sessionUnlockKey,
  authMethod,
  setAuthMethod,
  passkeySupported,
  toAddress,
  setToAddress,
  amount,
  setAmount,
  pin,
  setPin,
  error,
  encryptionMismatchSuggestion,
  setEncryptionMismatchSuggestion,
  isSubmitting,
  isTransferring,
  isSessionExecuting,
  onSubmit,
}: Props) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {rememberSessionUiOn ? (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Auth</span>
          {hasRegisteredSigningSession ? (
            <>
              <p className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground">
                Session active — sends use your saved signing session when you confirm in the
                dialog.
              </p>
              {!sessionUnlockKey ? (
                <p className="text-[11px] text-muted-foreground">
                  If asked, confirm once with PIN or passkey to unlock session signing in this tab.
                </p>
              ) : null}
            </>
          ) : (
            <p className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground">
              Remember session is on — use &quot;Save &amp; register session now&quot; in the panel
              above, or tap Send and sign once with PIN or passkey (we&apos;ll create a signing
              session for next time).
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
        <label htmlFor="toAddress" className="text-xs font-medium">
          Recipient address
        </label>
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
          <label htmlFor="amount" className="text-xs font-medium">
            Amount
          </label>
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
            <label htmlFor="pin" className="text-xs font-medium">
              PIN
            </label>
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
              Are you sure you created this wallet with a PIN? Try passkey instead.
            </p>
          ) : (
            <p className="text-xs text-destructive/90">
              Are you sure you created this wallet with a passkey? Try PIN instead.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEncryptionMismatchSuggestion(encryptionMismatchSuggestion)}
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
  );
}

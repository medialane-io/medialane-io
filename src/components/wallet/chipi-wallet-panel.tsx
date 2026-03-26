"use client";

import { PinDialog } from "@/components/chipi/pin-dialog";
import { SessionPreferencesSwitch } from "@/components/chipi/session-preferences-switch";
import { ChipiWalletTransferForm } from "@/components/wallet/chipi-wallet-transfer-form";
import { useChipiWalletPanel } from "@/hooks/use-chipi-wallet-panel";

export function ChipiWalletPanel() {
  const p = useChipiWalletPanel();

  if (p.loading) {
    return (
      <section className="space-y-2 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Loading wallet…</p>
      </section>
    );
  }

  if (!p.hasWallet) {
    return (
      <section className="space-y-3 rounded-lg border border-dashed border-border bg-card p-4">
        <h2 className="text-base font-semibold">Chipi wallet</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have a Chipi wallet yet. Create one to start sending and receiving funds.
        </p>
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
            p.refetchWallet();
            p.refetchBalance();
          }}
        >
          Refresh
        </button>
      </header>

      <SessionPreferencesSwitch variant="compact" className="mb-1" />

      <div className="space-y-3 rounded-md bg-muted px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-muted-foreground">Address</span>
          <code className="truncate text-[11px]">{p.walletAddress}</code>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-muted-foreground">Balance</span>
          <span className="font-mono text-sm">{p.balance ?? "0.0000"}</span>
        </div>
      </div>

      <ChipiWalletTransferForm
        rememberSessionUiOn={p.rememberSessionUiOn}
        hasRegisteredSigningSession={p.hasRegisteredSigningSession}
        sessionUnlockKey={p.sessionUnlockKey}
        authMethod={p.authMethod}
        setAuthMethod={p.setAuthMethod}
        passkeySupported={p.passkeySupported}
        toAddress={p.toAddress}
        setToAddress={p.setToAddress}
        amount={p.amount}
        setAmount={p.setAmount}
        pin={p.pin}
        setPin={p.setPin}
        error={p.error}
        encryptionMismatchSuggestion={p.encryptionMismatchSuggestion}
        setEncryptionMismatchSuggestion={p.setEncryptionMismatchSuggestion}
        isSubmitting={p.isSubmitting}
        isTransferring={p.isTransferring}
        isSessionExecuting={p.isSessionExecuting}
        onSubmit={p.handleSubmit}
      />

      <div className="space-y-2 pt-2">
        <p className="text-[11px] text-muted-foreground">
          Want passkey support for PIN-protected wallets?
        </p>
        <button
          type="button"
          disabled={
            !p.wallet || !p.userId || !p.passkeySupported || p.isUpdatingEncryption
          }
          onClick={() => {
            if (!p.wallet) return;
            if (!p.userId) return;
            p.setError(null);
            p.setIsPinMigrationDialogOpen(true);
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs hover:text-foreground disabled:opacity-60"
        >
          Migrate PIN wallet to passkey
        </button>
      </div>

      <PinDialog
        open={p.sessionUnlockOpen}
        onCancel={() => p.setSessionUnlockOpen(false)}
        onSubmit={(key, opts) => p.handleSessionUnlockAndSend(key, opts)}
        title="Unlock signing session"
        description="Enter the PIN or passkey you use for this wallet — the same one you used when you registered the session."
      />

      <PinDialog
        open={p.fallbackTransferOpen}
        onCancel={() => p.setFallbackTransferOpen(false)}
        onSubmit={(key, opts) => p.handleFallbackTransfer(key, opts)}
        title="Sign this transfer"
        description={
          p.fallbackSignReason === "owner_sign"
            ? "Remember session is on, but no signing session is saved yet. Enter your PIN or passkey to send; we will register a signing session for your next transfers."
            : "Something went wrong with the signing session. Enter your PIN or use your passkey to send with your wallet key."
        }
      />

      <PinDialog
        open={p.isPinMigrationDialogOpen}
        onCancel={() => p.setIsPinMigrationDialogOpen(false)}
        onSubmit={(oldEncryptKey) => void p.handlePinMigrationSubmit(oldEncryptKey)}
        title="Enter your wallet PIN"
        description="Your wallet is PIN-protected. Enter your PIN to migrate this wallet to passkey."
        allowPasskey={false}
      />
    </section>
  );
}

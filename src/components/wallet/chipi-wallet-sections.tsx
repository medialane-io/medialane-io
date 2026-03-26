"use client";

import { PinDialog } from "@/components/chipi/pin-dialog";
import type { PinDialogSubmitOptions } from "@/components/chipi/pin-dialog";

type FallbackSignReason = "session_error" | "owner_sign";

export function ChipiWalletHeader({
  onRefresh,
}: {
  onRefresh: () => void;
}) {
  return (
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
        onClick={onRefresh}
      >
        Refresh
      </button>
    </header>
  );
}

export function ChipiWalletSummary({
  walletAddress,
  balance,
}: {
  walletAddress: string | null;
  balance: string | null;
}) {
  return (
    <div className="space-y-3 rounded-md bg-muted px-4 py-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-muted-foreground">Address</span>
        <code className="truncate text-[11px]">{walletAddress}</code>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-muted-foreground">Balance</span>
        <span className="font-mono text-sm">{balance ?? "0.0000"}</span>
      </div>
    </div>
  );
}

export function ChipiWalletPasskeyMigrationCta({
  disabled,
  onOpen,
}: {
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="space-y-2 pt-2">
      <p className="text-[11px] text-muted-foreground">
        Want passkey support for PIN-protected wallets?
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs hover:text-foreground disabled:opacity-60"
      >
        Migrate PIN wallet to passkey
      </button>
    </div>
  );
}

export function ChipiWalletDialogs({
  sessionUnlockOpen,
  setSessionUnlockOpen,
  handleSessionUnlockAndSend,
  fallbackTransferOpen,
  setFallbackTransferOpen,
  handleFallbackTransfer,
  fallbackSignReason,
  isPinMigrationDialogOpen,
  setIsPinMigrationDialogOpen,
  handlePinMigrationSubmit,
}: {
  sessionUnlockOpen: boolean;
  setSessionUnlockOpen: (open: boolean) => void;
  handleSessionUnlockAndSend: (key: string, opts?: PinDialogSubmitOptions) => Promise<void>;
  fallbackTransferOpen: boolean;
  setFallbackTransferOpen: (open: boolean) => void;
  handleFallbackTransfer: (key: string, opts?: PinDialogSubmitOptions) => Promise<void>;
  fallbackSignReason: FallbackSignReason;
  isPinMigrationDialogOpen: boolean;
  setIsPinMigrationDialogOpen: (open: boolean) => void;
  handlePinMigrationSubmit: (oldEncryptKey: string) => Promise<void>;
}) {
  return (
    <>
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
        onSubmit={(oldEncryptKey) => void handlePinMigrationSubmit(oldEncryptKey)}
        title="Enter your wallet PIN"
        description="Your wallet is PIN-protected. Enter your PIN to migrate this wallet to passkey."
        allowPasskey={false}
      />
    </>
  );
}

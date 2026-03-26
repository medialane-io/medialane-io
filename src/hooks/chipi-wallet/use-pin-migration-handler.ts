"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { WalletData } from "@chipi-stack/types";
import { migratePinWalletToPasskey } from "@/lib/chipi/wallet/migrate-pin-wallet-to-passkey";

type Params = {
  wallet: WalletData | null;
  userId: string | null;
  getBearerToken: () => Promise<string | null>;
  setupPasskey: (userName: string, userId: string) => Promise<{ encryptKey: string }>;
  updateWalletEncryptionAsync: (args: any) => Promise<any>;
  refetchWallet: () => Promise<any>;
  refetchBalance: () => Promise<any>;
  clearSession: () => Promise<void>;
  clearSessionUnlockKey: () => void;
  setAuthMethod: (m: "pin" | "passkey") => void;
  setPin: (value: string) => void;
  setIsPinMigrationDialogOpen: (open: boolean) => void;
  setError: (value: string | null) => void;
};

export function usePinMigrationHandler(params: Params) {
  const {
    wallet,
    userId,
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
  } = params;

  const handlePinMigrationSubmit = useCallback(
    async (oldEncryptKey: string) => {
      if (!wallet || !userId) {
        setIsPinMigrationDialogOpen(false);
        toast.error("Migration failed", {
          description: "Wallet or user session not found.",
        });
        return;
      }
      try {
        await migratePinWalletToPasskey({
          wallet,
          userId,
          oldEncryptKey,
          getBearerToken,
          setupPasskey,
          updateWalletEncryptionAsync,
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
    },
    [
      wallet,
      userId,
      setIsPinMigrationDialogOpen,
      getBearerToken,
      setupPasskey,
      updateWalletEncryptionAsync,
      refetchWallet,
      refetchBalance,
      clearSession,
      clearSessionUnlockKey,
      setAuthMethod,
      setPin,
      setError,
    ]
  );

  return { handlePinMigrationSubmit };
}


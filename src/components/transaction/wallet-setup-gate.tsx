"use client";

import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import type { WriteAction } from "@/hooks/use-write-action";

/**
 * Renders the first-time wallet-setup dialog for a write flow and, on success,
 * automatically re-runs the action the user was attempting. Lets flows drop
 * their own `<WalletSetupDialog onSuccess={…re-run…}>` boilerplate — just
 * render `<WalletSetupGate action={action} />` once.
 */
export function WalletSetupGate({ action }: { action: WriteAction }) {
  return (
    <WalletSetupDialog
      open={action.walletSetupOpen}
      onOpenChange={action.setWalletSetupOpen}
      onSuccess={() => {
        action.setWalletSetupOpen(false);
        action.rerunAfterWalletSetup();
      }}
    />
  );
}

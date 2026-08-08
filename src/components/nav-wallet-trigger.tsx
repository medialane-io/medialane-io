"use client";

import { Wallet } from "lucide-react";
import { NavWalletTrigger as SharedNavWalletTrigger } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";

/**
 * The global header's top-right account entry point (fixed, mirrors
 * `NavBrandButton` on the left). Clicking opens the wallet panel overlay —
 * the ported media-wallet UI (2026-08-08) — which covers everything the old
 * `AccountPanel` sheet did (no-wallet state, undeployed/resume state,
 * address) plus the real wallet screens (balances, send/receive, activity)
 * that sheet never had.
 */
export function HeaderWalletTrigger() {
  const { hasWallet } = useWalletNativeSession();
  const { open } = useWalletPanel();

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      disconnectedIcon={<Wallet className="h-3.5 w-3.5" />}
      onClick={open}
    />
  );
}

"use client";

import { ShieldUser, Wallet } from "lucide-react";
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
 *
 * Connected-state glyph is a shield-user, not the shared component's plain
 * user default — io's account is a self-custody key, not a connected
 * third-party wallet, so the icon should read that way (2026-08-08).
 */
export function HeaderWalletTrigger() {
  const { hasWallet } = useWalletNativeSession();
  const { open } = useWalletPanel();

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      disconnectedIcon={<Wallet className="h-3.5 w-3.5" />}
      connectedIcon={<ShieldUser className="h-3.5 w-3.5" style={{ color: "hsl(var(--brand-blue))" }} />}
      onClick={open}
    />
  );
}

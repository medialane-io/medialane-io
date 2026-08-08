"use client";

import { Wallet } from "lucide-react";
import { NavWalletTrigger as SharedNavWalletTrigger } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";
import { UserShieldIcon } from "@/components/icons/user-shield-icon";

/**
 * The global header's top-right account entry point (fixed, mirrors
 * `NavBrandButton` on the left). Clicking opens the wallet panel overlay —
 * the ported media-wallet UI (2026-08-08) — which covers everything the old
 * `AccountPanel` sheet did (no-wallet state, undeployed/resume state,
 * address) plus the real wallet screens (balances, send/receive, activity)
 * that sheet never had.
 *
 * Connected-state glyph is a user-shield (person-primary, shield badge —
 * not the shield-primary composition), sized up (18px vs the shared
 * component's 14px default) to sit closer to the ring's edge instead of
 * floating in a lot of empty padding (2026-08-08).
 */
export function HeaderWalletTrigger() {
  const { hasWallet } = useWalletNativeSession();
  const { open } = useWalletPanel();

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      disconnectedIcon={<Wallet className="h-3.5 w-3.5" />}
      connectedIcon={<UserShieldIcon className="h-[18px] w-[18px]" style={{ color: "hsl(var(--brand-blue))" }} />}
      onClick={open}
    />
  );
}

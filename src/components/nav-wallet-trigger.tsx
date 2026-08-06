"use client";

import { Wallet } from "lucide-react";
import { NavWalletTrigger as SharedNavWalletTrigger, useNavAccountSheet } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

/**
 * The global header's top-right account entry point (fixed, mirrors
 * `NavBrandButton` on the left) — mirrors medialane-starknet's
 * `HeaderWalletTrigger`, adapted for the wallet-native MediaWallet (no
 * browser wallet connector here). Clicking always opens the account sheet
 * (`AccountPanel`) — signed-out and signed-in states are both handled
 * inside that panel (set up vs. address + remove-from-device).
 */
export function HeaderWalletTrigger() {
  const { hasWallet } = useWalletNativeSession();
  const { open: openAccountSheet } = useNavAccountSheet();

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      disconnectedIcon={<Wallet className="h-3.5 w-3.5" />}
      onClick={openAccountSheet}
    />
  );
}

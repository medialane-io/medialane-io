"use client";

import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavWalletTrigger as SharedNavWalletTrigger } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";
import { UserShieldIcon } from "@/components/icons/user-shield-icon";

/**
 * The global header's top-right account entry point (fixed, mirrors
 * `NavBrandButton` on the left). State-aware, not a single fixed
 * destination: no account yet -> straight to /connect; a stranded
 * undeployed key -> straight to /wallet-onboarding to auto-resume; only a
 * fully deployed wallet opens the wallet panel overlay. No intermediate
 * "Set up account" / "Finish setting up" button screen for either
 * no-wallet case — the click on this ring itself is the only click.
 *
 * Connected-state glyph is a user-shield (person-primary, shield badge —
 * not the shield-primary composition), sized up (18px vs the shared
 * component's 14px default) to sit closer to the ring's edge instead of
 * floating in a lot of empty padding (2026-08-08).
 */
export function HeaderWalletTrigger() {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const { open } = useWalletPanel();
  const router = useRouter();

  const handleClick = () => {
    if (!hasWallet) {
      router.push("/connect");
    } else if (isDeployed === false) {
      router.push("/wallet-onboarding");
    } else {
      open();
    }
  };

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      disconnectedIcon={<Wallet className="h-3.5 w-3.5" />}
      connectedIcon={<UserShieldIcon className="h-[18px] w-[18px]" style={{ color: "hsl(var(--brand-blue))" }} />}
      onClick={handleClick}
    />
  );
}

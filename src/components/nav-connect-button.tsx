"use client";

import Link from "next/link";
import { useNavCommandMenu } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";
import { UserShieldIcon } from "@/components/icons/user-shield-icon";

/**
 * Replaces the command menu footer's static "medialane" text (NavCommandMenu's
 * `brandSlot`) with a wallet entry point — mirrors medialane-starknet's
 * `NavConnectButton`, adapted to this app's own account state machine (same
 * one `HeaderWalletTrigger` uses): no account yet -> /connect; a stranded
 * undeployed key -> /wallet-onboarding to resume; a fully set-up wallet ->
 * opens the wallet panel overlay in place. The "⌘K" shortcut hint stays
 * regardless of state.
 *
 * The two "needs setup" states get the filled brand-gradient CTA
 * (`.btn-border-animated` as a 1px wrapper around a transparent-fill button
 * — the same technique `GradientButton` uses, sized for this footer slot).
 * The connected state reads "Connect" too and gets a solid brand-blue fill
 * with a white icon, so the footer entry point stays visually consistent
 * regardless of session state. Icon is the same user-shield glyph
 * `HeaderWalletTrigger` uses in every state, connected or not.
 */
export function NavConnectButton() {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const { close: closeMenu } = useNavCommandMenu();
  const { open: openWalletPanel } = useWalletPanel();

  if (!hasWallet) {
    return (
      <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground/50">
        <div className="btn-border-animated rounded-lg p-[1px]">
          <Link
            href="/connect"
            onClick={closeMenu}
            className="flex items-center gap-1.5 rounded-[7px] bg-transparent px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <UserShieldIcon className="h-3 w-3" />
            Connect
          </Link>
        </div>
        <Kbd />
      </span>
    );
  }

  if (isDeployed === false) {
    return (
      <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground/50">
        <div className="btn-border-animated rounded-lg p-[1px]">
          <Link
            href="/wallet-onboarding"
            onClick={closeMenu}
            className="flex items-center gap-1.5 rounded-[7px] bg-transparent px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <UserShieldIcon className="h-3 w-3" />
            Finish setup
          </Link>
        </div>
        <Kbd />
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground/50">
      <button
        type="button"
        onClick={() => {
          closeMenu();
          openWalletPanel();
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: "hsl(var(--brand-blue))" }}
      >
        <UserShieldIcon className="h-3 w-3 text-white" />
        Connect
      </button>
      <Kbd />
    </span>
  );
}

function Kbd() {
  return (
    <kbd className="hidden min-w-[18px] items-center justify-center rounded-md bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground sm:inline-flex">
      ⌘K
    </kbd>
  );
}

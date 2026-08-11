"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useNavCommandMenu } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

/**
 * Replaces the command menu footer's static "medialane" text (NavCommandMenu's
 * `brandSlot`) with a "Set up account" entry point when there's no wallet yet
 * — mirrors medialane-starknet's `NavConnectButton`. The "⌘K" shortcut hint
 * stays regardless of wallet state — only the brand label itself was meant
 * to go. Once a wallet exists, only the hint remains; the top-right
 * `HeaderWalletTrigger` covers account/remove-wallet.
 *
 * Filled brand-gradient treatment (`.btn-border-animated` as a 1px wrapper
 * around a transparent-fill button — the same technique `GradientButton`
 * uses, just sized for this compact footer slot) rather than the bordered
 * `.ml-gbtn` ring — this is the primary "set up your account" entry point.
 */
export function NavConnectButton() {
  const { hasWallet } = useWalletNativeSession();
  const { close } = useNavCommandMenu();

  return (
    <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground/50">
      {!hasWallet && (
        <div className="btn-border-animated rounded-lg p-[1px]">
          <Link
            href="/connect"
            onClick={close}
            className="flex items-center gap-1.5 rounded-[7px] bg-transparent px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Wallet className="h-3 w-3" />
            Set up account
          </Link>
        </div>
      )}
      <kbd className="hidden min-w-[18px] items-center justify-center rounded-md bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>
    </span>
  );
}

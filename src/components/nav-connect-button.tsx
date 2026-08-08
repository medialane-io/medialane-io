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
 */
export function NavConnectButton() {
  const { hasWallet } = useWalletNativeSession();
  const { close } = useNavCommandMenu();

  return (
    <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground/50">
      {!hasWallet && (
        <Link
          href="/connect"
          onClick={close}
          className="ml-gbtn relative flex items-center gap-1.5 rounded-lg bg-transparent px-2.5 py-1 text-[11px] font-semibold text-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ "--ml-grad": "conic-gradient(from 0deg, #3b7bff, #8a5cf6, #f6608f, #3b7bff)" } as React.CSSProperties}
        >
          <Wallet className="h-3 w-3" />
          Set up account
        </Link>
      )}
      <kbd className="hidden min-w-[18px] items-center justify-center rounded-md bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>
    </span>
  );
}

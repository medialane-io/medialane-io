"use client";

import { LogIn } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useNavCommandMenu } from "@medialane/ui";

/**
 * Replaces the command menu footer's static "medialane" text (NavCommandMenu's
 * `brandSlot`) with a "Sign in" entry point when signed out — mirrors
 * medialane-starknet's `NavConnectButton`, adapted for Clerk instead of a
 * wallet connector. The "⌘K" shortcut hint stays regardless of sign-in state
 * — only the brand label itself was meant to go. Once signed in, only the
 * hint remains; the top-right `HeaderWalletTrigger` covers account/sign-out.
 */
export function NavConnectButton() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { close } = useNavCommandMenu();

  return (
    <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground/50">
      {!isSignedIn && (
        <button
          type="button"
          onClick={() => {
            close();
            openSignIn();
          }}
          className="ml-gbtn relative flex items-center gap-1.5 rounded-lg bg-transparent px-2.5 py-1 text-[11px] font-semibold text-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ "--ml-grad": "conic-gradient(from 0deg, #3b7bff, #8a5cf6, #f6608f, #3b7bff)" } as React.CSSProperties}
        >
          <LogIn className="h-3 w-3" />
          Sign in
        </button>
      )}
      <kbd className="hidden min-w-[18px] items-center justify-center rounded-md bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>
    </span>
  );
}

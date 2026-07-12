"use client";

import * as React from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useNavCommandMenu } from "@medialane/ui";
import { LogOut, User, Wallet } from "lucide-react";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useSessionKey } from "@/hooks/use-session-key";

export function NavAccountPanel() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn, openSignUp, signOut } = useClerk();
  const { close } = useNavCommandMenu();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const [walletSetupOpen, setWalletSetupOpen] = React.useState(false);

  if (!isLoaded) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
        <div className="mt-2 h-8 w-full animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-xl bg-muted/20 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              close();
              openSignIn();
            }}
            className="h-10 rounded-full border border-border/50 px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/50 active:scale-[0.98]"
          >
            Sign in
          </button>
          <button
            onClick={() => {
              close();
              openSignUp();
            }}
            className="h-10 rounded-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-rose px-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Create account
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Medialane account";

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/70 text-muted-foreground">
            <User className="h-3.5 w-3.5" />
          </div>
        )}
        <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
        {!(hasWallet || walletAddress) && (
          <button
            onClick={() => setWalletSetupOpen(true)}
            disabled={isLoadingWallet}
            className="ml-1 shrink-0 rounded-lg border border-border/50 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-muted/50 disabled:opacity-60"
          >
            <Wallet className="h-3 w-3 inline mr-1" />
            {isLoadingWallet ? "..." : "Setup"}
          </button>
        )}
        <button
          onClick={() => { close(); void signOut({ redirectUrl: "/" }); }}
          className="ml-auto shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => setWalletSetupOpen(false)}
      />
    </>
  );
}

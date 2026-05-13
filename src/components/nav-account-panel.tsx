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
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/70 text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Connect account</p>
            <p className="text-xs text-muted-foreground">Clerk + ChipiPay wallet</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              close();
              openSignIn();
            }}
            className="h-9 rounded-lg border border-border/50 px-3 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            Sign in
          </button>
          <button
            onClick={() => {
              close();
              openSignUp();
            }}
            className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-400 shrink-0">
          Clerk
        </span>
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

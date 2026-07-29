"use client";

import * as React from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay, useNavAccountSheet } from "@medialane/ui";
import { useSessionKey } from "@/hooks/use-session-key";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";

/**
 * The account panel content — identity, wallet address, and sign out.
 * Rendered inside `<NavAccountSheet>`, opened by the header's top-right
 * `NavWalletTrigger`. No app navigation here by design — the command menu
 * already covers that. Mirrors medialane-starknet's `AccountPanel`, adapted
 * for Clerk + ChipiPay identity instead of a browser wallet connector.
 */
export function AccountPanel() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { close } = useNavAccountSheet();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const [walletSetupOpen, setWalletSetupOpen] = React.useState(false);

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  const displayName =
    user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Medialane account";

  const handleSignOut = () => {
    close();
    void signOut({ redirectUrl: "/" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Wallet className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{displayName}</h3>
          {walletAddress ? (
            <AddressDisplay address={walletAddress} chars={4} className="mt-1 text-xs text-muted-foreground" />
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No wallet yet</p>
          )}
        </div>
      </div>

      {!(hasWallet || walletAddress) && (
        <Button
          onClick={() => setWalletSetupOpen(true)}
          disabled={isLoadingWallet}
          variant="outline"
          className="w-full gap-2"
        >
          <Wallet className="h-4 w-4" />
          {isLoadingWallet ? "Loading…" : "Set up wallet"}
        </Button>
      )}

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => setWalletSetupOpen(false)}
      />
    </div>
  );
}

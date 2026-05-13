"use client";

import * as React from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useNavCommandMenu } from "@medialane/ui";
import { Briefcase, LogOut, Settings, User, Wallet } from "lucide-react";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useSessionKey } from "@/hooks/use-session-key";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function AccountLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const { close } = useNavCommandMenu();

  return (
    <Link
      href={href}
      onClick={close}
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </Link>
  );
}

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
  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <>
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="flex items-start gap-3">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/70 text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {walletAddress ? shortenAddress(walletAddress) : email ?? "Signed in"}
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            Clerk
          </span>
        </div>

        {hasWallet || walletAddress ? (
          <div className="mt-3 grid grid-cols-3 gap-1">
            <AccountLink href="/portfolio" icon={Briefcase}>Portfolio</AccountLink>
            <AccountLink href="/portfolio/wallet" icon={Wallet}>Wallet</AccountLink>
            <AccountLink href="/portfolio/settings" icon={Settings}>Settings</AccountLink>
          </div>
        ) : (
          <button
            onClick={() => setWalletSetupOpen(true)}
            disabled={isLoadingWallet}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wallet className="h-3.5 w-3.5" />
            {isLoadingWallet ? "Checking wallet..." : "Set up ChipiPay wallet"}
          </button>
        )}

        <button
          onClick={() => {
            close();
            void signOut({ redirectUrl: "/" });
          }}
          className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border/50 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
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

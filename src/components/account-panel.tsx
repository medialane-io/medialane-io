"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressDisplay, useNavAccountSheet } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { clearSealedOwner } from "@/lib/wallet/store";

/**
 * The account panel content — wallet address and remove-from-device.
 * Rendered inside `<NavAccountSheet>`, opened by the header's top-right
 * `NavWalletTrigger`. No app navigation here by design — the command menu
 * already covers that. Mirrors medialane-starknet's `AccountPanel`.
 */
export function AccountPanel() {
  const { close } = useNavAccountSheet();
  const { address, hasWallet } = useWalletNativeSession();

  if (!hasWallet) {
    return (
      <div className="space-y-3 text-center py-4">
        <Wallet className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Let&apos;s secure your account to get started.</p>
        <div className="btn-border-animated p-[1px] rounded-lg">
          <Button
            asChild
            className="w-full gap-2 bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
            onClick={close}
          >
            <Link href="/wallet-onboarding">
              <Wallet className="h-4 w-4" />
              Set up account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleRemove = () => {
    close();
    clearSealedOwner();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted">
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">Medialane account</h3>
          {address && (
            <AddressDisplay address={address} chars={4} className="mt-1 text-xs text-muted-foreground" />
          )}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        onClick={handleRemove}
      >
        <LogOut className="h-4 w-4" />
        Remove account from this device
      </Button>
    </div>
  );
}

"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { NavWalletTrigger as SharedNavWalletTrigger, useNavAccountSheet } from "@medialane/ui";

/**
 * The global header's top-right account entry point (fixed, mirrors
 * `NavBrandButton` on the left) — mirrors medialane-starknet's
 * `HeaderWalletTrigger`, adapted for Clerk + ChipiPay identity (there is no
 * browser wallet connector here). Signed out: clicking opens Clerk's sign-in
 * modal directly. Signed in: clicking opens the account sheet (`AccountPanel`
 * — identity, wallet address, sign out). The Clerk avatar (`iconSrc`) stands
 * in for the "connected wallet's own icon" this trigger shows in starknet.
 */
export function HeaderWalletTrigger() {
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const { open: openAccountSheet } = useNavAccountSheet();

  return (
    <SharedNavWalletTrigger
      connected={!!isSignedIn}
      iconSrc={user?.imageUrl}
      onClick={() => (isSignedIn ? openAccountSheet() : openSignIn())}
    />
  );
}

"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { NavWalletTrigger as SharedNavWalletTrigger, useNavAccountSheet } from "@medialane/ui";
import { GoogleIcon } from "@/components/icons/google-icon";

/**
 * The global header's top-right account entry point (fixed, mirrors
 * `NavBrandButton` on the left) — mirrors medialane-starknet's
 * `HeaderWalletTrigger`, adapted for Clerk + ChipiPay identity (there is no
 * browser wallet connector here). Signed out: the ring shows the Google mark
 * (Clerk's primary sign-in method here) instead of the default Wallet glyph,
 * and clicking opens Clerk's sign-in modal directly. Signed in: clicking
 * opens the account sheet (`AccountPanel` — identity, wallet address, sign
 * out). The Clerk avatar (`iconSrc`) stands in for the "connected wallet's
 * own icon" this trigger shows in starknet.
 */
export function HeaderWalletTrigger() {
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const { open: openAccountSheet } = useNavAccountSheet();

  return (
    <SharedNavWalletTrigger
      connected={!!isSignedIn}
      iconSrc={user?.imageUrl}
      disconnectedIcon={<GoogleIcon className="h-3.5 w-3.5" />}
      onClick={() => (isSignedIn ? openAccountSheet() : openSignIn())}
    />
  );
}

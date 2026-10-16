"use client";

import { createAppWallet } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import { sessionEmail } from "@/hooks/use-session";

const CANONICAL_RP_ID = "www.medialane.io";

export function relyingPartyId(host: string): string {
  return host === "medialane.io" || host.endsWith(".medialane.io") ? CANONICAL_RP_ID : host;
}

export const { ownerStore, passkeyOwner, walletConsent, mediaWallet } = createAppWallet({
  appName: "Medialane",
  relyingPartyId: () => relyingPartyId(location.hostname),
  storeKey: "medialane-io.wallet.owner.v1",
  changeEvent: "mlio-wallet",
  prfSalt: "medialane://io/owner-key/v1",
  hkdfInfo: "medialane-io-owner-key",
  getClient: getMedialaneClient,
  loadAccountEmail: sessionEmail,
});

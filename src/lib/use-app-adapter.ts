"use client";

import { useRouter, usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import type { MedialaneApp } from "@medialane/ui";
import { requireAccount, requireSignedIn } from "@/lib/account-gate";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@medialane/ui/utils/use-session";
import { getMedialaneClient } from "@/lib/medialane-client";
import { lockVenueSigner } from "@/lib/wallet/venue-signer";
import { resolveImage } from "@/lib/utils";

export function useAppAdapter(): MedialaneApp {
  const { address, signer } = useWalletNativeSession();
  const { session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  return {
    getClient: getMedialaneClient,
    walletAddress: address ?? null,
    onRequireWallet: () => router.push(`/connect?redirect_url=${encodeURIComponent(pathname)}`),
    ensureSignedIn: async () => requireSignedIn(session),
    signedIn: !!session,
    releaseSigner: () => {
      if (signer) lockVenueSigner(signer.address);
    },
    connectLabel: "Connect with email",
    verifyEmailHref: "/settings/email",
    companion: {
      title: "Trade with your Starknet wallet",
      description: "Interact with this asset on our permissionless dapp.",
      icon: Wallet,
      origin: "https://starknet.medialane.io",
    },
    resolveImage,
    getSigner: () => {
      requireAccount(signer);
      return {
        address: signer.address,
        execute: (calls, opts) => signer.execute(calls, opts),
        signTypedData: (data) => signer.signTypedData(data),
      };
    },
  };
}

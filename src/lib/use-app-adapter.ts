"use client";

import { useRouter, usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { describeError, type MedialaneApp } from "@medialane/ui";
import { requireAccount } from "@/lib/account-gate";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { getMedialaneClient } from "@/lib/medialane-client";
import { ReportDialog } from "@/components/report-dialog";

export function useAppAdapter(): MedialaneApp {
  const { address, signer } = useWalletNativeSession();
  const router = useRouter();
  const pathname = usePathname();
  return {
    getClient: getMedialaneClient,
    walletAddress: address ?? null,
    onRequireWallet: () => router.push(`/connect?redirect_url=${encodeURIComponent(pathname)}`),
    connectLabel: "Connect with email",
    connectDescription: "Buy, offer, and collect instantly.",
    companion: {
      title: "Trade with your Starknet wallet",
      description: "Interact with this asset on our permissionless dapp.",
      icon: Wallet,
      origin: "https://starknet.medialane.io",
    },
    ReportDialog,
    getSigner: () => {
      requireAccount(signer);
      return {
        address: signer.address,
        execute: async (calls, opts) => {
          try {
            return await signer.execute(calls, opts);
          } catch (err) {
            throw new Error(describeError(err, "That didn't go through. Please try again.").message);
          }
        },
        signTypedData: (data) => signer.signTypedData(data),
      };
    },
  };
}

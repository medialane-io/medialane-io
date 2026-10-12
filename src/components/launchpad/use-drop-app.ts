"use client";

import { useRouter, usePathname } from "next/navigation";
import { describeError, type DropAppProps } from "@medialane/ui";
import { requireAccount } from "@/lib/account-gate";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { getMedialaneClient } from "@/lib/medialane-client";
import { starknetProvider } from "@/lib/starknet";

/** io's wallet and client for the shared drop screens. */
export function useDropApp(): DropAppProps {
  const { address, signer } = useWalletNativeSession();
  const router = useRouter();
  const pathname = usePathname();
  return {
    getClient: getMedialaneClient,
    provider: starknetProvider,
    walletAddress: address ?? null,
    onRequireWallet: () => router.push(`/connect?redirect_url=${encodeURIComponent(pathname)}`),
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

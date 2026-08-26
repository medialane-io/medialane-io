"use client";

import { useRouter, usePathname } from "next/navigation";
import { FastMint as SharedFastMint, type FastMintProps as SharedFastMintProps, type FastMintSigner } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { rewardToast } from "@/lib/reward-toast";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { starknetProvider } from "@/lib/starknet";

export interface FastMintProps {
  presentation?: "inline" | "dialog";
  open?: boolean;
  onClose?: () => void;

  mediaKindLock?: SharedFastMintProps["mediaKindLock"];
  onMinted?: SharedFastMintProps["onMinted"];
}

export function FastMint({ presentation = "inline", open = true, onClose, mediaKindLock, onMinted }: FastMintProps = {}) {
  const { hasWallet, address: walletAddress, signer } = useWalletNativeSession();
  const router = useRouter();
  const pathname = usePathname();
  const { getValidToken, signIn } = useSiwsToken();
  const client = useMedialaneClient();
  const { collections, mutate } = useCollectionsByOwner(walletAddress ?? null);

  const secureToken = async () => getValidToken() ?? (await signIn());

  return (
    <SharedFastMint
      presentation={presentation}
      open={open}
      onClose={onClose}
      mediaKindLock={mediaKindLock}
      onMinted={(asset) => {
        rewardToast("mint_asset");
        if (walletAddress) invalidatePortfolioCache(walletAddress);
        onMinted?.(asset);
      }}
      collections={collections}
      refetchCollections={async () => {
        const res = await mutate();
        return res?.data ?? collections;
      }}
      hasWallet={hasWallet}
      walletAddress={walletAddress}
      onRequireWallet={() => router.push(`/connect?redirect_url=${encodeURIComponent(pathname)}`)}
      getUploadToken={secureToken}
      getSigner={(): FastMintSigner => {
        if (!signer) throw new Error("Account not ready. Please refresh and try again.");
        return {
          address: signer.address,
          execute: async (calls) => {
            try {
              return await signer.execute(calls);
            } catch (err) {
              throw new Error(friendlyErrorMessage(err));
            }
          },
          signTypedData: async (data) => {
            try {
              return await signer.signTypedData(data);
            } catch (err) {
              throw new Error(friendlyErrorMessage(err));
            }
          },
        };
      }}
      client={client}
      provider={starknetProvider}
    />
  );
}

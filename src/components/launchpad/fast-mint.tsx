"use client";

import { UserFacingError } from "@medialane/ui";
import { useRouter, usePathname } from "next/navigation";
import { FastMint as SharedFastMint, describeError, type FastMintProps as SharedFastMintProps, type FastMintSigner } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { RewardEarned } from "@/lib/reward-earned";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
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
      successFooter={<RewardEarned actionType="mint_asset" />}
      presentation={presentation}
      open={open}
      onClose={onClose}
      mediaKindLock={mediaKindLock}
      onMinted={(asset) => {
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
        if (!signer) throw new UserFacingError("Account not ready. Please refresh and try again.");
        return {
          address: signer.address,
          execute: async (calls) => {
            try {
              return await signer.execute(calls);
            } catch (err) {
              throw new Error(describeError(err, "We couldn't complete that mint. Please try again.").message);
            }
          },
          signTypedData: async (data) => {
            try {
              return await signer.signTypedData(data);
            } catch (err) {
              throw new Error(describeError(err, "We couldn't complete that mint. Please try again.").message);
            }
          },
        };
      }}
      client={client}
      provider={starknetProvider}
    />
  );
}

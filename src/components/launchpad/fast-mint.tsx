"use client";

import { requireAccount } from "@/lib/account-gate";
import { useRouter, usePathname } from "next/navigation";
import { FastMint as SharedFastMint, describeError, type FastMintProps as SharedFastMintProps, type FastMintSigner, useCollectionsByOwner } from "@medialane/ui";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { useMedialaneClient } from "@/hooks/use-medialane-client";

import { RewardEarned } from "@/lib/reward-earned";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";

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
  const { session } = useSession();
  const client = useMedialaneClient();
  const { collections, mutate } = useCollectionsByOwner(walletAddress ?? null);

  const secureToken = async () => session?.accountId ?? null;

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
        requireAccount(signer);
        return {
          address: signer.address,
          execute: async (calls, opts?: { intentIds?: string[] }) => {
            try {
              return await signer.execute(calls, opts);
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
    />
  );
}

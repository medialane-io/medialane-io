"use client";

import { requireAccount } from "@/lib/account-gate";
import { useRouter, usePathname } from "next/navigation";
import { FastMint as SharedFastMint, type FastMintProps as SharedFastMintProps, type FastMintSigner, useCollectionsByOwner, useMedialaneClient } from "@medialane/ui";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";

import { RewardEarned } from "@medialane/ui";
import { invalidatePortfolioCache } from "@medialane/ui";

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
          execute: (calls, opts?: { intentIds?: string[] }) => signer.execute(calls, opts),
          signTypedData: (data) => signer.signTypedData(data),
        };
      }}
      client={client}
    />
  );
}

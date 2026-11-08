"use client";

import { useState } from "react";
import { getService } from "@medialane/sdk";
import { ApproveMintDialog as ApproveMintDialogView, useCollectionsByOwner } from "@medialane/ui";
import { requireSignedIn } from "@/lib/account-gate";
import { assetHref } from "@/lib/routes";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { approveRemix } from "@/lib/remix-approval";
import type { RemixOffer } from "@/types/remix-offers";

interface Props {
  offer: RemixOffer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApproveMintDialog({ offer, open, onOpenChange, onSuccess }: Props) {
  const { address: walletAddress } = useWalletNativeSession();
  const { session } = useSession();
  const tx = useMarketplaceTransaction();
  const { collections } = useCollectionsByOwner(walletAddress ?? null);
  const [newAssetHref, setNewAssetHref] = useState<string | null>(null);

  const eligible = collections.filter((c) => {
    const id = getService(c.service)?.id;
    return id === "mip-erc1155" || (id === "mip-erc721" && c.collectionId != null);
  });

  return (
    <ApproveMintDialogView
      offer={offer}
      open={open}
      onOpenChange={onOpenChange}
      collections={eligible}
      footerNote="Two onchain operations (mint + listing)."
      newAssetHref={newAssetHref}
      tx={{
        phase: tx.phase,
        txHash: tx.txHash,
        error: tx.error,
        retryable: tx.retryable,
        reset: () => { setNewAssetHref(null); tx.reset(); },
      }}
      onApprove={(selected, name) => {
        if (!offer) return;
        const collection = {
          contractAddress: selected.contractAddress,
          collectionId: selected.collectionId ?? null,
          standard: selected.standard === "ERC1155" ? ("ERC1155" as const) : ("ERC721" as const),
        };
        void tx
          .start(async (ctx) => {
            requireSignedIn(session);
            const minted = await approveRemix(ctx, { offer, collection, name });
            setNewAssetHref(assetHref("STARKNET", minted.contract, minted.tokenId));
          })
          .then((ok) => { if (ok) onSuccess?.(); });
      }}
    />
  );
}

"use client";

import { TransferDialog as TransferDialogView } from "@medialane/ui";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { transferNft } from "@/lib/marketplace-intents";
import { useResolvedTokenStandard } from "@/hooks/use-resolved-token-standard";
import { resolveImage } from "@/lib/utils";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  tokenImage?: string | null;
  onSuccess?: () => void;
  hasActiveListing?: boolean;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export function TransferDialog({
  open,
  onOpenChange,
  contractAddress,
  tokenId,
  tokenName,
  tokenImage,
  onSuccess,
  hasActiveListing,
  tokenStandard,
}: TransferDialogProps) {
  const { address, hasWallet } = useWalletNativeSession();
  const tx = useMarketplaceTransaction();
  const { tokenStandard: resolvedStandard } = useResolvedTokenStandard(contractAddress, tokenStandard);

  return (
    <TransferDialogView
      open={open}
      onOpenChange={onOpenChange}
      tokenId={tokenId}
      tokenName={tokenName}
      tokenImage={resolveImage(tokenImage)}
      hasActiveListing={hasActiveListing}
      walletAddress={address}
      canTransfer={hasWallet}
      connectLabel="Connect with email to transfer"
      footerNote="Transfer is recorded permanently onchain. Gas is sponsored by Medialane."
      tx={{ phase: tx.phase, txHash: tx.txHash, error: tx.error, retryable: tx.retryable, reset: tx.reset }}
      onTransfer={(toAddress) => {
        void tx.start((ctx) => transferNft(ctx, { contractAddress, tokenId, toAddress, tokenStandard: resolvedStandard }));
      }}
      onSuccess={onSuccess}
    />
  );
}

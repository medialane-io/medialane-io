"use client";

import { getServiceConfig } from "@/lib/service-registry";
import { PopClaimButton } from "@/components/claim/pop-claim-button";
import { CollectionDropMintButton } from "@/components/claim/collection-drop-mint-button";

interface CollectionServiceActionProps {
  source: string | null | undefined;
  contractAddress: string;
}

export function CollectionServiceAction({ source, contractAddress }: CollectionServiceActionProps) {
  const config = getServiceConfig(source);
  if (!config?.hasDetailAction) return null;

  if (source === "POP_PROTOCOL") {
    return <PopClaimButton collectionAddress={contractAddress} />;
  }

  if (source === "COLLECTION_DROP") {
    return <CollectionDropMintButton collectionAddress={contractAddress} />;
  }

  return null;
}

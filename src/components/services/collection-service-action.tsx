"use client";

import { getServiceConfig } from "@/lib/service-registry";
import { PopClaimButton } from "@/components/claim/pop-claim-button";

interface CollectionServiceActionProps {
  source: string | null | undefined;
  contractAddress: string;
}

/**
 * Renders the appropriate service action for a collection based on its source.
 * POP_PROTOCOL → ClaimButton
 * COLLECTION_DROP → MintButton (added when Collection Drop ships)
 */
export function CollectionServiceAction({ source, contractAddress }: CollectionServiceActionProps) {
  const config = getServiceConfig(source);
  if (!config?.hasDetailAction) return null;

  if (source === "POP_PROTOCOL") {
    return <PopClaimButton collectionAddress={contractAddress} />;
  }

  // COLLECTION_DROP and future services render here
  return null;
}

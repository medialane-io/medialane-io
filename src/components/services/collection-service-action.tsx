"use client";

import { getServiceConfig } from "@/lib/service-registry";
import { PopClaimButton } from "@/components/claim/pop-claim-button";
import { CollectionDropMintButton } from "@/components/claim/collection-drop-mint-button";

interface CollectionServiceActionProps {
  service: string | null | undefined;
  contractAddress: string;
}

// Visitor-facing service actions (left column). Owner-gated actions
// (ip-tickets create/mint) live in the page's right owner cluster instead —
// see TicketOwnerActions.
export function CollectionServiceAction({ service, contractAddress }: CollectionServiceActionProps) {
  const config = getServiceConfig(service);
  if (!config?.hasDetailAction) return null;

  if (service === "pop-protocol") {
    return <PopClaimButton collectionAddress={contractAddress} />;
  }

  if (service === "drop-collection") {
    return <CollectionDropMintButton collectionAddress={contractAddress} />;
  }

  return null;
}

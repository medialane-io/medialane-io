"use client";

import { getServiceConfig } from "@/lib/service-registry";
import { PopClaimButton } from "@/components/claim/pop-claim-button";
import { CollectionDropMintButton } from "@/components/claim/collection-drop-mint-button";
import { TicketOwnerActions } from "@/components/tickets/ticket-owner-actions";

interface CollectionServiceActionProps {
  service: string | null | undefined;
  contractAddress: string;
  /** Collection owner — required by owner-gated service actions (ip-tickets). */
  owner?: string | null;
}

export function CollectionServiceAction({ service, contractAddress, owner }: CollectionServiceActionProps) {
  const config = getServiceConfig(service);
  if (!config?.hasDetailAction) return null;

  if (service === "pop-protocol") {
    return <PopClaimButton collectionAddress={contractAddress} />;
  }

  if (service === "drop-collection") {
    return <CollectionDropMintButton collectionAddress={contractAddress} />;
  }

  if (service === "ip-tickets") {
    return <TicketOwnerActions contractAddress={contractAddress} owner={owner} />;
  }

  return null;
}

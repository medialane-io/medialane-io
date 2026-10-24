"use client";

import { getServiceConfig } from "@/lib/service-registry";
import { PopClaimButton } from "@medialane/ui";
import Link from "next/link";
import { dropHref } from "@medialane/sdk";
import { Button } from "@medialane/ui/button";

interface CollectionServiceActionProps {
  service: string | null | undefined;
  contractAddress: string;
}

export function CollectionServiceAction({ service, contractAddress }: CollectionServiceActionProps) {
  const config = getServiceConfig(service);
  if (!config?.hasDetailAction) return null;

  if (service === "pop-protocol") {
    return <PopClaimButton collectionAddress={contractAddress} />;
  }

  if (service === "drop-collection") {
    return (
      <Button asChild className="w-full">
        <Link href={dropHref(contractAddress)}>Mint from this drop</Link>
      </Button>
    );
  }

  return null;
}

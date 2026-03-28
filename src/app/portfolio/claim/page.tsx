"use client";

import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";

export default function ClaimCollectionPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">Claim a Collection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import an existing Starknet ERC-721 collection into your Medialane profile.
        </p>
      </div>
      <ClaimCollectionPanel />
    </div>
  );
}

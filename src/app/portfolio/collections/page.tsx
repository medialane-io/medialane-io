"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useCollectionsByOwner, CollectionCard, NewCollectionMenu, CollectionTypeChoices } from "@medialane/ui";
import { EmptyOrError } from "@medialane/ui/empty-or-error";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { Layers, Download } from "lucide-react";

export default function PortfolioCollectionsPage() {
  const { address: walletAddress } = useWalletNativeSession();
  const { collections, isLoading, error, mutate } = useCollectionsByOwner(walletAddress ?? null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Collections</h2>
          {collections.length > 0 && (
            <span className="text-sm text-muted-foreground">({collections.length})</span>
          )}
        </div>
        <NewCollectionMenu />
      </div>

      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={collections.length === 0}
        onRetry={mutate}
        emptyTitle="No collections yet"
        emptyDescription="If you just created a collection, it may take a few seconds to appear."
        emptyActions={<CollectionTypeChoices />}
        emptyIcon={<Layers className="h-7 w-7 text-muted-foreground" />}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((col) => (
            <CollectionCard
              key={col.contractAddress}
              collection={col}
              settingsHref={`/portfolio/collections/${col.contractAddress}/settings`}
            />
          ))}
        </div>
      </EmptyOrError>

      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Claim a collection</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Import an existing Starknet ERC-721 collection into your Medialane profile.
        </p>
        <ClaimCollectionPanel />
      </div>
    </div>
  );
}

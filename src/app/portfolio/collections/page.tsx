"use client";

import Link from "next/link";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { CollectionCard } from "@/components/shared/collection-card";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { Layers, Plus, Download } from "lucide-react";

export default function PortfolioCollectionsPage() {
  const { walletAddress } = useSessionKey();
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
        <Button size="sm" asChild>
          <Link href="/create/collection">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New collection
          </Link>
        </Button>
      </div>

      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={collections.length === 0}
        onRetry={mutate}
        emptyTitle="No collections yet"
        emptyDescription="If you just created a collection, it may take a few seconds to appear."
        emptyCta={{ label: "Create a collection", href: "/create/collection" }}
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

      {/* Claim an existing collection */}
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

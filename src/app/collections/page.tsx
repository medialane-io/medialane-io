"use client";

export const dynamic = "force-dynamic";

import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Layers } from "lucide-react";

export default function CollectionsPage() {
  const { collections, isLoading } = useCollections(1, 50);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Collections</span>
        </div>
        <h1 className="text-3xl font-bold">All Collections</h1>
        <p className="text-muted-foreground">
          Browse NFT collections deployed on Medialane and Starknet.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-2xl font-bold">No collections yet</p>
          <p className="text-muted-foreground max-w-sm">
            Deploy the first collection on Medialane.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col) => (
              <CollectionCard key={col.contractAddress} collection={col} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

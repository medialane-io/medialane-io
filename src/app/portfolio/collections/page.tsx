"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import Image from "next/image";
import Link from "next/link";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { ipfsToHttp } from "@/lib/utils";
import { Layers, Plus, ImageIcon } from "lucide-react";
import type { ApiCollection } from "@medialane/sdk";

function CollectionRow({ col }: { col: ApiCollection }) {
  const imgUrl = col.image ? ipfsToHttp(col.image) : null;
  const name = col.name || "Unnamed collection";

  return (
    <Link
      href={`/collections/${col.contractAddress}`}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 shrink-0 overflow-hidden border border-border">
        {imgUrl ? (
          <Image src={imgUrl} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {col.symbol && (
            <span className="text-xs text-muted-foreground font-mono">{col.symbol}</span>
          )}
          {col.totalSupply != null && (
            <span className="text-xs text-muted-foreground">
              {col.totalSupply} token{col.totalSupply !== 1 ? "s" : ""}
            </span>
          )}
          {col.floorPrice && (
            <span className="text-xs text-muted-foreground">Floor {col.floorPrice}</span>
          )}
        </div>
        {col.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{col.description}</p>
        )}
      </div>

      {/* Address */}
      <p className="text-xs text-muted-foreground font-mono shrink-0 hidden sm:block">
        {col.contractAddress.slice(0, 10)}…
      </p>
    </Link>
  );
}

export default function PortfolioCollectionsPage() {
  const { walletAddress } = useSessionKey();

  const { collections, isLoading, error, mutate } = useCollectionsByOwner(walletAddress ?? null);

  return (
    <EmptyOrError
      isLoading={isLoading}
      error={error}
      isEmpty={collections.length === 0}
      onRetry={mutate}
      emptyTitle="No collections yet"
      emptyDescription="If you just created a collection, it may take a few seconds to appear."
      emptyCta={{ label: "Create collection", href: "/create/collection" }}
      emptyIcon={<Layers className="h-7 w-7 text-muted-foreground" />}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/create/collection">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New collection
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          {collections.map((col) => (
            <CollectionRow key={col.contractAddress} col={col} />
          ))}
        </div>
      </div>
    </EmptyOrError>
  );
}

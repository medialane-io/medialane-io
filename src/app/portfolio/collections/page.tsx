"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import Image from "next/image";
import Link from "next/link";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { ipfsToHttp } from "@/lib/utils";
import { Layers, Plus, Settings, ImageIcon } from "lucide-react";
import type { ApiCollection } from "@medialane/sdk";

function CollectionCard({ col }: { col: ApiCollection }) {
  const imgUrl = col.image ? ipfsToHttp(col.image) : null;
  const name = col.name || "Unnamed collection";

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card hover:bg-muted/20 transition-colors group">
      {/* Thumbnail */}
      <Link href={`/collections/${col.contractAddress}`}>
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple-500/10 overflow-hidden relative">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/collections/${col.contractAddress}`}
              className="font-semibold text-sm hover:text-primary transition-colors truncate block"
            >
              {name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {col.symbol && (
                <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
                  {col.symbol}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {col.totalSupply ?? 0} items
              </span>
              {col.floorPrice && (
                <span className="text-xs text-muted-foreground">
                  · Floor {col.floorPrice}
                </span>
              )}
            </div>
          </div>
          {/* Settings gear */}
          <Link
            href={`/portfolio/collections/${col.contractAddress}/settings`}
            className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Collection settings"
            onClick={(e) => e.stopPropagation()}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
        {col.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{col.description}</p>
        )}
      </div>
    </div>
  );
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <CollectionCard key={col.contractAddress} col={col} />
          ))}
        </div>
      </EmptyOrError>
    </div>
  );
}

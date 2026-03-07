"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useUserCollections } from "@/hooks/use-user-collections";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ipfsToHttp } from "@/lib/utils";
import { Layers, Plus, ImageIcon } from "lucide-react";
import type { UserCollection } from "@/hooks/use-user-collections";
import { useCollections } from "@/hooks/use-collections";
import type { ApiCollection } from "@medialane/sdk";

// Merge on-chain data with DB metadata (image, description, totalSupply)
function CollectionRow({
  col,
  meta,
}: {
  col: UserCollection;
  meta: ApiCollection | undefined;
}) {
  const imgUrl = meta?.image ? ipfsToHttp(meta.image) : null;
  const name = col.name || meta?.name || "Unnamed collection";

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
          {meta?.totalSupply != null && (
            <span className="text-xs text-muted-foreground">
              {meta.totalSupply} token{meta.totalSupply !== 1 ? "s" : ""}
            </span>
          )}
          {meta?.floorPrice && (
            <span className="text-xs text-muted-foreground">Floor {meta.floorPrice}</span>
          )}
        </div>
        {meta?.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{meta.description}</p>
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
  const { user } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;

  // On-chain: get collection IDs + basic metadata owned by this wallet
  const { collections, isLoading } = useUserCollections(address ?? null);

  // DB: fetch all collections to get image/description/supply enrichment
  const { collections: dbCollections } = useCollections(1, 50);
  const dbMap = new Map(dbCollections.map((c) => [c.contractAddress, c]));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mx-auto">
          <Layers className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg">No collections yet</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Deploy your first NFT collection on Starknet — it&apos;s free and gasless.
        </p>
        <Button asChild>
          <Link href="/create/collection">
            <Plus className="h-4 w-4 mr-1.5" />
            Create collection
          </Link>
        </Button>
      </div>
    );
  }

  return (
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
          <CollectionRow
            key={col.onChainId}
            col={col}
            meta={dbMap.get(col.contractAddress)}
          />
        ))}
      </div>
    </div>
  );
}

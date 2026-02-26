"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { shortenAddress, formatPrice } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

interface CollectionCardProps {
  collection: ApiCollection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const name = collection.name || shortenAddress(collection.contractAddress);

  return (
    <Link href={`/collections/${collection.contractAddress}`} className="block group">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
        {/* Avatar placeholder */}
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-lg font-bold">
          {name.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="font-semibold truncate">{name}</p>
          {collection.isKnown && (
            <Badge variant="secondary" className="text-[10px] mt-1">Verified</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {collection.floorPrice && (
            <div>
              <p className="text-xs text-muted-foreground">Floor</p>
              <p className="font-medium">{formatPrice(collection.floorPrice, 18)} ETH</p>
            </div>
          )}
          {collection.totalSupply && (
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="font-medium">{collection.totalSupply.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>
  );
}

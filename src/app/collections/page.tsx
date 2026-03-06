"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { Layers, CheckCircle2 } from "lucide-react";

function CollectionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link
              key={col.contractAddress}
              href={`/collections/${col.contractAddress}`}
              className="group rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xl font-bold shrink-0 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all">
                  {col.name?.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold truncate">{col.name ?? "Unnamed"}</p>
                    {col.isKnown && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <AddressDisplay
                    address={col.contractAddress}
                    chars={4}
                    showCopy={false}
                    className="text-xs text-muted-foreground"
                  />
                </div>
                {col.symbol && (
                  <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                    {col.symbol}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Items", value: col.totalSupply?.toLocaleString() ?? "—" },
                  { label: "Holders", value: col.holderCount?.toLocaleString() ?? "—" },
                  { label: "Floor", value: col.floorPrice ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/40 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                      {label}
                    </p>
                    <p className="text-sm font-bold mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { ipfsToHttp } from "@/lib/utils";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import useSWR from "swr";
import type { ApiCollection } from "@medialane/sdk";

function useMyDrops(ownerAddress: string | null) {
  return useSWR<ApiCollection[]>(
    ownerAddress ? `my-drops-${ownerAddress}` : null,
    async () => {
      const params = new URLSearchParams({
        source: "COLLECTION_DROP",
        owner: ownerAddress!,
        limit: "50",
      });
      const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/collections?${params}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`My drops fetch failed: ${res.status}`);
      const json = await res.json();
      return json.data ?? [];
    },
    { revalidateOnFocus: false }
  );
}

function MyDropCard({ collection }: { collection: ApiCollection }) {
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const initial = (collection.name ?? "D").charAt(0).toUpperCase();

  return (
    <div className="bento-cell overflow-hidden flex gap-4 p-4 items-center">
      <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} alt={collection.name ?? "Drop"} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 to-orange-900/50 flex items-center justify-center">
            <span className="text-2xl font-black text-white/20">{initial}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-bold text-sm truncate">{collection.name ?? "Unnamed Drop"}</p>
        {collection.symbol && (
          <p className="text-xs text-muted-foreground">{collection.symbol}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {(collection.totalSupply ?? 0).toLocaleString()} minted
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href={`/launchpad/drop/${collection.contractAddress}`}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          View
        </Link>
      </Button>
    </div>
  );
}

export default function MyDropsPage() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { data: collections, isLoading } = useMyDrops(walletAddress ?? null);

  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <h1 className="text-xl font-bold">Sign in to view your drops</h1>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <span className="pill-badge inline-flex gap-1.5 mb-2">
              <Package className="h-3 w-3" />
              Collection Drop
            </span>
            <h1 className="text-2xl font-bold mt-1">My Drops</h1>
            <p className="text-sm text-muted-foreground">Drops you've deployed on Starknet</p>
          </div>
          <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
            <Link href="/launchpad/drop/create">
              <Plus className="h-3.5 w-3.5" />
              New drop
            </Link>
          </Button>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !collections || collections.length === 0 ? (
        <FadeIn>
          <div className="bento-cell border-dashed p-16 text-center space-y-3">
            <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">You haven't launched any drops yet.</p>
            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
              <Link href="/launchpad/drop/create">
                <Plus className="h-3.5 w-3.5" />
                Launch your first drop
              </Link>
            </Button>
          </div>
        </FadeIn>
      ) : (
        <Stagger className="space-y-3">
          {collections.map((col) => (
            <StaggerItem key={col.contractAddress}>
              <MyDropCard collection={col} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

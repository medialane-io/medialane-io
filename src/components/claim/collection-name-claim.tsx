"use client";

import Link from "next/link";
import Image from "next/image";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { ipfsToHttp } from "@/lib/utils";
import { CheckCircle2, ImageIcon, Plus, ArrowRight } from "lucide-react";

/** Slug claiming is per-collection and owned by the collection settings page
 *  (single source of truth). This panel lets the creator pick which of their
 *  collections to name, then deep-links into that collection's settings. */
export function CollectionNameClaim() {
  const { walletAddress } = useSessionKey();
  const { collections, isLoading, error, mutate } = useCollectionsByOwner(walletAddress ?? null);

  return (
    <div className="space-y-3">
      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={collections.length === 0}
        onRetry={mutate}
        emptyTitle="No collections to name yet"
        emptyDescription="Create a collection first — then give it a clean, memorable URL."
        emptyCta={{ label: "Create a collection", href: "/create/collection" }}
      />

      {collections.map((c) => {
        const slug = c.profile?.slug;
        const img = c.image ? ipfsToHttp(c.image) : null;
        const settingsHref = `/portfolio/collections/${c.contractAddress}/settings`;
        return (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
              {img ? (
                <Image src={img} alt={c.name ?? "Collection"} width={48} height={48} className="h-full w-full object-cover" unoptimized />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{c.name ?? "Untitled collection"}</p>
              {slug ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="tabular-nums truncate">medialane.io/collection/{slug}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">No custom name yet</p>
              )}
            </div>

            <Button variant={slug ? "outline" : "default"} size="sm" asChild className="shrink-0">
              <Link href={settingsHref}>
                {slug ? "Edit name" : "Set name"}
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        );
      })}

      {collections.length > 0 && (
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/create/collection">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create another collection
          </Link>
        </Button>
      )}
    </div>
  );
}

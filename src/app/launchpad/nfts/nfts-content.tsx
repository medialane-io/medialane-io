"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { collectionHref } from "@/lib/routes";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { SignInButton } from "@clerk/nextjs";
import { ipfsToHttp } from "@/lib/utils";
import { getService, type ApiCollection } from "@medialane/sdk";
import {
  ImagePlus, Sparkles, Plus, Package, ExternalLink, Inbox,
} from "lucide-react";

function CollectionRow({ col }: { col: ApiCollection }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = col.image ? ipfsToHttp(col.image) : null;
  const showImage = imageUrl && !imgError;

  return (
    <div className="group bento-cell overflow-hidden flex flex-col sm:flex-row items-stretch">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-32 aspect-square sm:aspect-auto shrink-0 overflow-hidden bg-muted">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={col.name ?? ""}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col justify-between gap-4 p-5 flex-1 min-w-0">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-base leading-tight truncate">
                {col.name ?? "Unnamed Collection"}
              </p>
              {col.symbol && (
                <p className="text-xs tabular-nums text-muted-foreground mt-0.5">{col.symbol}</p>
              )}
            </div>
            <Link
              href={collectionHref("STARKNET", col.contractAddress)}
              className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              title="View collection page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {col.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {col.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>
                {col.totalSupply != null
                  ? `${col.totalSupply.toLocaleString()} asset${col.totalSupply !== 1 ? "s" : ""}`
                  : "No assets yet"}
              </span>
            </div>
            {col.holderCount != null && col.holderCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {col.holderCount.toLocaleString()} holder{col.holderCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Link
            href="/create/asset"
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-brand-blue hover:brightness-110 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mint asset
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href={collectionHref("STARKNET", col.contractAddress)}>
              View collection
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CollectionRowSkeleton() {
  return (
    <div className="bento-cell overflow-hidden flex flex-col sm:flex-row">
      <Skeleton className="w-full sm:w-32 aspect-square sm:aspect-auto rounded-none" />
      <div className="flex flex-col gap-3 p-5 flex-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-64" />
        <div className="flex gap-2 mt-auto">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function NFTsContent() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { collections, isLoading } = useCollectionsByOwner(walletAddress ?? null);

  const nftCollections = useMemo(
    () => collections.filter((c) => getService(c.service)?.id === "mip-erc721"),
    [collections]
  );

  return (
    <div className="pb-16">

      {/* ── Header ── */}
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              icon={<ImagePlus className="h-4 w-4 text-white" />}
              title="NFTs"
              subtitle="Mint one-of-a-kind works into a collection you own."
            />
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/create/asset"
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-brand-blue hover:brightness-110 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Mint an asset
            </Link>
            <Link
              href="/create/collection"
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New collection
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Collections list ── */}
      <section className="px-4 pt-8 space-y-5 max-w-5xl mx-auto">
        {!isSignedIn ? (
          <FadeIn>
            <div className="bento-cell p-10 flex flex-col items-center gap-4 text-center">
              <ImagePlus className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">Sign in to see your collections</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your collections will appear here.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button>Sign in</Button>
              </SignInButton>
            </div>
          </FadeIn>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CollectionRowSkeleton key={i} />
            ))}
          </div>
        ) : nftCollections.length === 0 ? (
          <FadeIn>
            <div className="bento-cell p-10 flex flex-col items-center gap-4 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">No collections yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Create your first collection to start minting your work.
                </p>
              </div>
              <Link
                href="/create/collection"
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-brand-blue hover:brightness-110 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create your first collection
              </Link>
            </div>
          </FadeIn>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {nftCollections.length} collection{nftCollections.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Stagger className="space-y-3">
              {nftCollections.map((col) => (
                <StaggerItem key={col.contractAddress}>
                  <CollectionRow col={col} />
                </StaggerItem>
              ))}
            </Stagger>
          </>
        )}
      </section>

    </div>
  );
}

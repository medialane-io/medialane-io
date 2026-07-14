"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, SignInButton } from "@clerk/nextjs";
import { collectionHref } from "@/lib/routes";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { ipfsToHttp } from "@/lib/utils";
import { getService, type ApiCollection } from "@medialane/sdk";
import {
  ImagePlus, Sparkles, Plus, Package, ExternalLink, Layers, ScrollText,
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
                  ? `${col.totalSupply.toLocaleString()} work${col.totalSupply !== 1 ? "s" : ""}`
                  : "Nothing minted yet"}
              </span>
            </div>
            {col.holderCount != null && col.holderCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {col.holderCount.toLocaleString()} holder{col.holderCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/create/asset">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Mint a work
            </Link>
          </Button>
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

/** The service, stated as facts a newcomer can act on. Shown while the
 *  creator has no collections; the actions live in the header row above. */
function HowItWorks() {
  const steps = [
    { icon: Layers, title: "Create a collection", body: "It gets its own name and page." },
    { icon: Sparkles, title: "Mint works into it", body: "Each work is minted once, with the license terms you set." },
    { icon: ScrollText, title: "Sell or license them", body: "Every work can be listed on the marketplace." },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {steps.map(({ icon: Icon, title, body }) => (
        <div key={title} className="bento-cell p-5 space-y-2">
          <Icon className="h-5 w-5 text-brand-blue" />
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function SingleEditionsContent() {
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
      <section className="px-4 pt-10 max-w-5xl mx-auto space-y-5">
        <ClaimBackButton />
        <FadeIn>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">Single Editions</h1>
            <p className="text-muted-foreground mt-1.5">Publish each work as a single copy in a collection you own.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/create/asset">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Mint a work
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/create/collection">
                <Plus className="h-4 w-4 mr-1.5" />
                New collection
              </Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* ── Collections ── */}
      <section className="px-4 pt-8 space-y-5 max-w-5xl mx-auto">
        {!isSignedIn ? (
          <FadeIn>
            <HowItWorks />
            <div className="mt-4 flex justify-center">
              <SignInButton mode="modal">
                <Button variant="outline">Sign in to see your collections</Button>
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
            <HowItWorks />
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

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { ipfsToHttp } from "@/lib/utils";
import {
  Layers, Sparkles, Plus, ArrowRight, Package,
  ExternalLink, Inbox,
} from "lucide-react";

function CollectionRow({ col }: { col: any }) {
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <Layers className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {/* ERC-1155 badge */}
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          ERC-1155
        </span>
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
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{col.symbol}</p>
              )}
            </div>
            <Link
              href={`/collections/${col.contractAddress}`}
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
                  ? `${col.totalSupply.toLocaleString()} token${col.totalSupply !== 1 ? "s" : ""}`
                  : "No tokens yet"}
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
            href={`/launchpad/nfteditions/${col.contractAddress}/mint`}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mint editions
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/collections/${col.contractAddress}`}>
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

export function IP1155Content() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { collections, isLoading } = useCollectionsByOwner(walletAddress ?? null);

  const erc1155 = useMemo(
    () => collections.filter((c) => c.standard === "ERC1155"),
    [collections]
  );

  return (
    <div className="pb-16">

      {/* ── Hero ── */}
      <section className="border-b border-border/50">
        <div className="px-4 py-12 sm:py-16 max-w-3xl">
          <FadeIn>
            <span className="pill-badge mb-4 inline-flex">
              <Layers className="h-3 w-3" />
              ERC-1155
            </span>
          </FadeIn>
          <FadeIn delay={0.06}>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
              Mint IP Editions
            </h1>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              Select one of your IP Collection 1155 contracts and mint new token editions
              into it — each with its own artwork, supply, and on-chain provenance.
            </p>
          </FadeIn>
          <FadeIn delay={0.18}>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/launchpad/nfteditions/create"
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New collection
              </Link>
              <Button variant="outline" size="sm" asChild>
                <Link href="/learn/ip-collection-1155">
                  Learn more <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Collections list ── */}
      <section className="px-4 pt-8 space-y-5">
        {!isSignedIn ? (
          <FadeIn>
            <div className="bento-cell p-10 flex flex-col items-center gap-4 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">Sign in to see your collections</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your deployed IP Collection 1155 contracts will appear here.
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
        ) : erc1155.length === 0 ? (
          <FadeIn>
            <div className="bento-cell p-10 flex flex-col items-center gap-4 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">No IP Collection 1155 contracts yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Deploy your first multi-edition collection to start minting IP editions.
                </p>
              </div>
              <Link
                href="/launchpad/nfteditions/create"
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
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
                {erc1155.length} collection{erc1155.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Stagger className="space-y-3">
              {erc1155.map((col) => (
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

"use client";

import Link from "next/link";
import { useCreatorByUsername } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp, normalizeAddress } from "@/lib/utils";
import { AtSign, Globe, Twitter, ExternalLink } from "lucide-react";
import type { ApiCollection, ApiToken } from "@medialane/sdk";

interface Props {
  username: string;
}

export default function CreatorUsernamePageClient({ username }: Props) {
  const { creator, isLoading, error } = useCreatorByUsername(username);
  const walletAddress = creator?.walletAddress ? normalizeAddress(creator.walletAddress) : null;
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(walletAddress);
  const { collections, isLoading: colsLoading } = useCollectionsByOwner(walletAddress);

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen">
        {/* Banner skeleton */}
        <Skeleton className="w-full h-48 sm:h-64 rounded-none" />
        <div className="px-6">
          {/* Identity row skeleton */}
          <div className="-mt-14 sm:-mt-16 relative z-10">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3 pb-6">
              <Skeleton className="h-[88px] w-[88px] rounded-full shrink-0" />
              <div className="flex-1 min-w-0 pb-1 space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          </div>
          {/* Assets skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center space-y-4">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold">Creator not found</h1>
        <p className="text-muted-foreground">
          <span className="font-mono">@{username}</span> hasn&apos;t been claimed yet or doesn&apos;t exist.
        </p>
        <Button variant="outline" asChild>
          <Link href="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  const avatarUrl = creator.avatarImage ? ipfsToHttp(creator.avatarImage) : null;
  const bannerUrl = creator.bannerImage ? ipfsToHttp(creator.bannerImage) : null;
  const displayName = creator.displayName || `@${creator.username}`;

  return (
    <div className="pb-20 min-h-screen">
      {/* Banner */}
      <div
        className="w-full h-48 sm:h-64 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10"
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      />

      <div className="px-6">
        {/* Identity row */}
        <div className="-mt-14 sm:-mt-16 relative z-10">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 pb-6">
            {/* Avatar */}
            <div className="h-[88px] w-[88px] rounded-full ring-[3px] ring-background shrink-0 overflow-hidden bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name + slug + bio */}
            <div className="flex-1 min-w-0 pb-1 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                <AtSign className="h-3.5 w-3.5" />
                {creator.username}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h1>
              {creator.bio && <p className="text-sm text-muted-foreground line-clamp-2">{creator.bio}</p>}
            </div>

            {/* Links */}
            <div className="flex items-center gap-2 pb-1">
              {creator.websiteUrl && (
                <Button size="icon" variant="outline" asChild className="h-8 w-8">
                  <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5" /></a>
                </Button>
              )}
              {creator.twitterUrl && (
                <Button size="icon" variant="outline" asChild className="h-8 w-8">
                  <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer"><Twitter className="h-3.5 w-3.5" /></a>
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link href={`/account/${creator.walletAddress}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Full profile
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Collections */}
        {(colsLoading || (collections && collections.length > 0)) && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Collections</h2>
            {colsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {collections!.map((col: ApiCollection) => <CollectionCard key={col.contractAddress} collection={col} />)}
              </div>
            )}
          </section>
        )}

        {/* Assets */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Assets</h2>
          {tokensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
            </div>
          ) : tokens && tokens.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tokens.map((token: ApiToken) => <TokenCard key={`${token.contractAddress}-${token.tokenId}`} token={token} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No assets yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

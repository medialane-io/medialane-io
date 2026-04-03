"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useCreatorByUsername } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp, normalizeAddress } from "@/lib/utils";
import { AtSign, Globe, Twitter, ExternalLink, MessageCircle, Send } from "lucide-react";
import type { ApiCollection, ApiToken } from "@medialane/sdk";

interface Props {
  username: string;
}

function addressPalette(seed: string) {
  const n = parseInt(seed.replace(/[^0-9a-f]/gi, "").slice(0, 8) || "a1b2c3d4", 16);
  const h1 = n % 360;
  const h2 = (h1 + 137) % 360;
  const h3 = (h1 + 73) % 360;
  return { h1, h2, h3 };
}

export default function CreatorUsernamePageClient({ username }: Props) {
  const { creator, isLoading, error } = useCreatorByUsername(username);
  const walletAddress = creator?.walletAddress ? normalizeAddress(creator.walletAddress) : null;
  const { tokens, isLoading: tokensLoading } = useTokensByOwner(walletAddress);
  const { collections, isLoading: colsLoading } = useCollectionsByOwner(walletAddress);
  const mosaicImages = tokens
    .slice(0, 4)
    .map((t) => (t.metadata?.image ? ipfsToHttp(t.metadata.image) : null))
    .filter((img): img is string => !!img && img !== "/placeholder.svg");

  const avatarRaw = creator?.avatarImage
    ? ipfsToHttp(creator.avatarImage)
    : mosaicImages[0] ?? null;
  const [avatarErr, setAvatarErr] = useState(false);
  const showAvatar = avatarRaw && avatarRaw !== "/placeholder.svg" && !avatarErr;

  const { imgRef, dynamicTheme } = useDominantColor(mosaicImages[0] ?? null);
  const { h1, h2, h3 } = addressPalette(walletAddress ?? username);
  const displayName = creator?.displayName || `@${username}`;

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen">
        <Skeleton className="w-full h-48 sm:h-64 rounded-none" />
        <div className="px-6">
          <div className="-mt-14 relative z-10 flex flex-wrap items-end gap-x-4 gap-y-3 pb-6">
            <Skeleton className="h-28 w-28 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 pb-1 space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
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

  return (
    <div
      className="pb-20 min-h-screen"
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
    >
      {/* Hidden extraction image for dominant color */}
      {mosaicImages[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imgRef} src={mosaicImages[0]} crossOrigin="anonymous" aria-hidden alt="" style={{ display: "none" }} />
      )}

      {/* ── Token mosaic strip ───────────────────────────────────────────── */}
      <div className="relative h-44 sm:h-56 overflow-hidden bg-muted">
        <div className="absolute inset-0 flex gap-px">
          {mosaicImages.length > 0 ? (
            mosaicImages.slice(0, 4).map((img, i) => (
              <div key={i} className="relative flex-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div
              className="flex-1"
              style={{ background: `linear-gradient(135deg, hsl(${h1},60%,35%), hsl(${h2},55%,28%), hsl(${h3},50%,30%))` }}
            />
          )}
        </div>
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--background)))" }} />
        {/* Action buttons */}
        {creator.walletAddress && (
          <div className="absolute top-3 right-3 z-10">
            <Button size="sm" variant="outline" asChild className="bg-black/40 backdrop-blur-sm border-white/20 text-white hover:bg-black/60 hover:text-white">
              <Link href={`/account/${creator.walletAddress}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Full profile
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <div className="px-6">
        <div className="-mt-9 relative z-10 flex flex-wrap items-end gap-x-4 gap-y-3 pb-5">
          {/* Avatar */}
          <div
            className="rounded-full shrink-0 ring-[3px] ring-background overflow-hidden flex items-center justify-center text-white font-bold"
            style={{
              width: 88,
              height: 88,
              background: showAvatar ? "transparent" : `linear-gradient(145deg, hsl(${h1},72%,60%), hsl(${h2},72%,50%))`,
              fontSize: 88 * 0.33,
            }}
          >
            {showAvatar ? (
              <NextImage
                src={avatarRaw!}
                alt={displayName}
                width={88}
                height={88}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setAvatarErr(true)}
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name + bio */}
          <div className="flex-1 min-w-0 pb-0.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: dynamicTheme ? `hsl(var(--dynamic-primary))` : `hsl(${h1}, 68%, 52%)` }}>
              <AtSign className="h-3.5 w-3.5" />
              {creator.username}
            </div>
            <h1 className="text-lg sm:text-xl font-bold truncate">{displayName}</h1>
            {creator.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">{creator.bio}</p>
            )}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-1.5 pb-0.5 shrink-0">
            {creator.websiteUrl && (
              <Button size="icon" variant="outline" asChild className="h-7 w-7">
                <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer"><Globe className="h-3 w-3" /></a>
              </Button>
            )}
            {creator.twitterUrl && (
              <Button size="icon" variant="outline" asChild className="h-7 w-7">
                <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer"><Twitter className="h-3 w-3" /></a>
              </Button>
            )}
            {creator.discordUrl && (
              <Button size="icon" variant="outline" asChild className="h-7 w-7">
                <a href={creator.discordUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3 w-3" /></a>
              </Button>
            )}
            {creator.telegramUrl && (
              <Button size="icon" variant="outline" asChild className="h-7 w-7">
                <a href={creator.telegramUrl} target="_blank" rel="noopener noreferrer"><Send className="h-3 w-3" /></a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
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

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
  const [imgError, setImgError] = useState(false);

  // Build background image: bannerImage → avatarImage → latest token image
  const bannerRaw = creator?.bannerImage
    ? ipfsToHttp(creator.bannerImage)
    : creator?.avatarImage
    ? ipfsToHttp(creator.avatarImage)
    : tokens[0]?.metadata?.image
    ? ipfsToHttp(tokens[0].metadata.image)
    : null;
  const bannerImage = bannerRaw && bannerRaw !== "/placeholder.svg" && !imgError ? bannerRaw : null;

  const avatarRaw = creator?.avatarImage ? ipfsToHttp(creator.avatarImage) : bannerImage;
  const [avatarErr, setAvatarErr] = useState(false);
  const showAvatar = avatarRaw && avatarRaw !== "/placeholder.svg" && !avatarErr;

  const { imgRef, dynamicTheme } = useDominantColor(bannerImage);
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
      {bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={bannerImage}
          crossOrigin="anonymous"
          aria-hidden
          alt=""
          style={{ display: "none" }}
        />
      )}

      {/* Full-page atmospheric background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ opacity: 0.18, filter: "blur(60px) saturate(1.6)" }}
            onError={() => setImgError(true)}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 80% at 20% 40%, hsl(${h1}, 68%, 42% / ${bannerImage ? 0.18 : 0.45}) 0%, transparent 60%),
              radial-gradient(ellipse 60% 60% at 80% 20%, hsl(${h2}, 68%, 38% / ${bannerImage ? 0.12 : 0.32}) 0%, transparent 55%),
              radial-gradient(ellipse 50% 50% at 60% 80%, hsl(${h3}, 68%, 38% / ${bannerImage ? 0.08 : 0.22}) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute inset-0 bg-background/65" />
      </div>

      {/* Hero header area */}
      <div className="relative pt-16 pb-6 px-6">
        {/* Avatar + identity */}
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          {/* Avatar */}
          <div
            className="rounded-full shrink-0 ring-[3px] ring-background overflow-hidden flex items-center justify-center text-white font-bold"
            style={{
              width: 112,
              height: 112,
              background: showAvatar
                ? "transparent"
                : `linear-gradient(145deg, hsl(${h1}, 72%, 60%), hsl(${h2}, 72%, 50%))`,
              fontSize: 112 * 0.33,
              boxShadow: dynamicTheme
                ? `0 0 0 3px hsl(var(--dynamic-primary)), 0 8px 32px rgba(0,0,0,0.3)`
                : `0 0 0 2px hsl(${h1}, 72%, 60% / 0.4), 0 8px 24px rgba(0,0,0,0.25)`,
            }}
          >
            {showAvatar ? (
              <NextImage
                src={avatarRaw!}
                alt={displayName}
                width={112}
                height={112}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setAvatarErr(true)}
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0 pb-1 space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{
              color: dynamicTheme ? `hsl(var(--dynamic-primary))` : `hsl(${h1}, 68%, 62%)`
            }}>
              <AtSign className="h-3.5 w-3.5" />
              {creator.username}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h1>
            {creator.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl">{creator.bio}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1">
            {creator.websiteUrl && (
              <Button size="icon" variant="outline" asChild className="h-8 w-8 bg-background/60 backdrop-blur-sm">
                <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5" /></a>
              </Button>
            )}
            {creator.twitterUrl && (
              <Button size="icon" variant="outline" asChild className="h-8 w-8 bg-background/60 backdrop-blur-sm">
                <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer"><Twitter className="h-3.5 w-3.5" /></a>
              </Button>
            )}
            {creator.discordUrl && (
              <Button size="icon" variant="outline" asChild className="h-8 w-8 bg-background/60 backdrop-blur-sm">
                <a href={creator.discordUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" /></a>
              </Button>
            )}
            {creator.telegramUrl && (
              <Button size="icon" variant="outline" asChild className="h-8 w-8 bg-background/60 backdrop-blur-sm">
                <a href={creator.telegramUrl} target="_blank" rel="noopener noreferrer"><Send className="h-3.5 w-3.5" /></a>
              </Button>
            )}
            {creator.walletAddress && (
              <Button size="sm" variant="outline" asChild className="bg-background/60 backdrop-blur-sm">
                <Link href={`/account/${creator.walletAddress}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Full profile
                </Link>
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

"use client";

import Link from "next/link";
import { useCreators } from "@/hooks/use-creators";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { ipfsToHttp } from "@/lib/utils";
import { Users, ArrowRight, AtSign } from "lucide-react";
import type { ApiCreatorProfile } from "@medialane/sdk";

function CreatorChip({ creator }: { creator: ApiCreatorProfile }) {
  const avatarUrl = creator.avatarImage ? ipfsToHttp(creator.avatarImage) : null;
  const bannerUrl = creator.bannerImage ? ipfsToHttp(creator.bannerImage) : null;
  const displayName = creator.displayName || `@${creator.username}`;

  const hue = (creator.username ?? "a").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const hue2 = (hue + 60) % 360;
  const fallbackGradient = `linear-gradient(135deg, hsl(${hue},55%,35%), hsl(${hue2},50%,22%))`;

  const needsFallback = !avatarUrl && !bannerUrl;
  const { collections } = useCollectionsByOwner(needsFallback ? creator.walletAddress : null);
  const fallbackImage = collections[0]?.image ? ipfsToHttp(collections[0].image) : null;

  const resolvedBanner = bannerUrl ?? fallbackImage;
  const resolvedAvatar = avatarUrl ?? fallbackImage;

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="block shrink-0 w-64 snap-start active:scale-[0.97] transition-transform duration-150 select-none"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
        {resolvedBanner ? (
          <img
            src={resolvedBanner}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: fallbackGradient }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-2.5 space-y-1.5">
          <div
            className="h-8 w-8 rounded-full ring-2 ring-white/20 overflow-hidden flex items-center justify-center"
            style={!resolvedAvatar ? { background: fallbackGradient } : {}}
          >
            {resolvedAvatar ? (
              <img src={resolvedAvatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-black text-white">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-white text-xs truncate">{displayName}</p>
            <p className="text-[10px] text-white/55 flex items-center gap-0.5">
              <AtSign className="h-2 w-2 shrink-0" />
              <span className="truncate">{creator.username}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CreatorChipSkeleton() {
  return <Skeleton className="shrink-0 w-64 aspect-[3/4] rounded-xl" />;
}

export function CreatorsStrip() {
  const { creators, isLoading } = useCreators(undefined, 1, 10);

  if (!isLoading && creators.length === 0) return null;

  return (
    <FadeIn>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Creator network</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Users className={`h-4 w-4 ${BRAND.purple.text}`} />
              <h2 className="text-lg font-bold">Creators</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
            <Link href="/creators">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Scroll strip — bleeds to screen edge on mobile only */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-3 w-max pb-1">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CreatorChipSkeleton key={i} />)
              : creators.map((c) => (
                  <CreatorChip key={c.walletAddress} creator={c} />
                ))}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

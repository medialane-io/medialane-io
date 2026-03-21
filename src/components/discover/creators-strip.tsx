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

  // Deterministic gradient from username
  const hue = (creator.username ?? "a").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const hue2 = (hue + 60) % 360;
  const fallbackGradient = `linear-gradient(135deg, hsl(${hue},55%,35%), hsl(${hue2},50%,22%))`;

  // Fetch collection image only when creator has no uploaded images
  const needsFallback = !avatarUrl && !bannerUrl;
  const { collections } = useCollectionsByOwner(needsFallback ? creator.walletAddress : null);
  const fallbackImage = collections[0]?.image ? ipfsToHttp(collections[0].image) : null;

  const resolvedBanner = bannerUrl ?? fallbackImage;
  const resolvedAvatar = avatarUrl ?? fallbackImage;

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="block shrink-0 w-36 sm:w-44 snap-start active:scale-[0.97] transition-transform duration-150 select-none"
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
        {/* Background */}
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

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {/* Bottom info */}
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2">
          {/* Avatar */}
          <div
            className="h-9 w-9 rounded-full ring-2 ring-white/20 overflow-hidden flex items-center justify-center shrink-0"
            style={!resolvedAvatar ? { background: fallbackGradient } : {}}
          >
            {resolvedAvatar ? (
              <img src={resolvedAvatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-black text-white select-none">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-white text-xs leading-snug truncate">{displayName}</p>
            <p className="text-[10px] text-white/55 flex items-center gap-0.5 mt-0.5">
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
  return <Skeleton className="shrink-0 w-36 sm:w-44 aspect-[3/4] rounded-2xl" />;
}

export function CreatorsStrip() {
  const { creators, isLoading } = useCreators(undefined, 1, 10);

  if (!isLoading && creators.length === 0) return null;

  return (
    <FadeIn>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Creator network</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Users className={`h-4 w-4 ${BRAND.purple.text}`} />
              <h2 className="text-xl font-bold">Creators</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground text-sm">
            <Link href="/creators">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 w-max pb-1">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CreatorChipSkeleton key={i} />)
              : creators.map((c) => (
                  <CreatorChip key={c.walletAddress} creator={c} />
                ))}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

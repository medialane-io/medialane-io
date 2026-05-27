"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { useCreators } from "@/hooks/use-creators";
import type { ApiCreatorProfile } from "@medialane/sdk";
import { ipfsToHttp } from "@/lib/utils";

function CreatorChipSkeleton() {
  return <div className="shrink-0 w-64 aspect-[3/4] rounded-xl bg-muted animate-pulse" />;
}

function CreatorChip({ creator, href }: { creator: ApiCreatorProfile; href: string }) {
  const [bannerError, setBannerError] = useState(false);
  // `collectionImage` shipped in SDK 0.24 (not yet on npm). Inline-extend until bump.
  const rawSrc = creator.bannerImage || (creator as ApiCreatorProfile & { collectionImage?: string | null }).collectionImage || null;
  const bannerUrl = rawSrc && !bannerError ? ipfsToHttp(rawSrc) : null;

  return (
    <Link
      href={href}
      className="block shrink-0 w-64 snap-start active:scale-[0.97] transition-transform duration-150 select-none"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setBannerError(true)}
          />
        )}
        <div className="absolute bottom-0 inset-x-0 px-3 py-3">
          <p className="font-bold text-2xl text-white truncate">{creator.username}</p>
        </div>
      </div>
    </Link>
  );
}

export function CreatorsStrip() {
  const { creators, isLoading } = useCreators(undefined, 1, 10);

  if (!isLoading && creators.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">Explore</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Users className="h-4 w-4 text-brand-purple" />
            <h2 className="text-lg font-bold">Creators</h2>
          </div>
        </div>
        <Link
          href="/creators"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CreatorChipSkeleton key={i} />)
          : creators.map((c) => (
              <CreatorChip key={c.username} creator={c} href={`/creator/${c.username}`} />
            ))}
      </div>
    </div>
  );
}

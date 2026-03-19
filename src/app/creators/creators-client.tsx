"use client";

import { useState } from "react";
import Link from "next/link";
import { useCreators } from "@/hooks/use-creators";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp } from "@/lib/utils";
import { AtSign, Search, Users } from "lucide-react";
import type { ApiCreatorProfile } from "@medialane/sdk";

function CreatorCard({ creator }: { creator: ApiCreatorProfile }) {
  const avatarUrl = creator.avatarImage ? ipfsToHttp(creator.avatarImage) : null;
  const bannerUrl = creator.bannerImage ? ipfsToHttp(creator.bannerImage) : null;
  const displayName = creator.displayName || `@${creator.username}`;

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="glass rounded-xl overflow-hidden hover:ring-1 hover:ring-primary/40 transition-all group"
    >
      {/* Banner */}
      <div
        className="h-20 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10"
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      />

      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="-mt-6 mb-3">
          <div className="h-12 w-12 rounded-full ring-2 ring-background overflow-hidden bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-primary text-xs font-medium mb-0.5">
          <AtSign className="h-3 w-3" />
          <span>{creator.username}</span>
        </div>
        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {displayName}
        </p>
        {creator.bio && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{creator.bio}</p>
        )}
      </div>
    </Link>
  );
}

function CreatorCardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <Skeleton className="h-20 w-full rounded-none" />
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-3">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-16 mb-1" />
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export default function CreatorsPageClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(value), 300);
  }

  const { creators, total, isLoading } = useCreators(debouncedSearch || undefined);

  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Creators</span>
        </div>
        <h1 className="text-3xl font-bold">All Creators</h1>
        <p className="text-muted-foreground">
          Discover verified creators on Medialane.
          {!isLoading && total > 0 && <span className="ml-1 text-foreground font-medium">{total} total</span>}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by name or username…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
        </div>
      ) : creators.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {creators.map((c) => <CreatorCard key={c.walletAddress} creator={c} />)}
        </div>
      ) : (
        <div className="py-24 text-center space-y-2">
          <p className="text-4xl">🎨</p>
          <p className="font-semibold">
            {debouncedSearch ? `No creators found for "${debouncedSearch}"` : "No creators yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {debouncedSearch ? "Try a different search term" : "Be the first to claim your username in Profile Settings"}
          </p>
        </div>
      )}
    </div>
  );
}

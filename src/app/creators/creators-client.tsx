"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useCreators } from "@/hooks/use-creators";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { ipfsToHttp } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { AtSign, Search, Users, Palette, Globe, Twitter, X } from "lucide-react";
import type { ApiCreatorProfile } from "@medialane/sdk";

function CreatorCard({ creator }: { creator: ApiCreatorProfile }) {
  const avatarUrl = creator.avatarImage ? ipfsToHttp(creator.avatarImage) : null;
  const bannerUrl = creator.bannerImage ? ipfsToHttp(creator.bannerImage) : null;
  const displayName = creator.displayName || `@${creator.username}`;

  // Deterministic gradient from username characters
  const hue = (creator.username ?? "a").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const hue2 = (hue + 60) % 360;
  const fallbackGradient = `linear-gradient(135deg, hsl(${hue},55%,35%), hsl(${hue2},50%,22%))`;

  // Fetch collection images only when creator has no uploaded banner or avatar
  const needsFallback = !avatarUrl && !bannerUrl;
  const { collections } = useCollectionsByOwner(needsFallback ? creator.walletAddress : null);
  const fallbackImage = collections[0]?.image ? ipfsToHttp(collections[0].image) : null;

  const resolvedBanner = bannerUrl ?? fallbackImage;
  const resolvedAvatar = avatarUrl ?? fallbackImage;

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="block relative aspect-[3/4] overflow-hidden rounded-2xl active:scale-[0.98] transition-transform duration-150 select-none"
    >
      {/* Full-bleed background */}
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

      {/* Gradient scrim — heavier at bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Social icons — top right */}
      {(creator.twitterUrl || creator.websiteUrl) && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {creator.twitterUrl && (
            <span className="h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Twitter className="h-3.5 w-3.5 text-white/80" />
            </span>
          )}
          {creator.websiteUrl && (
            <span className="h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Globe className="h-3.5 w-3.5 text-white/80" />
            </span>
          )}
        </div>
      )}

      {/* Info overlay — bottom */}
      <div className="absolute bottom-0 inset-x-0 p-4 space-y-2.5 z-10">
        {/* Avatar */}
        <div
          className="h-11 w-11 rounded-full ring-2 ring-white/20 overflow-hidden flex items-center justify-center shrink-0"
          style={!resolvedAvatar ? { background: fallbackGradient } : {}}
        >
          {resolvedAvatar ? (
            <img src={resolvedAvatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-base font-black text-white select-none">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + username */}
        <div>
          <p className="font-bold text-white text-base leading-snug truncate">{displayName}</p>
          {creator.displayName && (
            <p className="text-xs text-white/55 flex items-center gap-0.5 mt-0.5">
              <AtSign className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{creator.username}</span>
            </p>
          )}
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-[11px] text-white/65 line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>
        )}
      </div>
    </Link>
  );
}

function CreatorCardSkeleton() {
  return <Skeleton className="aspect-[3/4] w-full rounded-2xl" />;
}

export default function CreatorsPageClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }

  function clearSearch() {
    setSearch("");
    setDebouncedSearch("");
  }

  const { creators, total, isLoading } = useCreators(debouncedSearch || undefined);

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative border-b border-border/50 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <FadeIn>
            <span className="pill-badge mb-5 inline-flex">
              <Users className="h-3 w-3" />
              Creator Network
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              Meet the{" "}
              <span className="gradient-text">Creators</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed mb-6">
              Discover the artists, writers, and builders publishing their work on Medialane.
            </p>
          </FadeIn>

          {/* Stats + search row */}
          <FadeIn delay={0.22}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {!isLoading && total > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm">
                  <Palette className={`h-3.5 w-3.5 ${BRAND.purple.text}`} />
                  <span className="font-bold">{total}</span>
                  <span className="text-muted-foreground">creator{total !== 1 ? "s" : ""}</span>
                </div>
              )}

              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 pr-9"
                  placeholder="Search by name or username…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
          </div>
        ) : creators.length > 0 ? (
          <>
            {debouncedSearch && (
              <p className="text-sm text-muted-foreground mb-4">
                {creators.length} result{creators.length !== 1 ? "s" : ""} for &ldquo;{debouncedSearch}&rdquo;
              </p>
            )}
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((c) => (
                <StaggerItem key={c.walletAddress}>
                  <CreatorCard creator={c} />
                </StaggerItem>
              ))}
            </Stagger>
          </>
        ) : (
          <div className="py-24 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                {debouncedSearch ? `No creators found for "${debouncedSearch}"` : "No creators yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {debouncedSearch ? "Try a different search term" : "Be the first to claim your username in Profile Settings"}
              </p>
            </div>
            {!debouncedSearch && (
              <Button asChild variant="outline">
                <Link href="/portfolio/settings">Claim username</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

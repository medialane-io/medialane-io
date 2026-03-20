"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useCreators } from "@/hooks/use-creators";
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
  const fallbackGradient = `linear-gradient(135deg, hsl(${hue},60%,25%), hsl(${hue2},55%,20%))`;

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="glass rounded-2xl overflow-hidden hover:ring-1 hover:ring-primary/40 hover:scale-[1.01] transition-all duration-200 group flex flex-col"
    >
      {/* Banner */}
      <div
        className="h-24 shrink-0"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: fallbackGradient }
        }
      />

      <div className="px-4 pb-5 flex-1 flex flex-col">
        {/* Avatar row */}
        <div className="-mt-6 mb-3 flex items-end justify-between">
          <div
            className="h-14 w-14 rounded-full ring-[3px] ring-background overflow-hidden flex items-center justify-center shrink-0"
            style={!avatarUrl ? { background: fallbackGradient } : {}}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-black text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Social links */}
          <div className="flex items-center gap-1.5 pb-1">
            {creator.twitterUrl && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <Twitter className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            {creator.websiteUrl && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="flex items-center gap-1 text-primary text-xs font-medium mb-0.5">
          <AtSign className="h-3 w-3 shrink-0" />
          <span className="truncate">{creator.username}</span>
        </div>

        {/* Display name */}
        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors mb-1">
          {displayName}
        </p>

        {/* Bio */}
        {creator.bio ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">{creator.bio}</p>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic flex-1">No bio yet</p>
        )}
      </div>
    </Link>
  );
}

function CreatorCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="px-4 pb-5">
        <div className="-mt-6 mb-3 flex items-end justify-between">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex gap-1.5 pb-1">
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-20 mb-1.5" />
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export default function CreatorsPageClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

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
              The builders of{" "}
              <span className="gradient-text">Medialane</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed mb-6">
              Verified creators minting intellectual property on Starknet. Each username is reviewed by the Medialane DAO.
            </p>
          </FadeIn>

          {/* Stats + search row */}
          <FadeIn delay={0.22}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {!isLoading && total > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm">
                  <Palette className={`h-3.5 w-3.5 ${BRAND.purple.text}`} />
                  <span className="font-bold">{total}</span>
                  <span className="text-muted-foreground">verified creator{total !== 1 ? "s" : ""}</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
          </div>
        ) : creators.length > 0 ? (
          <>
            {debouncedSearch && (
              <p className="text-sm text-muted-foreground mb-4">
                {creators.length} result{creators.length !== 1 ? "s" : ""} for &ldquo;{debouncedSearch}&rdquo;
              </p>
            )}
            <Stagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

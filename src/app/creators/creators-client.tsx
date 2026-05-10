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
import { Search, Users, Palette, X } from "lucide-react";
import type { ApiCreatorProfile } from "@medialane/sdk";

function CreatorCard({ creator }: { creator: ApiCreatorProfile }) {
  const rawSrc = creator.bannerImage || (creator as any).collectionImage || null;
  const bannerUrl = rawSrc ? ipfsToHttp(rawSrc) : null;
  const displayName = creator.displayName || creator.username || "";

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="block relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted active:scale-[0.97] transition-transform duration-150 select-none"
    >
      {bannerUrl && (
        <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute bottom-0 inset-x-0 px-4 py-4">
        <p className="font-bold text-2xl text-white truncate">{displayName}</p>
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
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              Meet the{" "}
              <span className="gradient-text">Creators</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed mb-6">
              Discover the artists, writers, and creators bulding onchain.
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
          </div>
        ) : creators.length > 0 ? (
          <>
            {debouncedSearch && (
              <p className="text-sm text-muted-foreground mb-4">
                {creators.length} result{creators.length !== 1 ? "s" : ""} for &ldquo;{debouncedSearch}&rdquo;
              </p>
            )}
            <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

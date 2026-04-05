"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Award, Calendar, Users, Plus, LayoutList } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PopClaimButton } from "@/components/claim/pop-claim-button";
import { usePopCollections } from "@/hooks/use-pop";
import { ipfsToHttp } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

function PopCollectionCard({ collection }: { collection: any }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "P").charAt(0).toUpperCase();

  return (
    <div className="bento-cell overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={collection.name ?? "POP Collection"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/40 via-brand-blue/30 to-brand-navy/50 flex items-center justify-center">
            <span className="text-7xl font-black text-white/10 select-none">{initial}</span>
          </div>
        )}
        {/* Source badge */}
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          POP
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1 space-y-1">
          <p className="font-bold text-sm leading-tight">{collection.name ?? "Unnamed Event"}</p>
          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {collection.totalSupply != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {collection.totalSupply.toLocaleString()} claimed
            </span>
          )}
          {collection.symbol && (
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {collection.symbol}
            </span>
          )}
        </div>

        {/* Claim */}
        <PopClaimButton collectionAddress={collection.contractAddress} />
      </div>
    </div>
  );
}

function PopCollectionCardSkeleton() {
  return (
    <div className="bento-cell overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </div>
  );
}

export function PopContent() {
  const { collections, isLoading } = usePopCollections();

  return (
    <div className="pb-16 space-y-10">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="px-4 py-14 sm:py-20">
          <FadeIn>
            <span className="pill-badge mb-5 inline-flex">
              <Award className="h-3 w-3" />
              POP Protocol
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              Claim Your On-Chain<br />
              <span className="gradient-text">POP Credential</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              Soulbound NFTs issued by event organizers — permanently proving your participation
              in bootcamps, workshops, hackathons, and conferences on Starknet.
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <div className="flex flex-wrap gap-2 mt-5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 text-sm">
                <Award className={`h-3.5 w-3.5 ${BRAND.purple.text}`} />
                <span className="text-muted-foreground">Soulbound · Non-transferable</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 text-sm">
                <Calendar className={`h-3.5 w-3.5 ${BRAND.blue.text}`} />
                <span className="text-muted-foreground">One credential per address</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Collections grid */}
      <section className="px-4 space-y-4">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Available</p>
              <h2 className="text-xl font-bold mt-0.5">Open for claiming</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/launchpad/pop/my-events">
                  <LayoutList className="h-3.5 w-3.5" />
                  My Events
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
                <Link href="/launchpad/pop/create">
                  <Plus className="h-3.5 w-3.5" />
                  Create Event
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <PopCollectionCardSkeleton key={i} />)}
          </div>
        ) : collections.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-16 text-center space-y-3">
              <div className="flex justify-center">
                <Award className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground">
                No active POP events right now. Check back after your next event.
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col) => (
              <StaggerItem key={col.contractAddress}>
                <PopCollectionCard collection={col} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

    </div>
  );
}

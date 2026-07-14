"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Award, Users, Plus, LayoutList, Zap, ShieldCheck } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { PopClaimButton } from "@/components/claim/pop-claim-button";
import { usePopCollections } from "@/hooks/use-pop";
import { ipfsToHttp } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

// See drop-content.tsx for the same shape. Will move to SDK once 0.24+ exposes
// collection-level attributes.
type CollectionWithAttributes = ApiCollection & {
  attributes?: { trait_type?: string; value?: string }[];
};

function PopCollectionCard({ collection }: { collection: ApiCollection }) {
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

const POP_FEATURES = [
  {
    icon: Award,
    title: "Soulbound Credential",
    desc: "Non-transferable — permanently tied to your wallet address onchain.",
  },
  {
    icon: Users,
    title: "One Per Address",
    desc: "Each participant claims exactly one credential per event.",
  },
  {
    icon: Zap,
    title: "Gas-Free Claiming",
    desc: "Participants claim for free — no wallet balance required.",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable On-Chain",
    desc: "Credentials are permanently readable and provable onchain.",
  },
];

export function PopContent() {
  const { collections, isLoading } = usePopCollections();

  // Filter: show only collections without a Private visibility attribute.
  // Inert until backend indexes collection attributes — safe for legacy collections.
  const publicCollections = collections.filter(
    (c) =>
      (c as CollectionWithAttributes).attributes?.find((a) => a.trait_type === "Visibility")?.value !== "Private"
  );

  return (
    <div className="pb-16 space-y-10">

      {/* ── Header ── */}
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              plain
              icon={<Award className="h-4 w-4 text-white" />}
              title="POP Events"
              subtitle="Collectible badges that prove people took part. Browse events to claim yours, or create one for your community."
            />
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="mt-6">
            <Link
              href="/launchpad/pop/create"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-brand-purple hover:brightness-110 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New event
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Features grid */}
      <section className="px-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POP_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <Icon className="h-5 w-5 text-green-500" />
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Collections grid */}
      <section className="px-4 space-y-4 max-w-5xl mx-auto">
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
        ) : publicCollections.length === 0 ? (
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
            {publicCollections.map((col) => (
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

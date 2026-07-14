"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Users, IdCard, Plus, Layers, KeyRound } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { ClubJoinButton } from "@/components/claim/club-join-button";
import { useClubCollections, useClubInfo } from "@/hooks/use-club";
import { ipfsToHttp } from "@/lib/utils";
import { hasCapability, type ApiCollection } from "@medialane/sdk";

const CLUB_TRANSFERABLE = hasCapability("ip-club", "transfer");

function ClubCard({ collection }: { collection: ApiCollection }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "C").charAt(0).toUpperCase();
  const clubAddress = collection.contractAddress;
  const { info, isLoading: infoLoading } = useClubInfo(clubAddress);

  return (
    <div className="bento-cell overflow-hidden flex flex-col">
      <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={collection.name ?? "Club"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/40 via-brand-purple/30 to-brand-indigo/50 flex items-center justify-center">
            <span className="text-7xl font-black text-white/10 select-none">{initial}</span>
          </div>
        )}
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          CLUB
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1 space-y-1">
          <p className="font-bold text-sm leading-tight">{collection.name ?? "Unnamed Club"}</p>
          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
        {info && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            {info.numMembers}{info.maxMembers != null ? ` / ${info.maxMembers}` : ""} members
          </span>
        )}
        {info && !infoLoading ? (
          <ClubJoinButton
            clubAddress={clubAddress}
            entryFee={info.entryFee ?? "0"}
            paymentToken={info.paymentToken}
            open={info.open}
          />
        ) : (
          <Skeleton className="h-8 w-full" />
        )}
      </div>
    </div>
  );
}

function ClubCardSkeleton() {
  return (
    <div className="bento-cell overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </div>
  );
}

const CLUB_FEATURES = [
  { icon: IdCard, title: "Membership card", desc: "Each member holds a real NFT proving they belong." },
  { icon: KeyRound, title: "Open or close joining", desc: "Reversible — never affects existing members." },
  { icon: Users, title: "Optional entry fee", desc: "Free or paid — you decide." },
  CLUB_TRANSFERABLE
    ? { icon: Layers, title: "Transferable ERC-721", desc: "Standard NFTs — trade freely in any marketplace." }
    : { icon: Layers, title: "Non-transferable card", desc: "Soulbound to your wallet — membership can't be bought or sold." },
];

export function ClubContent() {
  const { collections, isLoading } = useClubCollections();

  return (
    <div className="pb-16 space-y-10">
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              plain
              icon={<Users className="h-4 w-4 text-white" />}
              title="IP Club"
              subtitle="Membership clubs backed by an on-chain NFT card — give your closest fans a way in."
            />
          </div>
        </FadeIn>
      </section>

      <section className="px-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CLUB_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <Icon className="h-5 w-5 text-brand-indigo" />
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section className="px-4 space-y-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Live</p>
              <h2 className="text-xl font-bold mt-0.5">Clubs</h2>
            </div>
            <Button asChild size="sm" className="bg-brand-indigo hover:brightness-110 text-white gap-1.5">
              <Link href="/launchpad/club/create">
                <Plus className="h-3.5 w-3.5" />
                Create Club
              </Link>
            </Button>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <ClubCardSkeleton key={i} />)}
          </div>
        ) : collections.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-16 text-center space-y-3">
              <div className="flex justify-center">
                <Users className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground">
                No clubs yet. Be the first to launch one on Medialane.
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col) => (
              <StaggerItem key={col.contractAddress}>
                <ClubCard collection={col} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}

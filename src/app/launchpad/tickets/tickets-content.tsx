"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Ticket, ShieldCheck, Plus, Layers, Clock } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { useTicketCollections } from "@/hooks/use-tickets";
import { ipfsToHttp } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

function TicketCollectionCard({ collection }: { collection: ApiCollection }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "T").charAt(0).toUpperCase();

  return (
    <Link href={`/launchpad/tickets/${collection.contractAddress}`} className="block">
      <div className="bento-cell overflow-hidden flex flex-col hover:border-teal-500/40 transition-colors">
        <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={collection.name ?? "Ticket Collection"}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/40 via-cyan-500/30 to-teal-900/50 flex items-center justify-center">
              <span className="text-7xl font-black text-white/10 select-none">{initial}</span>
            </div>
          )}
          <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
            TICKETS
          </span>
        </div>
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm leading-tight">{collection.name ?? "Unnamed Ticket Collection"}</p>
            {collection.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>
          {collection.symbol && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              {collection.symbol}
            </span>
          )}
          <div className="text-xs text-teal-500 font-medium">View events →</div>
        </div>
      </div>
    </Link>
  );
}

function TicketCollectionCardSkeleton() {
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

const TICKET_FEATURES = [
  { icon: Ticket, title: "Your own contract", desc: "Deploy once — trade tickets like any other NFT." },
  { icon: ShieldCheck, title: "Redeemable", desc: "Mark tickets used at the door without burning them." },
  { icon: Clock, title: "Expiration built in", desc: "Set when a ticket stops granting access." },
  { icon: Layers, title: "Multiple events, one contract", desc: "Run recurring events under your own ticket book." },
];

export function TicketsContent() {
  const { collections, isLoading } = useTicketCollections();

  return (
    <div className="pb-16 space-y-10">
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              icon={<Ticket className="h-4 w-4 text-white" />}
              title="IP Tickets"
              subtitle="Sell verifiable tickets for your events — each one a real NFT your buyers can hold, trade, and show at the door."
            />
          </div>
        </FadeIn>
      </section>

      <section className="px-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TICKET_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <Icon className="h-5 w-5 text-teal-500" />
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
              <h2 className="text-xl font-bold mt-0.5">Ticket collections</h2>
            </div>
            <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
              <Link href="/launchpad/tickets/create">
                <Plus className="h-3.5 w-3.5" />
                Create Tickets
              </Link>
            </Button>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <TicketCollectionCardSkeleton key={i} />)}
          </div>
        ) : collections.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-16 text-center space-y-3">
              <div className="flex justify-center">
                <Ticket className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground">
                No ticket collections yet. Be the first to sell tickets on Medialane.
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col) => (
              <StaggerItem key={col.contractAddress}>
                <TicketCollectionCard collection={col} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}

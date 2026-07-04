"use client";

import Image from "next/image";
import Link from "next/link";
import { Ticket, ArrowLeft, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketMintButton } from "@/components/claim/ticket-mint-button";
import { useTicketCollectionBatches } from "@/hooks/use-tickets";
import { useCollection } from "@/hooks/use-collections";
import { ipfsToHttp } from "@/lib/utils";
import { getListableTokens } from "@medialane/sdk";

function formatExpiration(expiration: string): string {
  return new Date(Number(expiration) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(price: string, paymentToken: string | null): string {
  if (price === "0" || !paymentToken) return "Free";
  const token = getListableTokens().find((t) => t.address.toLowerCase() === paymentToken.toLowerCase());
  const decimals = token?.decimals ?? 18;
  const priceNum = Number((BigInt(price) * 10000n) / BigInt(10 ** decimals)) / 10000;
  return `${priceNum} ${token?.symbol ?? "tokens"}`;
}

export default function TicketsDetailPage({ contract }: { contract: string }) {
  const { collection, isLoading: collectionLoading } = useCollection(contract);
  const { batches, isLoading: batchesLoading } = useTicketCollectionBatches(contract);

  const isLoading = collectionLoading || batchesLoading;
  const imageUrl = collection?.image ? ipfsToHttp(collection.image) : null;

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Ticket className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">Ticket collection not found or not yet indexed.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/tickets">← Back to tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-8">
      <FadeIn>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/launchpad/tickets">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            All ticket collections
          </Link>
        </Button>
      </FadeIn>

      {imageUrl && (
        <FadeIn delay={0.04}>
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted">
            <Image src={imageUrl} alt={collection.name ?? "Ticket collection"} fill className="object-cover" unoptimized />
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.08}>
        <div className="space-y-2">
          <span className="inline-flex text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 rounded-full px-2 py-0.5">
            IP TICKETS
          </span>
          <h1 className="text-3xl font-black">{collection.name ?? "Unnamed Ticket Collection"}</h1>
          {collection.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{collection.description}</p>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.12}>
        <div className="space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-500" />
            Events in this collection
          </p>

          {batches.length === 0 ? (
            <div className="bento-cell border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">No events published in this collection yet.</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.ticketCollectionId} className="bento-cell p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Event #{batch.ticketCollectionId}</p>
                  <span className="text-xs font-medium text-teal-500">{formatPrice(batch.price, batch.paymentToken)}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  Expires {formatExpiration(batch.expiration)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {batch.minted} / {batch.maxSupply} minted
                </p>
                <TicketMintButton
                  collectionAddress={contract}
                  ticketCollectionId={batch.ticketCollectionId}
                  price={batch.price}
                  paymentToken={batch.paymentToken}
                  active={batch.active}
                />
              </div>
            ))
          )}
        </div>
      </FadeIn>
    </div>
  );
}

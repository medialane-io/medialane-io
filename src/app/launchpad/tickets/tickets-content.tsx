"use client";

import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Ticket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { CollectionCard } from "@medialane/ui";
import { collectionHref } from "@/lib/routes";
import { useWallet } from "@/hooks/use-wallet";
import { useMyTicketCollections } from "@/hooks/use-tickets";

export function TicketsContent() {
  const { isSignedIn } = useUser();
  const { address } = useWallet();
  const { collections, isLoading } = useMyTicketCollections(address ?? null);

  return (
    <div className="pb-16 space-y-10 max-w-5xl mx-auto">
      <section className="px-4 pt-10">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              plain
              icon={<Ticket className="h-4 w-4 text-white" />}
              title="IP Tickets"
              subtitle="Create a tickets collection, then mint tickets from its collection page."
              headerAccessory={
                <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                  <Link href="/launchpad/tickets/create">
                    <Plus className="h-3.5 w-3.5" />
                    Create collection
                  </Link>
                </Button>
              }
            />
          </div>
        </FadeIn>
      </section>

      <section className="px-4 space-y-4">
        <FadeIn>
          <div>
            <p className="section-label">Your collections</p>
            <h2 className="text-xl font-bold mt-0.5">Ticket collections</h2>
          </div>
        </FadeIn>

        {!isSignedIn ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                  <Ticket className="h-8 w-8 text-teal-500/40" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Sign in to see your collections</p>
                <p className="text-xs text-muted-foreground">
                  Your tickets collections appear here once you sign in.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">Sign in</Button>
              </SignInButton>
            </div>
          </FadeIn>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                  <Ticket className="h-8 w-8 text-teal-500/40" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">No collections yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first tickets collection.
                </p>
              </div>
              <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                <Link href="/launchpad/tickets/create">
                  <Plus className="h-3.5 w-3.5" />
                  Create collection
                </Link>
              </Button>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((col) => (
              <StaggerItem key={col.contractAddress}>
                <CollectionCard
                  collection={col}
                  href={collectionHref("STARKNET", col.contractAddress)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}

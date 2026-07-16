"use client";

import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { CollectionCard } from "@medialane/ui";
import { collectionHref } from "@/lib/routes";
import { useWallet } from "@/hooks/use-wallet";
import { useMyClubCollections } from "@/hooks/use-club";

export function ClubContent() {
  const { isSignedIn } = useUser();
  const { address } = useWallet();
  const { collections, isLoading } = useMyClubCollections(address ?? null);

  return (
    <div className="pb-16 space-y-10 max-w-5xl mx-auto">
      <section className="px-4 pt-10">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              plain
              icon={<Users className="h-4 w-4 text-white" />}
              title="IP Club"
              subtitle="Create a club, then create membership tiers from its collection page."
              headerAccessory={
                <Button asChild size="sm" className="bg-brand-purple hover:brightness-110 text-white gap-1.5">
                  <Link href="/launchpad/club/create">
                    <Plus className="h-3.5 w-3.5" />
                    Create club
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
            <p className="section-label">Your clubs</p>
            <h2 className="text-xl font-bold mt-0.5">Club collections</h2>
          </div>
        </FadeIn>

        {!isSignedIn ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-brand-purple/40" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Sign in to see your clubs</p>
                <p className="text-xs text-muted-foreground">
                  Your clubs appear here once you sign in.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button size="sm" className="bg-brand-purple hover:brightness-110 text-white">Sign in</Button>
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
                <div className="h-16 w-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-brand-purple/40" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">No clubs yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first club.
                </p>
              </div>
              <Button asChild size="sm" className="bg-brand-purple hover:brightness-110 text-white gap-1.5">
                <Link href="/launchpad/club/create">
                  <Plus className="h-3.5 w-3.5" />
                  Create club
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

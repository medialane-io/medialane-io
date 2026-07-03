"use client";

import Link from "next/link";
import { Handshake, ShieldCheck, Coins, Plus } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { SponsorshipBidButton } from "@/components/claim/sponsorship-bid-button";
import { SponsorshipAcceptButton } from "@/components/claim/sponsorship-accept-button";
import { useSponsorshipOffers, useSponsorshipBids } from "@/hooks/use-sponsorship";
import type { SponsorshipOffer } from "@/hooks/use-sponsorship";
import { useSessionKey } from "@/hooks/use-session-key";

function OfferBids({ offerId, licenseTermsUri }: { offerId: string; licenseTermsUri: string }) {
  const { bids, isLoading, mutate } = useSponsorshipBids(offerId);
  const activeBids = bids.filter((b) => b.status === "ACTIVE");

  if (isLoading) return <Skeleton className="h-8 w-full" />;
  if (activeBids.length === 0) return <p className="text-xs text-muted-foreground">No bids yet.</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Bids</p>
      {activeBids.map((bid) => (
        <div key={bid.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-muted-foreground">{bid.sponsor}</span>
          <SponsorshipAcceptButton
            offerId={offerId}
            sponsor={bid.sponsor}
            licenseTermsUri={licenseTermsUri}
            onAccepted={() => mutate()}
          />
        </div>
      ))}
    </div>
  );
}

function OfferCard({ offer }: { offer: SponsorshipOffer }) {
  const { walletAddress } = useSessionKey();
  const isAuthor = walletAddress && offer.author.toLowerCase() === walletAddress.toLowerCase();

  return (
    <div className="bento-cell p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Handshake className="h-4 w-4 text-rose-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Sponsorship</span>
      </div>
      <p className="text-sm font-semibold">Token #{offer.tokenId}</p>
      <p className="text-xs text-muted-foreground truncate">{offer.nftContract}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Coins className="h-3 w-3" />
        Min {offer.minAmount}
      </p>

      {isAuthor ? (
        <OfferBids offerId={offer.offerId} licenseTermsUri={offer.licenseTermsUri} />
      ) : (
        <SponsorshipBidButton offerId={offer.offerId} minAmount={offer.minAmount} paymentToken={offer.paymentToken} />
      )}
    </div>
  );
}

function OfferCardSkeleton() {
  return (
    <div className="bento-cell p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

const SPONSORSHIP_FEATURES = [
  { icon: Handshake, title: "Direct settlement", desc: "Sponsor → author, no escrow — the contract never holds funds." },
  { icon: ShieldCheck, title: "Owner-verified", desc: "The offer author must own the asset, checked on-chain at creation and acceptance." },
  { icon: Coins, title: "Open bidding", desc: "Any sponsor can bid — or restrict an offer to one invited sponsor." },
];

export function SponsorshipContent() {
  const { offers, isLoading } = useSponsorshipOffers();
  const openOffers = offers.filter((o) => o.open);

  return (
    <div className="pb-16 space-y-10">
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              icon={<Handshake className="h-4 w-4 text-white" />}
              title="IP Sponsorship"
              subtitle="Sponsorship offers and licenses anchored to Medialane assets — sponsor a creator's IP, get a license."
            />
          </div>
        </FadeIn>
      </section>

      <section className="px-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SPONSORSHIP_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <Icon className="h-5 w-5 text-rose-500" />
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
              <p className="section-label">Open</p>
              <h2 className="text-xl font-bold mt-0.5">Sponsorship offers</h2>
            </div>
            <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5">
              <Link href="/launchpad/sponsorship/create">
                <Plus className="h-3.5 w-3.5" />
                Create Offer
              </Link>
            </Button>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <OfferCardSkeleton key={i} />)}
          </div>
        ) : openOffers.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-16 text-center space-y-3">
              <div className="flex justify-center">
                <Handshake className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground">
                No open sponsorship offers yet. Create one from an asset you own.
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {openOffers.map((offer) => (
              <StaggerItem key={offer.id}>
                <OfferCard offer={offer} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}

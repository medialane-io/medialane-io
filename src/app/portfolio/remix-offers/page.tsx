"use client";

import { useState } from "react";
import { useSessionKey } from "@/hooks/use-session-key";
import { useRemixOffers } from "@/hooks/use-remix-offers";
import { ApproveMintSheet } from "@/components/portfolio/approve-mint-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Check, X, Clock } from "lucide-react";
import { AddressDisplay } from "@/components/shared/address-display";
import { timeAgo } from "@/lib/utils";
import type { RemixOffer } from "@/types/remix-offers";
import Link from "next/link";

export default function PortfolioRemixOffersPage() {
  const { walletAddress } = useSessionKey();
  const { offers: incoming, isLoading: loadingIn, mutate: mutateIn } = useRemixOffers("creator");
  const { offers: outgoing, isLoading: loadingOut } = useRemixOffers("requester");

  const [approveOffer, setApproveOffer] = useState<RemixOffer | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);

  const handleApproveClick = (offer: RemixOffer) => {
    setApproveOffer(offer);
    setApproveOpen(true);
  };

  const pendingIn = incoming.filter((o) => o.status === "PENDING" || o.status === "AUTO_PENDING");
  const approvedIn = incoming.filter((o) => o.status === "APPROVED");
  const completedIn = incoming.filter((o) => o.status === "COMPLETED" || o.status === "SELF_MINTED");
  const rejectedIn = incoming.filter((o) => o.status === "REJECTED" || o.status === "EXPIRED");

  if (!walletAddress) return null;

  return (
    <div className="space-y-8">
      {/* Incoming remix offers (creator view) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Remix Requests</h2>
          {pendingIn.length > 0 && (
            <span className="h-5 min-w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1">
              {pendingIn.length}
            </span>
          )}
        </div>

        {loadingIn ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : incoming.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No remix requests yet. When someone requests to remix your assets, they'll appear here.
          </div>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border">
            {[...pendingIn, ...approvedIn, ...completedIn, ...rejectedIn].map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={offer.status} />
                    <Link
                      href={`/asset/${offer.originalContract}/${offer.originalTokenId}`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate"
                    >
                      Token #{offer.originalTokenId}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {offer.requesterAddress && (
                      <AddressDisplay address={offer.requesterAddress} chars={4} showCopy={false} />
                    )}
                    <span>·</span>
                    <span>{offer.licenseType}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(offer.createdAt)}</span>
                  </div>
                  {offer.message && (
                    <p className="text-xs text-muted-foreground italic truncate max-w-xs">"{offer.message}"</p>
                  )}
                </div>
                {(offer.status === "PENDING" || offer.status === "AUTO_PENDING") && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApproveClick(offer)}>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
                {offer.status === "APPROVED" && offer.remixContract && offer.remixTokenId && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/asset/${offer.remixContract}/${offer.remixTokenId}`}>View remix</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing remix offers (requester view) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Remix Requests</h2>
        </div>

        {loadingOut ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : outgoing.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            You haven&apos;t submitted any remix requests yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border">
            {outgoing.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={offer.status} />
                    <Link
                      href={`/asset/${offer.originalContract}/${offer.originalTokenId}`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate"
                    >
                      Token #{offer.originalTokenId}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{offer.licenseType}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(offer.createdAt)}</span>
                  </div>
                </div>
                {offer.status === "COMPLETED" && offer.remixContract && offer.remixTokenId && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/asset/${offer.remixContract}/${offer.remixTokenId}`}>
                      <GitBranch className="h-3.5 w-3.5 mr-1" />
                      Buy remix
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <ApproveMintSheet
        offer={approveOffer}
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onSuccess={() => mutateIn()}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: RemixOffer["status"] }) {
  const config: Record<RemixOffer["status"], { label: string; className: string }> = {
    PENDING:      { label: "Pending",   className: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
    AUTO_PENDING: { label: "Auto",      className: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
    APPROVED:     { label: "Approved",  className: "bg-primary/10 text-primary border border-primary/20" },
    COMPLETED:    { label: "Completed", className: "bg-green-500/10 text-green-500 border border-green-500/20" },
    REJECTED:     { label: "Rejected",  className: "bg-destructive/10 text-destructive border border-destructive/20" },
    EXPIRED:      { label: "Expired",   className: "bg-muted text-muted-foreground border border-border" },
    SELF_MINTED:  { label: "Self mint", className: "bg-primary/10 text-primary border border-primary/20" },
  };
  const c = config[status];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

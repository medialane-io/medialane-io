"use client";

import { useState } from "react";
import Link from "next/link";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { CheckCircle2, Handshake, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { useSessionKey } from "@/hooks/use-session-key";
import { useWriteAction } from "@/hooks/use-write-action";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { STARKNET_IP_SPONSORSHIP_CONTRACT } from "@/lib/constants";
import { IPSponsorshipABI } from "@medialane/sdk/starknet";
import {
  useSponsorshipProposals, useSponsorshipOffers, useSponsorshipBids, useSponsorshipLicenses,
  type SponsorshipOffer,
} from "@/hooks/use-sponsorship";
import { assetHref } from "@/lib/routes";

function OfferBidsRow({ offer }: { offer: SponsorshipOffer }) {
  const { bids, isLoading, mutate } = useSponsorshipBids(offer.offerId);
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [activeSponsor, setActiveSponsor] = useState<string | null>(null);

  const acceptBid = (sponsor: string) => {
    setActiveSponsor(sponsor);
    void action.run(async (secret) => {
      const contract = new Contract(IPSponsorshipABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_CONTRACT, starknetProvider);
      const call = contract.populate("accept_bid", [BigInt(offer.offerId), sponsor]);
      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: "accept_bid", calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") await mutate();
      return result;
    });
  };

  if (isLoading || bids.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
      <p className="text-xs font-semibold text-muted-foreground">
        Bids on <Link href={assetHref("STARKNET", offer.nftContract, offer.tokenId)} className="underline underline-offset-2">Token #{offer.tokenId}</Link>
      </p>
      {bids.map((bid) => (
        <div key={bid.id} className="flex items-center justify-between gap-2 text-xs">
          <AddressDisplay address={bid.sponsor} chars={4} showCopy={false} className="text-muted-foreground" />
          <Button
            size="sm"
            className="bg-brand-rose hover:brightness-110 text-white h-7 px-2.5"
            disabled={busy}
            onClick={() => acceptBid(bid.sponsor)}
          >
            {busy && activeSponsor === bid.sponsor ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          </Button>
        </div>
      ))}
      <PinDialog {...action.pinDialogProps} title="Accept bid" description="Enter your PIN to confirm." />
      <WalletSetupGate action={action} />
    </div>
  );
}

function ReceivedProposalsSection({ walletAddress }: { walletAddress: string }) {
  const { proposals, isLoading, mutate } = useSponsorshipProposals({ owner: walletAddress, open: true });
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [activeId, setActiveId] = useState<string | null>(null);

  const respond = (proposalId: string, method: "accept_proposal" | "reject_proposal") => {
    setActiveId(proposalId);
    void action.run(async (secret) => {
      const contract = new Contract(IPSponsorshipABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_CONTRACT, starknetProvider);
      const call = contract.populate(method, [BigInt(proposalId)]);
      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: method, calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") await mutate();
      return result;
    });
  };

  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (proposals.length === 0) return <p className="text-sm text-muted-foreground">No proposals awaiting your decision.</p>;

  return (
    <div className="space-y-2">
      {proposals.map((p) => (
        <div key={p.id} className="bento-cell p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              <Link href={assetHref("STARKNET", p.nftContract, p.tokenId)} className="hover:underline">Token #{p.tokenId}</Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <AddressDisplay address={p.proposer} chars={4} showCopy={false} /> proposed {p.amount}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => respond(p.proposalId, "reject_proposal")}>
              {busy && activeId === p.proposalId ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="bg-brand-rose hover:brightness-110 text-white" disabled={busy} onClick={() => respond(p.proposalId, "accept_proposal")}>
              {busy && activeId === p.proposalId ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ))}
      <PinDialog {...action.pinDialogProps} title="Respond to proposal" description="Enter your PIN to confirm." />
      <WalletSetupGate action={action} />
    </div>
  );
}

function SentProposalsSection({ walletAddress }: { walletAddress: string }) {
  const { proposals, isLoading, mutate } = useSponsorshipProposals({ proposer: walletAddress, open: true });
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [activeId, setActiveId] = useState<string | null>(null);

  const withdraw = (proposalId: string) => {
    setActiveId(proposalId);
    void action.run(async (secret) => {
      const contract = new Contract(IPSponsorshipABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_CONTRACT, starknetProvider);
      const call = contract.populate("withdraw_proposal", [BigInt(proposalId)]);
      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: "withdraw_proposal", calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") await mutate();
      return result;
    });
  };

  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (proposals.length === 0) return <p className="text-sm text-muted-foreground">No pending proposals sent.</p>;

  return (
    <div className="space-y-2">
      {proposals.map((p) => (
        <div key={p.id} className="bento-cell p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              <Link href={assetHref("STARKNET", p.nftContract, p.tokenId)} className="hover:underline">Token #{p.tokenId}</Link>
            </p>
            <p className="text-xs text-muted-foreground">You proposed {p.amount}</p>
          </div>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => withdraw(p.proposalId)}>
            {busy && activeId === p.proposalId ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
            Withdraw
          </Button>
        </div>
      ))}
      <PinDialog {...action.pinDialogProps} title="Withdraw proposal" description="Enter your PIN to confirm." />
      <WalletSetupGate action={action} />
    </div>
  );
}

export default function PortfolioSponsorshipsPage() {
  const { walletAddress } = useSessionKey();
  const { offers } = useSponsorshipOffers(walletAddress ? { author: walletAddress, open: true } : undefined);
  const { licenses: held, isLoading: heldLoading } = useSponsorshipLicenses(walletAddress ? { holder: walletAddress } : undefined);
  const { licenses: issued, isLoading: issuedLoading } = useSponsorshipLicenses(walletAddress ? { author: walletAddress } : undefined);

  if (!walletAddress) return null;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2"><Handshake className="h-4 w-4 text-brand-rose" />Proposals awaiting your decision</h2>
        <ReceivedProposalsSection walletAddress={walletAddress} />
      </section>

      {offers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold">Bids on your offers</h2>
          <div className="space-y-2">
            {offers.map((o) => <OfferBidsRow key={o.id} offer={o} />)}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Proposals you&apos;ve sent</h2>
        <SentProposalsSection walletAddress={walletAddress} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Licenses you hold</h2>
        {heldLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : held.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sponsorship licenses yet.</p>
        ) : (
          <div className="space-y-2">
            {held.map((l) => (
              <div key={l.id} className="bento-cell p-4">
                <p className="text-sm font-semibold">
                  <Link href={assetHref("STARKNET", l.assetContract, l.assetTokenId)} className="hover:underline">License on Token #{l.assetTokenId}</Link>
                </p>
                <p className="text-xs text-muted-foreground">from <AddressDisplay address={l.author} chars={4} showCopy={false} /></p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Licenses issued on your work</h2>
        {issuedLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : issued.length === 0 ? (
          <p className="text-sm text-muted-foreground">No licenses issued yet.</p>
        ) : (
          <div className="space-y-2">
            {issued.map((l) => (
              <div key={l.id} className="bento-cell p-4">
                <p className="text-sm font-semibold">
                  <Link href={assetHref("STARKNET", l.assetContract, l.assetTokenId)} className="hover:underline">License on Token #{l.assetTokenId}</Link>
                </p>
                <p className="text-xs text-muted-foreground">held by <AddressDisplay address={l.currentHolder ?? l.recipient} chars={4} showCopy={false} /></p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

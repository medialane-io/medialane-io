"use client";

import { useState } from "react";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Handshake, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { STARKNET_IP_SPONSORSHIP_CONTRACT } from "@/lib/constants";
import { AssetPicker, LicenseTermsBuilder, EMPTY_SPONSORSHIP_TERMS, type OwnedAsset, type SponsorshipTerms } from "@medialane/ui";
import { IPSponsorshipABI, getTokenBySymbol, SUPPORTED_TOKENS } from "@medialane/sdk";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { Handshake as HandshakeAsideIcon, ShieldCheck, Coins, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { resolveTokenImage } from "@/lib/utils";
import { usePendingProposalsForAsset } from "@/hooks/use-sponsorship";
import { toast } from "sonner";

const LISTABLE_TOKENS = SUPPORTED_TOKENS.filter((t) => t.listable);
const TOKEN_SYMBOLS = LISTABLE_TOKENS.map((t) => t.symbol);

function sponsorshipContract() {
  return new Contract(IPSponsorshipABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_CONTRACT, starknetProvider);
}

function CreateSponsorshipAside() {
  return (
    <ClaimRail
      included={[
        { icon: HandshakeAsideIcon, title: "Direct settlement", desc: "Sponsor pays you directly — no escrow, no middleman." },
        { icon: ShieldCheck, title: "Owner-verified", desc: "You must own the asset, checked on-chain when you create and when you accept." },
        { icon: Coins, title: "Open bidding", desc: "Any sponsor can bid, or invite one specific sponsor." },
      ]}
      steps={[
        "Choose your terms — an asset you own, or one you'd like to sponsor",
        "The other side responds — bids come in, or a proposal is accepted",
        "Settle instantly: they receive a license, you receive payment",
      ]}
      trustIcon={Gift}
      trustLead="No escrow, ever."
      trust="The contract never holds funds — settlement is direct, sponsor to author."
    />
  );
}

/** Pending proposals on a specific owned asset, with accept/reject actions. */
function PendingProposalsPanel({ nftContract }: { nftContract: string }) {
  const { proposals, isLoading, mutate } = usePendingProposalsForAsset(nftContract);
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [activeId, setActiveId] = useState<string | null>(null);

  const respond = (proposalId: string, method: "accept_proposal" | "reject_proposal") => {
    setActiveId(proposalId);
    void action.run(async (secret) => {
      const call = sponsorshipContract().populate(method, [BigInt(proposalId)]);
      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: method, calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") await mutate();
      return result;
    });
  };

  if (isLoading) return null;
  if (proposals.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border/40 p-3">
      <p className="text-xs font-semibold text-muted-foreground">Pending proposals on this asset</p>
      {proposals.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-muted-foreground">{p.proposer} — {p.amount}</span>
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

type Mode = "offer" | "propose";

export default function CreateSponsorshipOfferPage() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const [mode, setMode] = useState<Mode>("offer");
  const [selectedAsset, setSelectedAsset] = useState<OwnedAsset | null>(null);
  const [proposeContract, setProposeContract] = useState("");
  const [proposeTokenId, setProposeTokenId] = useState("");
  const [terms, setTerms] = useState<SponsorshipTerms>({ ...EMPTY_SPONSORSHIP_TERMS, paymentTokenSymbol: "USDC" });

  const { tokens: ownedTokens, isLoading: assetsLoading } = useTokensByOwner(walletAddress ?? null, 1, 100);
  const ownedAssets: OwnedAsset[] = ownedTokens.map((t) => ({
    contractAddress: t.contractAddress,
    tokenId: t.tokenId,
    name: t.metadata?.name ?? `Token #${t.tokenId}`,
    image: resolveTokenImage(t.metadata?.image),
  }));

  const nftContract = mode === "offer" ? selectedAsset?.contractAddress : proposeContract.trim();
  const tokenId = mode === "offer" ? selectedAsset?.tokenId : proposeTokenId.trim();

  const onSubmit = () => {
    if (!nftContract || !tokenId) {
      toast.error(mode === "offer" ? "Pick an asset first" : "Enter the asset's contract and token id");
      return;
    }
    if (!terms.amount || Number(terms.amount) <= 0) { toast.error("Enter an amount"); return; }
    if (!terms.licenseText.trim()) { toast.error("Add license terms"); return; }
    const token = getTokenBySymbol(terms.paymentTokenSymbol);
    if (!token) { toast.error("Unsupported currency"); return; }
    const durationDays = Number(terms.durationDays);
    if (!durationDays || durationDays <= 0) { toast.error("Enter a license length"); return; }

    void action.run(async (secret) => {
      const licenseTermsUri = await pinLaunchpadMetadata({
        terms: terms.licenseText,
        transferable: terms.transferable,
        royaltyPercent: Number(terms.royaltyPercent || "0"),
      });

      const amount = BigInt(Math.round(Number(terms.amount) * 10 ** token.decimals));
      const duration = durationDays * 86400;
      const royaltyBps = BigInt(Math.round(Number(terms.royaltyPercent || "0") * 100));

      const contract = sponsorshipContract();
      const call = mode === "offer"
        ? contract.populate("create_offer", [
            nftContract, BigInt(tokenId), amount, duration, token.address,
            licenseTermsUri, terms.transferable, royaltyBps, { None: undefined },
          ])
        : contract.populate("propose_sponsorship", [
            nftContract, BigInt(tokenId), amount, duration, 0, token.address,
            licenseTermsUri, terms.transferable, royaltyBps,
          ]);
      const entrypoint = mode === "offer" ? "create_offer" : "propose_sponsorship";

      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint, calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed" && mode === "offer") rewardToast("create_sponsorship_offer");
      return result;
    });
  };

  if (action.status === "error") {
    return <LaunchpadErrorState description={action.error ?? "Failed to publish"} backHref="/launchpad/sponsorship" backLabel="Back to Sponsorship launchpad" onRetry={action.reset} />;
  }
  if (busy) return <LaunchpadProcessingState title={mode === "offer" ? "Creating your sponsorship offer…" : "Sending your proposal…"} />;

  if (action.status === "success") {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-brand-rose/10"
        iconClassName="text-brand-rose"
        actionClassName="bg-brand-rose hover:brightness-110 text-white"
        title={mode === "offer" ? "Offer created" : "Proposal sent"}
        description={mode === "offer"
          ? "Your sponsorship offer is live onchain. It will appear in the launchpad within a minute once indexed."
          : "The asset's owner can now accept or decline your proposal."}
        backHref="/launchpad/sponsorship"
        backLabel="Back to Sponsorship launchpad"
        actionLabel="Create another"
        onAction={() => { action.reset(); setSelectedAsset(null); setProposeContract(""); setProposeTokenId(""); setTerms({ ...EMPTY_SPONSORSHIP_TERMS, paymentTokenSymbol: "USDC" }); }}
      />
    );
  }

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Handshake}
        iconClassName="text-brand-rose"
        title="Sign in to set up a sponsorship"
        description="Sign in to publish onchain."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
        icon={<Handshake className="h-4 w-4 text-white" />}
        title="Set up a sponsorship"
        subtitle="Either side can start the deal — offer your own asset for sponsors to bid on, or propose terms directly on one you'd like to sponsor."
        aside={<CreateSponsorshipAside />}
      >
        <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border p-1 bg-card">
              {(["offer", "propose"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={
                    mode === m
                      ? "px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-brand-purple to-brand-blue text-white"
                      : "px-4 py-1.5 rounded-full text-sm font-semibold text-muted-foreground"
                  }
                >
                  {m === "offer" ? "Offer my asset" : "Propose to sponsor"}
                </button>
              ))}
            </div>

            {mode === "offer" ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Pick an asset you own</p>
                <AssetPicker
                  assets={ownedAssets}
                  isLoading={assetsLoading}
                  selected={selectedAsset}
                  onSelect={setSelectedAsset}
                  emptyStateHref="/create/asset"
                  emptyStateLabel="Create one"
                />
                {selectedAsset ? <PendingProposalsPanel nftContract={selectedAsset.contractAddress} /> : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Which asset do you want to sponsor?</p>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Input placeholder="Asset contract address (0x…)" value={proposeContract} onChange={(e) => setProposeContract(e.target.value)} />
                  <Input className="w-28" placeholder="Token ID" value={proposeTokenId} onChange={(e) => setProposeTokenId(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">Find these on the asset&apos;s page — copy the contract address and token id.</p>
              </div>
            )}

            <div className="pt-2 border-t border-border/30">
              <LicenseTermsBuilder
                value={terms}
                onChange={setTerms}
                tokenOptions={TOKEN_SYMBOLS}
                amountLabel={mode === "offer" ? "Minimum accepted bid" : "Amount you'll pay"}
                disabled={busy}
              />
            </div>

            <Button type="button" size="lg" className="w-full rounded-xl bg-brand-rose hover:brightness-110 text-white" disabled={busy} onClick={onSubmit}>
              {busy
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{mode === "offer" ? "Creating…" : "Sending…"}</>
                : <><Handshake className="h-4 w-4 mr-2" />{mode === "offer" ? "Create Offer" : "Send proposal"}</>}
            </Button>
          </div>
      </ClaimRouteShell>

      <PinDialog {...action.pinDialogProps} title={mode === "offer" ? "Create sponsorship offer" : "Send sponsorship proposal"} description="Enter your PIN to publish this onchain." />
      <WalletSetupGate action={action} />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Handshake, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { executeIntent, confirmIntentBestEffort } from "@/lib/wallet/intent-tx";
import { buildFeeCall } from "@medialane/sdk/starknet";
import { ioFeeConfig } from "@/lib/fee";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { AssetPicker, AssetSearchPicker, LicenseTermsBuilder, EMPTY_SPONSORSHIP_TERMS, toLicenseMetadata, toDurationDays, type OwnedAsset, type SponsorshipTerms } from "@medialane/ui";
import { apiFetch } from "@/lib/api-fetch";
import { getTokenBySymbol, SUPPORTED_TOKENS } from "@medialane/sdk";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { Handshake as HandshakeAsideIcon, ShieldCheck, Coins, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";
import { pinSponsorshipTerms } from "@/lib/launchpad-metadata";
import { resolveTokenImage } from "@/lib/utils";
import { usePendingProposalsForAsset } from "@/hooks/use-sponsorship";
import { toast } from "sonner";
import type { Call } from "starknet";

const LISTABLE_TOKENS = SUPPORTED_TOKENS.filter((t) => t.listable);
const TOKEN_SYMBOLS = LISTABLE_TOKENS.map((t) => t.symbol);

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
  const { address: walletAddress } = useWalletNativeSession();
  const client = useMedialaneClient();
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [activeId, setActiveId] = useState<string | null>(null);

  const respond = (proposalId: string, decision: "accept" | "reject", paymentToken: string, amount: string) => {
    if (!walletAddress) return;
    setActiveId(proposalId);
    void action.run(async (signer) => {
      const intentRes = decision === "accept"
        ? await client.api.acceptSponsorshipProposalIntent({ owner: walletAddress, proposalId })
        : await client.api.rejectSponsorshipProposalIntent({ owner: walletAddress, proposalId });
      const intent = intentRes.data;
      if (intent.requiresSignature) throw new Error("Unexpected signature requirement on sponsorship response");
      const calls: Call[] = [...(intent.calls as Call[])];

      // Bundle the platform fee into the SAME atomic multicall as the accept
      // — no separate fire-and-forget transaction.
      if (decision === "accept") {
        const feeCall = buildFeeCall(
          { surface: "sponsorship", token: paymentToken, grossAmount: BigInt(amount) },
          ioFeeConfig,
        );
        if (feeCall) {
          calls.push({
            contractAddress: feeCall.contractAddress,
            entrypoint: feeCall.entrypoint,
            calldata: feeCall.calldata as string[],
          });
        }
      }

      const { txHash } = await signer.execute(calls);
      await confirmIntentBestEffort(client, intent.id, txHash);
      await mutate();
      return { txHash };
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
            <Button size="sm" variant="outline" disabled={busy} onClick={() => respond(p.proposalId, "reject", p.paymentToken, p.amount)}>
              {busy && activeId === p.proposalId ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="bg-brand-rose hover:brightness-110 text-white" disabled={busy} onClick={() => respond(p.proposalId, "accept", p.paymentToken, p.amount)}>
              {busy && activeId === p.proposalId ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Mode = "offer" | "propose";

export default function CreateSponsorshipOfferPage() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const client = useMedialaneClient();
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const [mode, setMode] = useState<Mode>("propose");
  const [selectedAsset, setSelectedAsset] = useState<OwnedAsset | null>(null);
  const [proposeAsset, setProposeAsset] = useState<OwnedAsset | null>(null);
  const [terms, setTerms] = useState<SponsorshipTerms>({ ...EMPTY_SPONSORSHIP_TERMS, paymentTokenSymbol: "USDC" });

  const { tokens: ownedTokens, isLoading: assetsLoading } = useTokensByOwner(walletAddress ?? null, 1, 100);
  const ownedAssets: OwnedAsset[] = ownedTokens.map((t) => ({
    contractAddress: t.contractAddress,
    tokenId: t.tokenId,
    name: t.metadata?.name ?? `Token #${t.tokenId}`,
    image: resolveTokenImage(t.metadata?.image),
  }));

  // AssetSearchPicker debounces internally; this just shapes the request/response.
  const searchAssets = async (query: string): Promise<OwnedAsset[]> => {
    const res = await apiFetch<{ data: { tokens: { contractAddress: string; tokenId: string; name: string | null; image: string | null }[] } }>(
      `/v1/search?q=${encodeURIComponent(query)}&limit=16`
    );
    return res.data.tokens.map((t) => ({
      contractAddress: t.contractAddress,
      tokenId: t.tokenId,
      name: t.name ?? `Token #${t.tokenId}`,
      image: t.image ? resolveTokenImage(t.image) : null,
    }));
  };

  const nftContract = mode === "offer" ? selectedAsset?.contractAddress : proposeAsset?.contractAddress;
  const tokenId = mode === "offer" ? selectedAsset?.tokenId : proposeAsset?.tokenId;

  const onSubmit = () => {
    if (!walletAddress) { toast.error("Wallet not ready. Please refresh and try again."); return; }
    if (!nftContract || !tokenId) {
      toast.error(mode === "offer" ? "Choose which asset you're offering" : "Search for the asset you want to sponsor and pick it");
      return;
    }
    if (!terms.amount || Number(terms.amount) <= 0) { toast.error("Add an amount before continuing"); return; }
    const token = getTokenBySymbol(terms.paymentTokenSymbol);
    if (!token) { toast.error("Pick a currency"); return; }
    const durationDays = toDurationDays(terms);
    if (!durationDays) { toast.error("How long should the license last?"); return; }

    void action.run(async (signer) => {
      const licenseTermsUri = await pinSponsorshipTerms(toLicenseMetadata(terms));

      const amount = BigInt(Math.round(Number(terms.amount) * 10 ** token.decimals));
      const duration = durationDays * 86400;
      const royaltyBps = Math.round(Number(terms.royaltyPercent || "0") * 100);

      const intentRes = mode === "offer"
        ? await client.api.createSponsorshipOfferIntent({
            author: walletAddress, nftContract, tokenId, minAmount: amount.toString(),
            duration, paymentToken: token.address, licenseTermsUri,
            transferable: terms.transferable, royaltyBps,
          })
        : await client.api.createSponsorshipProposalIntent({
            proposer: walletAddress, nftContract, tokenId, amount: amount.toString(),
            duration, paymentToken: token.address, licenseTermsUri,
            transferable: terms.transferable, royaltyBps,
          });

      const result = await executeIntent(signer, client, intentRes.data, { confirm: false });
      if (mode === "offer") rewardToast("create_sponsorship_offer");
      return result;
    });
  };

  if (!hasWallet) {
    return (
      <LaunchpadSignedOutState
        icon={Handshake}
        iconClassName="text-brand-rose"
        title="Set up your wallet to set up a sponsorship"
        description="Set up your wallet to publish onchain."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
        icon={<Handshake className="h-4 w-4 text-white" />}
        title="Set up a sponsorship"
        subtitle="Found IP you'd like to back? Propose terms directly to its owner. Own something worth sponsoring? Post it and let sponsors bid."
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
                  emptyStateHref="/launchpad/single-editions"
                  emptyStateLabel="Create one"
                />
                {selectedAsset ? <PendingProposalsPanel nftContract={selectedAsset.contractAddress} /> : null}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Which asset do you want to sponsor?</p>
                <AssetSearchPicker
                  search={searchAssets}
                  selected={proposeAsset}
                  onSelect={setProposeAsset}
                  placeholder="Search by asset name or creator"
                />
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

            <div className="btn-border-animated p-[1px] rounded-2xl">
              <button
                type="button"
                disabled={busy}
                onClick={onSubmit}
                className="w-full h-12 rounded-[15px] flex items-center justify-center gap-2 text-base font-semibold text-white bg-transparent transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {busy
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{mode === "offer" ? "Creating…" : "Sending…"}</>
                  : <><Handshake className="h-4 w-4" />{mode === "offer" ? "Create Offer" : "Send proposal"}</>}
              </button>
            </div>
          </div>
      </ClaimRouteShell>

      <Dialog open={busy || action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-md">
          {busy ? (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="h-10 w-10 animate-spin text-brand-rose mx-auto" />
              <div className="space-y-1">
                <DialogTitle>{mode === "offer" ? "Creating your sponsorship offer…" : "Sending your proposal…"}</DialogTitle>
                <DialogDescription>Confirm in your wallet, then hang tight — this settles onchain.</DialogDescription>
              </div>
            </div>
          ) : action.status === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-brand-rose/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-brand-rose" />
                </div>
              </div>
              <div className="space-y-1">
                <DialogTitle>{mode === "offer" ? "Offer created" : "Proposal sent"}</DialogTitle>
                <DialogDescription>
                  {mode === "offer"
                    ? "Your sponsorship offer is live onchain. It will appear in the launchpad within a minute once indexed."
                    : "The asset's owner can now accept or decline your proposal."}
                </DialogDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/launchpad/sponsorship">Back to Sponsorship launchpad</Link>
                </Button>
                <Button
                  className="flex-1 bg-brand-rose hover:brightness-110 text-white"
                  onClick={() => { action.reset(); setSelectedAsset(null); setProposeAsset(null); setTerms({ ...EMPTY_SPONSORSHIP_TERMS, paymentTokenSymbol: "USDC" }); }}
                >
                  Create another
                </Button>
              </div>
            </div>
          ) : action.status === "error" ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <div className="space-y-1">
                <DialogTitle>Something went wrong</DialogTitle>
                <DialogDescription>{action.error ?? "Failed to publish. Your form is still filled in — just try again."}</DialogDescription>
              </div>
              <Button className="w-full bg-brand-rose hover:brightness-110 text-white" onClick={action.reset}>Try again</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

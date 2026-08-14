"use client";

import { useState } from "react";
import { getService } from "@medialane/sdk";
import { assetHref } from "@/lib/routes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { confirmRemixOffer } from "@/hooks/use-remix-offers";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { withSiwsAuth } from "@/lib/pinata-fetch";
import { readAssignedEditionId } from "@/lib/erc1155-edition";
import { executeIntent } from "@/lib/wallet/intent-tx";
import { useMarketplace } from "@/hooks/use-marketplace";
import { formatDisplayPrice } from "@/lib/utils";
import { AlertCircle, Check, GitBranch, Loader2 } from "lucide-react";
import type { RemixOffer } from "@/types/remix-offers";
import type { Call } from "starknet";
import { INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { friendlyErrorMessage } from "@/lib/friendly-error";

interface Props {
  offer: RemixOffer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function ApproveMintSheet({ offer, open, onOpenChange, onSuccess }: Props) {
  const { address: walletAddress, signer } = useWalletNativeSession();
  const { getValidToken: getValidSiwsToken, signIn: siwsSignIn } = useSiwsToken();
  const { createListing } = useMarketplace();
  const client = useMedialaneClient();

  const { collections } = useCollectionsByOwner(walletAddress ?? null);

  const eligibleCollections = collections.filter(
    (c) =>
      getService(c.service)?.id === "mip-erc1155" ||
      (getService(c.service)?.id === "mip-erc721" && c.collectionId != null)
  );

  const collectionKey = (c: (typeof eligibleCollections)[0]) => c.collectionId ?? c.contractAddress;

  type CollectionKeyable = Partial<{ collectionId: string; contractAddress: string }>;
  const defaultCollectionKey =
    collectionKey(
      (eligibleCollections.find((c) => c.contractAddress === offer?.originalContract) ?? eligibleCollections[0] ?? ({} as CollectionKeyable)) as (typeof eligibleCollections)[0]
    ) ?? null;

  const [selectedCollectionKey, setSelectedCollectionKey] = useState<string | null>(null);
  const [remixName, setRemixName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [newAssetLink, setNewAssetLink] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const effectiveCollectionKey = selectedCollectionKey ?? defaultCollectionKey;
  const selectedCollection = eligibleCollections.find((c) => collectionKey(c) === effectiveCollectionKey);

  const effectiveCollectionId = selectedCollection?.collectionId ?? null;

  const priceDisplay = offer?.price
    ? `${formatDisplayPrice(offer.price.formatted)} ${offer.price.currency}`
    : "—";

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedCollectionKey(null);
      setRemixName("");
      setDone(false);
      setNewAssetLink(null);
      setFormError(null);
      setApproveError(null);
    }
    onOpenChange(v);
  };

  const effectiveName = remixName.trim() || `Remix of Token #${offer?.originalTokenId}`;

  const handleApprove = () => {
    setFormError(null);
    if (!effectiveCollectionKey || !selectedCollection) {
      setFormError("Select a collection to mint into.");
      return;
    }
    if (selectedCollection.standard !== "ERC1155" && !effectiveCollectionId) {
      setFormError("This collection is not enrolled in the registry.");
      return;
    }
    void handleUnlocked().catch((err) => {
      setApproveError(friendlyErrorMessage(err, "Approval failed"));
      setLoading(false);
    });
  };

  const handleUnlocked = async () => {
    if (!offer || !walletAddress || !signer || !effectiveCollectionKey || !selectedCollection) return;
    setLoading(true);
    setApproveError(null);

    const standard = selectedCollection.standard ?? "ERC721";

    try {
      let authToken = getValidSiwsToken();
      if (!authToken) authToken = await siwsSignIn();
      if (!authToken) throw new Error("Secure your account first");

      const royaltyStr = offer.royaltyPct != null ? `${offer.royaltyPct}%` : undefined;
      const metadata = {
        name: effectiveName,
        description: `Remix of Token #${offer.originalTokenId}`,
        image: "",
        attributes: [
          { trait_type: "Parent Contract", value: offer.originalContract },
          { trait_type: "Parent Token ID", value: offer.originalTokenId },
          { trait_type: "Remix Type", value: "Derivative" },
          { trait_type: "License", value: offer.licenseType },
          { trait_type: "Commercial Use", value: offer.commercial ? "Yes" : "No" },
          { trait_type: "Derivatives", value: offer.derivatives ? "Yes" : "No" },
          ...(royaltyStr ? [{ trait_type: "Royalty", value: royaltyStr }] : []),
          { trait_type: "Creator", value: walletAddress },
        ],
      };
      const pinRes = await fetch("/api/pinata/json", withSiwsAuth(authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      }));
      const pinData = await pinRes.json().catch(() => ({}));
      if (!pinRes.ok || !pinData.uri) throw new Error(pinData.error ?? "Metadata upload failed");

      let remixTokenId: string;

      if (standard === "ERC1155") {

        const intentRes = await client.api.createMintIntent({
          owner: walletAddress,
          recipient: walletAddress,
          collectionContract: selectedCollection.contractAddress,
          tokenUri: pinData.uri,
          value: "1",
        });
        const result = await executeIntent(signer, client, intentRes.data, { confirm: false });
        remixTokenId = await readAssignedEditionId(result.txHash ?? "", selectedCollection.contractAddress);
      } else {

        const intentRes = await client.api.createMintIntent({
          owner: walletAddress,
          collectionId: effectiveCollectionId!,
          recipient: walletAddress,
          tokenUri: pinData.uri,
          royaltyBps: 0,
        });
        const mintIntent = intentRes.data;

        if (mintIntent.requiresSignature) throw new Error("Unexpected signed mint intent");
        const mintCalls = mintIntent.calls as unknown as Call[];
        if (!mintCalls?.length) throw new Error("No mint calls returned");

        await signer.execute(mintCalls);

        let polledTokenId: string | undefined;
        const mintDeadline = Date.now() + 10_000;
        while (Date.now() < mintDeadline) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const tokensRes = await client.api.getTokensByOwner(walletAddress, 1, 5);
            const newest = tokensRes.data?.find((t) => t.contractAddress === selectedCollection.contractAddress);
            if (newest) { polledTokenId = newest.tokenId; break; }
          } catch {  }
        }
        if (!polledTokenId) throw new Error("Could not determine remix token ID");
        remixTokenId = polledTokenId;
      }

      await createListing({
        assetContract: selectedCollection.contractAddress,
        tokenId: remixTokenId,
        price: offer.price?.raw ?? "0",
        currencySymbol: offer.price?.currency ?? "STRK",
        durationSeconds: 30 * 24 * 60 * 60,
        tokenStandard: standard === "ERC1155" ? "ERC1155" : undefined,
        amount: standard === "ERC1155" ? "1" : undefined,
      });

      let orderHash: string | undefined;
      const listingDeadline = Date.now() + 15_000;
      while (Date.now() < listingDeadline) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const ordersRes = await client.api.getActiveOrdersForToken(
            selectedCollection.contractAddress,
            remixTokenId
          );
          const listing = ordersRes.data?.find(
            (o) => o.status === "ACTIVE" && o.offer.itemType === standard
          );
          if (listing) { orderHash = listing.orderHash; break; }
        } catch {  }
      }
      if (!orderHash) throw new Error("Could not confirm listing orderHash — check portfolio shortly");

      await confirmRemixOffer(
        offer.id,
        {
          remixContract: selectedCollection.contractAddress,
          remixTokenId,
          approvedCollection: selectedCollection.contractAddress,
          orderHash,
        },
        authToken
      );

      setNewAssetLink(assetHref("STARKNET", selectedCollection.contractAddress, remixTokenId));
      setDone(true);
      setTimeout(() => onSuccess?.(), INDEXER_REVALIDATION_DELAY_MS);
    } catch (err: unknown) {
      setApproveError(friendlyErrorMessage(err, "Approval failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden gap-0 flex flex-col max-h-[90svh]">

        <div className="flex items-center gap-2 pr-10 pl-5 py-4 border-b border-border/60">
          <GitBranch className="h-4 w-4 text-primary shrink-0" />
          <DialogTitle className="text-base font-bold">Grant license &amp; mint</DialogTitle>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">License granted — derivative minted</p>
              <p className="text-sm text-muted-foreground">The buyer will see &quot;Complete Purchase&quot; in their portfolio.</p>
              {newAssetLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={newAssetLink}>View new asset</a>
                </Button>
              )}
              <Button className="w-full" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              {approveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{approveError}</AlertDescription>
                </Alert>
              )}
              {offer && (
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Token</span> #{offer.originalTokenId}</p>
                  <p><span className="text-muted-foreground">License</span> {offer.licenseType}</p>
                  <p><span className="text-muted-foreground">Price</span> {priceDisplay}</p>
                  {offer.message && <p className="text-muted-foreground italic">&quot;{offer.message}&quot;</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Remix Name</Label>
                <Input
                  placeholder={effectiveName}
                  value={remixName}
                  onChange={(e) => setRemixName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mint into collection</Label>
                {eligibleCollections.length === 0 ? (
                  <p className="text-xs text-destructive">No eligible collections.</p>
                ) : (
                  <Select
                    value={effectiveCollectionKey ?? ""}
                    onValueChange={setSelectedCollectionKey}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleCollections.map((c) => (
                        <SelectItem key={c.collectionId ?? c.contractAddress} value={c.collectionId ?? c.contractAddress}>
                          <span className="flex items-center gap-2">
                            {c.name ?? c.contractAddress.slice(0, 14) + "…"}
                            {c.standard && (
                              <span className="text-[10px] tabular-nums text-muted-foreground">{c.standard}</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </div>

        {!done && (
          <div className="px-5 pt-3 pb-5 border-t border-border/60 space-y-3">
            <button
              className="w-full h-11 rounded-[11px] bg-brand-purple text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              onClick={handleApprove}
              disabled={loading || eligibleCollections.length === 0}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
              Grant license & mint
            </button>
            <p className="text-[10px] text-center text-muted-foreground">Two onchain operations (mint + listing). Gas is free.</p>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

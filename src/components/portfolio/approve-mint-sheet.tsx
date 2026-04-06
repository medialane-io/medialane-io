"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinDialog, type PinDialogSubmitOptions } from "@/components/chipi/pin-dialog";
import { toast } from "sonner";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { confirmRemixOffer } from "@/hooks/use-remix-offers";
import { formatDisplayPrice } from "@/lib/utils";
import { getTokenByAddress } from "@medialane/sdk";
import { Check, GitBranch, Loader2 } from "lucide-react";
import type { RemixOffer } from "@/types/remix-offers";
import type { ChipiCall } from "@/hooks/use-chipi-transaction";
import { INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { maybeSavePreferredEncryptionIfUnset } from "@/lib/creator-encryption-preference";

interface Props {
  offer: RemixOffer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function ApproveMintSheet({ offer, open, onOpenChange, onSuccess }: Props) {
  const { getToken } = useAuth();
  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );
  const { walletAddress } = useSessionKey();
  const { executeTransaction } = useChipiTransaction();
  const { createListing } = useMarketplace();
  const client = useMedialaneClient();

  const { collections } = useCollectionsByOwner(walletAddress ?? null);
  const eligibleCollections = collections.filter((c) => c.collectionId != null);

  const defaultCollectionId =
    eligibleCollections.find((c) => c.contractAddress === offer?.originalContract)?.collectionId ??
    eligibleCollections[0]?.collectionId ??
    null;

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [remixName, setRemixName] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [newAssetLink, setNewAssetLink] = useState<string | null>(null);

  const effectiveCollectionId = selectedCollectionId ?? defaultCollectionId;
  const selectedCollection = eligibleCollections.find((c) => c.collectionId === effectiveCollectionId);

  const currencyToken = offer?.proposedCurrency ? getTokenByAddress(offer.proposedCurrency) : null;
  const priceDisplay =
    offer?.proposedPrice && currencyToken
      ? `${formatDisplayPrice((Number(BigInt(offer.proposedPrice)) / 10 ** currencyToken.decimals).toString())} ${currencyToken.symbol}`
      : "—";

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedCollectionId(null);
      setRemixName("");
      setDone(false);
      setNewAssetLink(null);
    }
    onOpenChange(v);
  };

  const effectiveName = remixName.trim() || `Remix of Token #${offer?.originalTokenId}`;

  const handleApprove = () => {
    if (!effectiveCollectionId || !selectedCollection) {
      toast.error("No eligible collection");
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string, opts?: PinDialogSubmitOptions) => {
    setPinOpen(false);
    if (!offer || !walletAddress || !effectiveCollectionId || !selectedCollection) return;
    setLoading(true);

    const encryptionPref = opts?.usedPasskey ? "PASSKEY" : "PIN";

    try {
      // 1. Upload remix IPFS metadata
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
      const pinRes = await fetch("/api/pinata/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const pinData = await pinRes.json().catch(() => ({}));
      if (!pinRes.ok || !pinData.uri) throw new Error(pinData.error ?? "Metadata upload failed");

      // 2. Mint via createMintIntent
      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId: effectiveCollectionId,
        recipient: walletAddress,
        tokenUri: pinData.uri,
      });
      const mintCalls = (intentRes.data as any)?.calls as ChipiCall[];
      if (!mintCalls?.length) throw new Error("No mint calls returned");

      const mintResult = await executeTransaction({
        pin,
        contractAddress: mintCalls[0].contractAddress,
        calls: mintCalls,
      });
      if (mintResult.status === "reverted") throw new Error(mintResult.revertReason ?? "Mint reverted");

      void maybeSavePreferredEncryptionIfUnset(
        walletAddress,
        encryptionPref,
        getBearerToken,
        client
      );

      // 3. Poll for new tokenId
      let remixTokenId: string | undefined;
      const mintDeadline = Date.now() + 10_000;
      while (Date.now() < mintDeadline) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const tokensRes = await client.api.getTokensByOwner(walletAddress, 1, 5);
          const newest = tokensRes.data?.find((t) => t.contractAddress === selectedCollection.contractAddress);
          if (newest) {
            remixTokenId = newest.tokenId;
            break;
          }
        } catch { /* ignore */ }
      }
      if (!remixTokenId) throw new Error("Could not determine remix token ID");

      // 4. Create marketplace listing
      const currencySymbol = currencyToken?.symbol ?? "STRK";
      await createListing({
        assetContract: selectedCollection.contractAddress,
        tokenId: remixTokenId,
        price: offer.proposedPrice ?? "0",
        currencySymbol,
        durationSeconds: 30 * 24 * 60 * 60, // 30 days
        pin,
        signingMethod: encryptionPref,
      });

      // 5. Poll for listing to get orderHash
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
            (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC721"
          );
          if (listing) {
            orderHash = listing.orderHash;
            break;
          }
        } catch { /* ignore */ }
      }
      if (!orderHash) throw new Error("Could not confirm listing orderHash — check portfolio shortly");

      // 6. Confirm offer in backend
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("Not authenticated");
      await confirmRemixOffer(
        offer.id,
        {
          remixContract: selectedCollection.contractAddress,
          remixTokenId,
          approvedCollection: selectedCollection.contractAddress,
          orderHash,
        },
        clerkToken
      );

      setNewAssetLink(`/asset/${selectedCollection.contractAddress}/${remixTokenId}`);
      setDone(true);
      toast.success("Remix minted!", { description: "Buyer has been notified." });
      setTimeout(() => onSuccess?.(), INDEXER_REVALIDATION_DELAY_MS);
    } catch (err: unknown) {
      toast.error("Approval failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Approve Remix
            </SheetTitle>
          </SheetHeader>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">Remix minted!</p>
              <p className="text-sm text-muted-foreground">The buyer will see "Complete Purchase" in their portfolio.</p>
              {newAssetLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={newAssetLink}>View new asset</a>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-5 pt-4">
              {offer && (
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Token</span> #{offer.originalTokenId}</p>
                  <p><span className="text-muted-foreground">License</span> {offer.licenseType}</p>
                  <p><span className="text-muted-foreground">Price</span> {priceDisplay}</p>
                  {offer.message && <p className="text-muted-foreground italic">"{offer.message}"</p>}
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
                    value={effectiveCollectionId ?? ""}
                    onValueChange={setSelectedCollectionId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleCollections.map((c) => (
                        <SelectItem key={c.collectionId!} value={c.collectionId!}>
                          {c.name ?? c.contractAddress.slice(0, 14) + "…"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleApprove}
                disabled={loading || eligibleCollections.length === 0}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitBranch className="h-4 w-4 mr-2" />}
                Mint & List for Buyer
              </Button>
              <p className="text-xs text-center text-muted-foreground">Two ChipiPay operations (mint + listing). Gas is free.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm remix mint"
        description="Enter your PIN to mint the remix and create the listing."
      />
    </>
  );
}

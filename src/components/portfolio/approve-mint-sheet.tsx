"use client";

import { requireSignedIn } from "@/lib/account-gate";
import { useCollectionsByOwner } from "@medialane/ui";
import { useState } from "react";
import { getService } from "@medialane/sdk";
import { assetHref } from "@/lib/routes";
import { Dialog, DialogContent, DialogTitle } from "@medialane/ui/dialog";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { Label } from "@medialane/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@medialane/ui/select";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { approveRemix, type RemixCollection } from "@/lib/remix-approval";
import { formatDisplayPrice } from "@/lib/utils";
import { AlertCircle, Check, GitBranch, Loader2 } from "lucide-react";
import type { RemixOffer } from "@/types/remix-offers";

interface Props {
  offer: RemixOffer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function ApproveMintSheet({ offer, open, onOpenChange, onSuccess }: Props) {
  const { address: walletAddress } = useWalletNativeSession();
  const { session } = useSession();
  const tx = useMarketplaceTransaction();

  const { collections } = useCollectionsByOwner(walletAddress ?? null);

  const eligibleCollections = collections.filter(
    (c) =>
      getService(c.service)?.id === "mip-erc1155" ||
      (getService(c.service)?.id === "mip-erc721" && c.collectionId != null)
  );

  const collectionKey = (c: (typeof eligibleCollections)[0]) => c.collectionId ?? c.contractAddress;
  const defaultCollection =
    eligibleCollections.find((c) => c.contractAddress === offer?.originalContract) ?? eligibleCollections[0];

  const [selectedCollectionKey, setSelectedCollectionKey] = useState<string | null>(null);
  const [remixName, setRemixName] = useState("");
  const [newAssetLink, setNewAssetLink] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveCollectionKey = selectedCollectionKey ?? (defaultCollection ? collectionKey(defaultCollection) : null);
  const selectedCollection = eligibleCollections.find((c) => collectionKey(c) === effectiveCollectionKey);

  const done = tx.phase === "success";
  const approveError = tx.phase === "error" ? tx.error : null;

  const priceDisplay = offer?.price
    ? `${formatDisplayPrice(offer.price.formatted)} ${offer.price.currency}`
    : "—";

  const handleOpenChange = (v: boolean) => {
    if (tx.busy) return;
    if (!v) {
      setSelectedCollectionKey(null);
      setRemixName("");
      setNewAssetLink(null);
      setFormError(null);
      tx.reset();
    }
    onOpenChange(v);
  };

  const effectiveName = remixName.trim() || `Remix of Token #${offer?.originalTokenId}`;

  const handleApprove = () => {
    setFormError(null);
    if (!offer) return;
    if (!selectedCollection) {
      setFormError("Select a collection to mint into.");
      return;
    }
    if (selectedCollection.standard !== "ERC1155" && !selectedCollection.collectionId) {
      setFormError("This collection is not enrolled in the registry.");
      return;
    }
    const collection: RemixCollection = {
      contractAddress: selectedCollection.contractAddress,
      collectionId: selectedCollection.collectionId ?? null,
      standard: selectedCollection.standard === "ERC1155" ? "ERC1155" : "ERC721",
    };
    void tx.start(async (ctx) => {
      requireSignedIn(session);
      const minted = await approveRemix(ctx, { offer, collection, name: effectiveName });
      setNewAssetLink(assetHref("STARKNET", minted.contract, minted.tokenId));
    }).then((ok) => { if (ok) onSuccess?.(); });
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
                              <span className="text-2xs tabular-nums text-muted-foreground">{c.standard}</span>
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
              disabled={tx.busy || eligibleCollections.length === 0}
            >
              {tx.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
              Grant license & mint
            </button>
            <p className="text-2xs text-center text-muted-foreground">Two onchain operations (mint + listing). Gas is free.</p>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

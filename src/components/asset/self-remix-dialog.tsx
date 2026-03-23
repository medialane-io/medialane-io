"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { toast } from "sonner";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { confirmSelfRemix } from "@/hooks/use-remix-offers";
import { IP_TYPES } from "@/types/ip";
import { GitBranch, Loader2 } from "lucide-react";
import type { ChipiCall } from "@/hooks/use-chipi-transaction";
import { INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";

const LICENSE_TYPES = ["CC0", "CC BY", "CC BY-SA", "CC BY-NC", "CC BY-ND", "Personal"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  originalContract: string;
  originalTokenId: string;
  originalName?: string;
  originalImage?: string | null;
}

export function SelfRemixDialog({ open, onOpenChange, originalContract, originalTokenId, originalName, originalImage }: Props) {
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { executeTransaction } = useChipiTransaction();
  const client = useMedialaneClient();
  const { collections } = useCollectionsByOwner(walletAddress ?? null);
  // Only collections with a collectionId (required for createMintIntent)
  const eligibleCollections = collections.filter((c) => c.collectionId != null);
  const defaultCollectionId = eligibleCollections.find((c) => c.contractAddress === originalContract)?.collectionId
    ?? eligibleCollections[0]?.collectionId ?? null;

  const [name, setName] = useState(`Remix of ${originalName ?? `Token #${originalTokenId}`}`);
  const [licenseType, setLicenseType] = useState("CC BY");
  const [ipType, setIpType] = useState<string>("Art");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveCollectionId = selectedCollectionId ?? defaultCollectionId;
  const selectedCollection = eligibleCollections.find((c) => c.collectionId === effectiveCollectionId);

  const handleSubmit = () => {
    if (!effectiveCollectionId || !selectedCollection) {
      toast.error("No eligible collection found");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a name for the remix");
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!walletAddress || !effectiveCollectionId || !selectedCollection) return;
    setLoading(true);

    try {
      // Build and upload IPFS metadata
      const metadata = {
        name: name.trim(),
        description: `Remix of ${originalName ?? `Token #${originalTokenId}`}`,
        image: originalImage ?? "",
        attributes: [
          { trait_type: "Parent Contract", value: originalContract },
          { trait_type: "Parent Token ID", value: originalTokenId },
          { trait_type: "Remix Type", value: "Derivative" },
          { trait_type: "License", value: licenseType },
          { trait_type: "IP Type", value: ipType },
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
      const tokenUri = pinData.uri;

      // Mint via createMintIntent
      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId: effectiveCollectionId,
        recipient: walletAddress,
        tokenUri,
      });
      const calls = (intentRes.data as any)?.calls as ChipiCall[];
      if (!calls?.length) throw new Error("No calls returned from mint intent");

      const result = await executeTransaction({ pin, contractAddress: calls[0].contractAddress, calls });
      if (result.status === "reverted") throw new Error(result.revertReason ?? "Mint reverted");

      // Poll for newly minted token
      let remixTokenId: string | undefined;
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
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

      if (!remixTokenId) throw new Error("Could not determine remix token ID — check portfolio shortly");

      // Record self-remix
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("Not authenticated");
      await confirmSelfRemix(
        {
          originalContract,
          originalTokenId,
          remixContract: selectedCollection.contractAddress,
          remixTokenId,
          txHash: result.txHash ?? "",
          licenseType,
          commercial: false,
          derivatives: true,
        },
        clerkToken
      );

      toast.success("Remix minted!", { description: "It will appear in your portfolio shortly." });
      onOpenChange(false);
      setTimeout(() => {}, INDEXER_REVALIDATION_DELAY_MS);
    } catch (err: unknown) {
      toast.error("Remix failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Create Remix
            </DialogTitle>
            <DialogDescription>
              Mint a new derivative of{" "}
              <span className="font-medium text-foreground">{originalName ?? `Token #${originalTokenId}`}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Remix Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Collection</Label>
              {eligibleCollections.length === 0 ? (
                <p className="text-xs text-destructive">No eligible collections found. Create a collection first.</p>
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

            <div className="space-y-1.5">
              <Label>License</Label>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>IP Type</Label>
              <Select value={ipType} onValueChange={setIpType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || eligibleCollections.length === 0}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitBranch className="h-4 w-4 mr-2" />}
              Mint Remix
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm remix mint"
        description="Enter your PIN to mint this remix on Starknet."
      />
    </>
  );
}

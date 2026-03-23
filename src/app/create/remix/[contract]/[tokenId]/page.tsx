"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useToken } from "@/hooks/use-tokens";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { MintProgressDialog } from "@/components/marketplace/mint-progress-dialog";
import type { MintStep } from "@/components/marketplace/mint-progress-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { submitRemixOffer, confirmSelfRemix } from "@/hooks/use-remix-offers";
import { getListableTokens, getTokenBySymbol } from "@medialane/sdk";
import { IP_TYPES, LICENSE_TYPES, type IPType } from "@/types/ip";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  GitBranch, ChevronDown, ChevronLeft, ImagePlus, Upload,
  Shield, DollarSign, Percent, Boxes, Plus, Info, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { ChipiCall } from "@/hooks/use-chipi-transaction";

const TOKENS = getListableTokens();

// ── ToggleGroup ──────────────────────────────────────────────────────────────

function ToggleGroup({
  value, options, onChange,
}: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden w-full">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            i > 0 && "border-l border-border",
            value === opt
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-background hover:bg-muted text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CreateRemixPage() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { executeTransaction, status: txStatus } = useChipiTransaction();
  const client = useMedialaneClient();
  const { token, isLoading: tokenLoading } = useToken(contract, tokenId);
  const { collections: allCollections, isLoading: collectionsLoading } =
    useCollectionsByOwner(walletAddress ?? null);
  const eligibleCollections = allCollections.filter((c) => c.collectionId != null);

  const isOwner = !!(
    token && walletAddress &&
    token.owner.toLowerCase() === walletAddress.toLowerCase()
  );

  const originalName = token?.metadata?.name ?? `Token #${tokenId}`;
  const originalImage = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const originalAttributes = Array.isArray(token?.metadata?.attributes)
    ? (token!.metadata!.attributes as { trait_type?: string; value?: string }[])
    : [];
  const attr = (t: string) => originalAttributes.find((a) => a.trait_type === t)?.value;

  // ── Form state ─────────────────────────────────────────────────────────────

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [ipType, setIpType] = useState<string>("Art");
  const [licenseType, setLicenseType] = useState("CC BY");
  const [commercial, setCommercial] = useState(false);
  const [derivatives, setDerivatives] = useState(true);
  const [royalty, setRoyalty] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<string>(TOKENS[0]?.symbol ?? "STRK");
  const [message, setMessage] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Offer submit (non-owner)
  const [offerLoading, setOfferLoading] = useState(false);

  // Owner mint flow
  const [pinOpen, setPinOpen] = useState(false);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Pre-fill name after token loads
  useEffect(() => {
    if (token && !name) setName(`Remix of ${originalName}`);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill collection to match original asset's collection if possible
  useEffect(() => {
    if (eligibleCollections.length > 0 && !collectionId) {
      const match = eligibleCollections.find(
        (c) => c.contractAddress.toLowerCase() === contract.toLowerCase()
      );
      setCollectionId(match?.collectionId ?? eligibleCollections[0]?.collectionId ?? "");
    }
  }, [eligibleCollections.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync license preset defaults
  const handleLicenseChange = (value: string) => {
    setLicenseType(value);
    const preset = LICENSE_TYPES.find((l) => l.value === value);
    if (preset) {
      setCommercial(preset.commercialUse === "Yes");
      setDerivatives(preset.derivatives !== "Not Allowed");
    }
  };

  // Image upload
  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  const handleImageChange = (file: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setImageFile(file);
    setImagePreview(url);
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!name.trim()) return "Remix name is required";
    if (isOwner && !collectionId) return "Select a collection";
    if (!isOwner && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0))
      return "Enter a valid price offer";
    return null;
  };

  // ── Owner: mint flow ───────────────────────────────────────────────────────

  const handleOwnerSubmit = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!walletAddress) return;
    setMintError(null);
    setMintStep("uploading");

    try {
      const selectedCollection = eligibleCollections.find((c) => c.collectionId === collectionId);
      if (!selectedCollection) throw new Error("Collection not found");

      // 1. Build metadata
      const metadata = {
        name: name.trim(),
        description: description.trim() || `Remix of ${originalName}`,
        image: imageFile ? "" : (token?.metadata?.image ?? ""),
        attributes: [
          { trait_type: "Parent Contract", value: contract },
          { trait_type: "Parent Token ID", value: tokenId },
          { trait_type: "Remix Type", value: "Derivative" },
          { trait_type: "IP Type", value: ipType },
          { trait_type: "License", value: licenseType },
          { trait_type: "Commercial Use", value: commercial ? "Yes" : "No" },
          { trait_type: "Derivatives", value: derivatives ? "Allowed" : "Not Allowed" },
          ...(royalty ? [{ trait_type: "Royalty", value: `${royalty}%` }] : []),
          { trait_type: "Creator", value: walletAddress },
        ],
      };

      let tokenUri: string;

      if (imageFile) {
        // Upload via /api/pinata (image + metadata)
        const formData = new FormData();
        formData.set("file", imageFile);
        formData.set("name", metadata.name);
        formData.set("description", metadata.description);
        formData.set("creator", walletAddress);
        formData.set("ipType", ipType);
        formData.set("licenseType", licenseType);
        formData.set("commercialUse", commercial ? "Yes" : "No");
        formData.set("derivatives", derivatives ? "Allowed" : "Not Allowed");
        formData.set("attribution", "Required");
        formData.set("geographicScope", "Worldwide");
        formData.set("aiPolicy", "Not Allowed");
        formData.set("royalty", royalty || "0");
        formData.append("tmpl_Parent Contract", contract);
        formData.append("tmpl_Parent Token ID", tokenId);
        const uploadRes = await fetch("/api/pinata", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.uri) throw new Error(uploadData.error ?? "Upload failed");
        tokenUri = uploadData.uri;
      } else {
        // Upload metadata JSON only
        const pinRes = await fetch("/api/pinata/json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadata),
        });
        const pinData = await pinRes.json();
        if (!pinRes.ok || !pinData.uri) throw new Error(pinData.error ?? "Metadata upload failed");
        tokenUri = pinData.uri;
      }

      setMintStep("processing");

      // 2. Mint intent
      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId,
        recipient: walletAddress,
        tokenUri,
      });
      const calls = (intentRes.data as any)?.calls as ChipiCall[];
      if (!calls?.length) throw new Error("No calls returned from mint intent");

      const result = await executeTransaction({ pin, contractAddress: calls[0].contractAddress, calls });
      if (result.status === "reverted") throw new Error(result.revertReason ?? "Mint reverted");

      // 3. Poll for new tokenId
      let remixTokenId: string | undefined;
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const res = await client.api.getTokensByOwner(walletAddress, 1, 5);
          const newest = res.data?.find(
            (t) => t.contractAddress.toLowerCase() === selectedCollection.contractAddress.toLowerCase()
          );
          if (newest) { remixTokenId = newest.tokenId; break; }
        } catch { /* ignore */ }
      }
      if (!remixTokenId) throw new Error("Could not determine remix token ID — check portfolio shortly");

      // 4. Confirm self-remix in backend
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("Not authenticated");
      await confirmSelfRemix(
        {
          originalContract: contract,
          originalTokenId: tokenId,
          remixContract: selectedCollection.contractAddress,
          remixTokenId,
          txHash: result.txHash ?? "",
          licenseType,
          commercial,
          derivatives,
        },
        clerkToken
      );

      setMintStep("success");
      setTimeout(() => {
        router.push(`/asset/${selectedCollection.contractAddress}/${remixTokenId}`);
      }, INDEXER_REVALIDATION_DELAY_MS);
    } catch (err: unknown) {
      setMintError(err instanceof Error ? err.message : "Something went wrong");
      setMintStep("error");
    }
  };

  // ── Non-owner: offer submit ────────────────────────────────────────────────

  const handleOfferSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const clerkToken = await getToken();
    if (!clerkToken) { toast.error("Sign in required"); return; }

    setOfferLoading(true);
    try {
      const tokenInfo = getTokenBySymbol(currency as any);
      const decimals = tokenInfo?.decimals ?? 18;
      const rawPrice = BigInt(Math.round(parseFloat(price) * 10 ** decimals)).toString();

      await submitRemixOffer(
        {
          originalContract: contract,
          originalTokenId: tokenId,
          proposedPrice: rawPrice,
          proposedCurrency: tokenInfo?.address ?? "",
          licenseType,
          commercial,
          derivatives,
          royaltyPct: royalty ? parseInt(royalty) : undefined,
          message: message.trim() || undefined,
        },
        clerkToken
      );
      toast.success("Remix offer sent!", {
        description: "The creator will be notified and can approve your request.",
      });
      router.push(`/asset/${contract}/${tokenId}`);
    } catch (err: unknown) {
      toast.error("Failed to submit offer", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setOfferLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (tokenLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 pt-14 pb-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-2xl font-bold">Asset not found</p>
        <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
      </div>
    );
  }

  return (
    <>
      <MintProgressDialog
        open={mintStep !== "idle"}
        mintStep={mintStep}
        txStatus={txStatus}
        assetName={name}
        imagePreview={imagePreview ?? originalImage ?? null}
        txHash={null}
        error={mintError ?? null}
        onMintAnother={() => { setMintStep("idle"); setMintError(null); }}
        listingStep="idle"
        listingError={null}
      />

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm remix mint"
        description="Enter your PIN to mint this remix on Starknet."
      />

      <div className="container max-w-5xl mx-auto px-4 pt-14 pb-12 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href={`/asset/${contract}/${tokenId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to asset
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <GitBranch className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {isOwner ? "Create Remix" : "Propose Remix"}
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            {isOwner ? "Mint a Remix" : "Send a Remix Offer"}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {isOwner
              ? "Mint a derivative work based on your original asset. The parent attribution will be embedded in the IPFS metadata."
              : "Propose remix terms and a license fee to the creator. If accepted, they'll mint and list it for you to purchase."
            }
          </p>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* ── Left: form ──────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Remix Artwork */}
            <Section title="Remix Artwork" icon={<ImagePlus className="h-4 w-4" />}>
              <div
                className={cn(
                  "relative group rounded-xl border-2 border-dashed border-border transition-colors cursor-pointer overflow-hidden",
                  "hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={() => document.getElementById("remix-image-input")?.click()}
              >
                <input
                  id="remix-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageChange(f); }}
                />
                {imagePreview ? (
                  <div className="relative aspect-video w-full">
                    <Image src={imagePreview} alt="Remix preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Change image
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                    {originalImage && (
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden opacity-40 mb-1 ring-2 ring-border">
                        <Image src={originalImage} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <Upload className="h-8 w-8" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload remix artwork</p>
                      <p className="text-xs mt-0.5">
                        {originalImage ? "Leave empty to inherit original artwork" : "PNG, JPG, GIF, WebP up to 10MB"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Remix Details */}
            <Section title="Remix Details" icon={<GitBranch className="h-4 w-4" />}>
              <div className="space-y-1.5">
                <Label>Remix Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Remix of ${originalName}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your remix, the creative changes you're making, or your vision for it…"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </Section>

            {/* Collection (owner only) */}
            {isOwner && (
              <Section title="Collection" icon={<Boxes className="h-4 w-4" />}>
                {collectionsLoading ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : eligibleCollections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">No eligible collections. Create one first.</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/create/collection">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create collection
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Select value={collectionId} onValueChange={setCollectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
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
              </Section>
            )}

            {/* IP Type */}
            <Section title="IP Type" icon={<Info className="h-4 w-4" />}>
              <Select value={ipType} onValueChange={setIpType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            {/* License Configuration */}
            <Section title="License Terms" icon={<Shield className="h-4 w-4" />}>
              <div className="space-y-1.5">
                <Label>License Type</Label>
                <Select value={licenseType} onValueChange={handleLicenseChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Commercial Use</Label>
                  <ToggleGroup
                    value={commercial ? "Yes" : "No"}
                    options={["Yes", "No"]}
                    onChange={(v) => setCommercial(v === "Yes")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Derivatives</Label>
                  <ToggleGroup
                    value={derivatives ? "Allowed" : "Not Allowed"}
                    options={["Allowed", "Not Allowed"]}
                    onChange={(v) => setDerivatives(v === "Allowed")}
                  />
                </div>
              </div>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                    Royalty & advanced
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" />
                      Royalty %
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      placeholder="0"
                      value={royalty}
                      onChange={(e) => setRoyalty(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Percentage of future sales sent back to you (0–50%)</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Section>

            {/* Price */}
            <Section
              title={isOwner ? "List for Sale (optional)" : "License Fee Offer"}
              icon={<DollarSign className="h-4 w-4" />}
            >
              {!isOwner && (
                <p className="text-xs text-muted-foreground -mt-1">
                  The amount you're offering to pay the creator for this remix license.
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={isOwner ? "Leave blank to skip listing" : "0.00"}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKENS.map((t) => (
                      <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message (non-owner only) */}
              {!isOwner && (
                <div className="space-y-1.5">
                  <Label>Message to creator <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the creator what you want to make, your vision, or why you'd like to remix this work…"
                    rows={3}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
                </div>
              )}
            </Section>

            {/* Submit */}
            <div className="btn-border-animated p-[1px] rounded-xl">
              <button
                type="button"
                disabled={isOwner ? false : offerLoading}
                onClick={isOwner ? handleOwnerSubmit : handleOfferSubmit}
                className="w-full h-12 rounded-[11px] flex items-center justify-center gap-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-rose disabled:opacity-50"
              >
                {offerLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GitBranch className="h-5 w-5" />
                )}
                {isOwner ? "Mint Remix" : "Send Remix Offer"}
              </button>
            </div>

            {isOwner && (
              <p className="text-xs text-center text-muted-foreground">
                Two operations: IPFS metadata upload + on-chain mint. Gas is free.
              </p>
            )}
          </div>

          {/* ── Right: original asset card ──────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-16">

            {/* Original asset card */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="relative aspect-square w-full bg-muted">
                {originalImage ? (
                  <Image src={originalImage} alt={originalName} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-mono text-muted-foreground">#{tokenId}</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <GitBranch className="h-3 w-3" />
                    Original
                  </Badge>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold truncate">{originalName}</p>
                  {token.metadata?.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{token.metadata.description}</p>
                  )}
                </div>

                {/* Original license info */}
                {(attr("License") || attr("Commercial Use") || attr("Derivatives")) && (
                  <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Original License</p>
                    {attr("License") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">License</span>
                        <span className="font-medium">{attr("License")}</span>
                      </div>
                    )}
                    {attr("Commercial Use") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commercial</span>
                        <span className="font-medium">{attr("Commercial Use")}</span>
                      </div>
                    )}
                    {attr("Derivatives") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Derivatives</span>
                        <span className="font-medium">{attr("Derivatives")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* What happens next */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 text-sm">
              <p className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                What happens next
              </p>
              {isOwner ? (
                <ol className="space-y-2 text-muted-foreground text-xs list-decimal list-inside">
                  <li>Your artwork and metadata are uploaded to IPFS</li>
                  <li>A new NFT is minted in the selected collection</li>
                  <li>Parent attribution is embedded on-chain permanently</li>
                  {price && <li>The remix is listed for sale at your chosen price</li>}
                </ol>
              ) : (
                <ol className="space-y-2 text-muted-foreground text-xs list-decimal list-inside">
                  <li>Your offer is sent to the creator</li>
                  <li>If approved, they'll mint the remix and list it for you</li>
                  <li>You'll see "Complete Purchase" in your portfolio</li>
                  <li>After purchase, the remix is yours permanently</li>
                </ol>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

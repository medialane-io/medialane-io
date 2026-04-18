"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Loader2, ImagePlus, X, Layers, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import {
  MintProgressDialog,
  type MintStep,
} from "@/components/marketplace/mint-progress-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { normalizeAddress } from "@medialane/sdk";
import { Contract, byteArray as starkByteArray } from "starknet";
import { starknetProvider } from "@/lib/starknet";

/** Serialize a JS string into Cairo ByteArray calldata felts. */
function serializeByteArray(str: string): string[] {
  const ba = starkByteArray.byteArrayFromString(str);
  return [
    ba.data.length.toString(),
    ...ba.data.map(String),
    String(ba.pending_word),
    ba.pending_word_len.toString(),
  ];
}

/** Encode a BigInt as Cairo u256 calldata: [low128, high128]. */
function encodeU256(n: bigint): [string, string] {
  return [
    (n & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString(),
    (n >> BigInt(128)).toString(),
  ];
}

// ── MintConfirmDialog ────────────────────────────────────────────────────────
// Rich asset-aware confirmation dialog — mirrors PurchaseDialog's TokenHero pattern.
function MintConfirmDialog({
  open,
  imagePreview,
  assetName,
  tokenId,
  quantity,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  imagePreview: string | null;
  assetName: string;
  tokenId: string;
  quantity: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setPin(""); setPinError(null); }
  }, [open]);

  const handleSubmit = () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    onSubmit(pin);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Full-bleed image hero */}
        <div className="relative h-52 w-full bg-muted overflow-hidden">
          {imagePreview ? (
            <img src={imagePreview} alt={assetName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-500/20 via-brand-purple/10 to-transparent flex items-center justify-center">
              <Layers className="h-14 w-14 text-violet-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          {/* Multi-edition badge */}
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/20 text-violet-300 backdrop-blur-sm">
            <Layers className="h-3 w-3" />
            Multi-edition
          </span>
        </div>

        {/* Name + meta row */}
        <div className="flex items-end justify-between px-6 pt-3 pb-1">
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight truncate">{assetName || "New Token"}</p>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-500">Gasless · Starknet</span>
            </div>
          </div>
          <div className="shrink-0 text-right ml-4 space-y-0.5">
            <p className="text-xs text-muted-foreground">Token ID <span className="text-foreground font-semibold">#{tokenId || "—"}</span></p>
            <p className="text-xs text-muted-foreground">Qty <span className="text-foreground font-semibold">×{quantity || "1"}</span></p>
          </div>
        </div>

        {/* PIN entry */}
        <div className="px-6 pb-6 pt-3 space-y-4">
          <p className="text-sm text-muted-foreground">Enter your PIN to mint onto Starknet.</p>
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setPinError(null); }}
            error={pinError}
            autoFocus
          />
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="gap-1.5" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1 h-11 bg-violet-600 hover:bg-violet-500 text-white"
              disabled={pin.length < 6}
              onClick={handleSubmit}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Mint now
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground">
            Transaction gas fees are sponsored by Medialane.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const schema = z.object({
  tokenId: z
    .string()
    .min(1, "Token ID required")
    .regex(/^\d+$/, "Must be a positive integer"),
  value: z
    .string()
    .min(1, "Quantity required")
    .regex(/^\d+$/, "Must be a positive integer")
    .refine((v) => parseInt(v, 10) >= 1, "Minimum 1"),
  recipient: z.string().min(1, "Recipient address required"),
  name: z.string().min(1, "Token name required").max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function MintIP1155Page() {
  const { contract: rawContract } = useParams<{ contract: string }>();
  const collectionAddress = normalizeAddress(rawContract ?? "");

  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, status: txStatus, txHash } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const [ownerCheck, setOwnerCheck] = useState<"loading" | "ok" | "denied">("loading");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tokenId: "",
      value: "1",
      recipient: "",
      name: "",
      description: "",
    },
  });

  // Pre-fill recipient with connected wallet
  useEffect(() => {
    if (walletAddress && !form.getValues("recipient")) {
      form.setValue("recipient", walletAddress);
    }
  }, [walletAddress, form]);

  // Verify the connected wallet is the collection owner before showing the form
  useEffect(() => {
    if (!walletAddress || !collectionAddress) return;
    const OWNER_ABI = [{
      type: "function", name: "owner",
      inputs: [], outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
      state_mutability: "view",
    }];
    const contract = new Contract(OWNER_ABI as any, collectionAddress, starknetProvider);
    (contract as any).owner()
      .then((raw: unknown) => {
        const onChainOwner = normalizeAddress(String(raw));
        setOwnerCheck(onChainOwner === normalizeAddress(walletAddress) ? "ok" : "denied");
      })
      .catch(() => setOwnerCheck("ok"));
  }, [walletAddress, collectionAddress]);

  const handleImageSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setImagePreview(url);
    setImageUri(null);
    setImageUploading(true);
    try {
      const signedRes = await fetch("/api/pinata/signed-url", { method: "POST" });
      const { url: uploadUrl } = await signedRes.json();
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("network", "public");
      fd.append("name", file.name);
      const up = await fetch(uploadUrl, { method: "POST", body: fd });
      const { data } = await up.json();
      if (!data?.cid) throw new Error("No CID");
      setImageUri(`ipfs://${data.cid}`);
      toast.success("Image uploaded to IPFS");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!imageUri) { toast.error("Upload an image first"); return; }
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingValues(values);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress || !imageUri) return;

    setMintStep("uploading");
    setMintError(null);

    // Build and pin metadata JSON
    let tokenUri = imageUri;
    try {
      const metadata: Record<string, unknown> = {
        name: pendingValues.name,
        image: imageUri,
      };
      if (pendingValues.description) metadata.description = pendingValues.description;
      const r = await fetch("/api/pinata/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const d = await r.json();
      if (d.uri) tokenUri = d.uri;
    } catch { /* fall back to raw image URI */ }

    setMintStep("processing");

    try {
      const [tokenIdLow, tokenIdHigh] = encodeU256(BigInt(pendingValues.tokenId));
      const [valueLow, valueHigh]     = encodeU256(BigInt(pendingValues.value));

      const result = await executeTransaction({
        pin,
        contractAddress: collectionAddress,
        calls: [{
          contractAddress: collectionAddress,
          entrypoint: "mint_item",
          calldata: [
            pendingValues.recipient,
            tokenIdLow, tokenIdHigh,
            valueLow, valueHigh,
            ...serializeByteArray(tokenUri),
          ],
        }],
      });

      if (result.status === "confirmed") {
        setMintStep("success");
      } else {
        setMintError(result.revertReason ?? "Transaction reverted");
        setMintStep("error");
      }
    } catch (err) {
      setMintError(err instanceof Error ? err.message : "Failed to mint token");
      setMintStep("error");
    }
  };

  const handleMintAnother = () => {
    setMintStep("idle");
    setMintError(null);
    setImagePreview(null);
    setImageUri(null);
    form.reset({ tokenId: "", value: "1", recipient: walletAddress ?? "", name: "", description: "" });
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-violet-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to mint</h1>
        <p className="text-muted-foreground">Sign in to mint tokens into your ERC-1155 collection.</p>
      </div>
    );
  }

  // ── Ownership check ───────────────────────────────────────────────────────
  if (ownerCheck === "denied") {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">Not the owner</h1>
        <p className="text-muted-foreground">
          Only the collection owner can mint tokens. Connect the wallet that deployed this collection.
        </p>
        <Button asChild variant="outline">
          <Link href="/launchpad">Back to Launchpad</Link>
        </Button>
      </div>
    );
  }

  // ── Mint form ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">
        <FadeIn>
          <div className="space-y-1">
            <span className="pill-badge inline-flex gap-1.5">
              <Sparkles className="h-3 w-3" />
              ERC-1155 · Mint
            </span>
            <h1 className="text-3xl font-bold mt-3">Mint IP Asset</h1>
            <p className="text-muted-foreground text-sm">
              Mint a new token type into your ERC-1155 collection. The URI and authorship
              are recorded permanently on-chain at first mint.
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all">
              Collection: {collectionAddress}
            </p>
          </div>
        </FadeIn>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Image ── */}
            <FadeIn delay={0.06}>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Asset image <span className="text-destructive">*</span>
                </p>
                <div className="flex items-center gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !imageUploading && fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                    className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-violet-500/50 transition-colors"
                  >
                    {imagePreview
                      ? <Image src={imagePreview} alt="Token" fill className="object-cover" />
                      : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                    {imageUploading && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                    <Button type="button" variant="outline" size="sm" disabled={imageUploading}
                      onClick={() => fileInputRef.current?.click()}>
                      {imageUploading
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                        : imagePreview ? "Change" : "Upload image"}
                    </Button>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImagePreview(null); setImageUri(null); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {imageUri
                        ? <span className="text-violet-500">✓ Uploaded to IPFS</span>
                        : "JPG, PNG, SVG or WebP · max 10 MB"}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* ── Name ── */}
            <FadeIn delay={0.08}>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Token name *</FormLabel>
                  <FormControl><Input placeholder="Genesis Track #1" {...field} /></FormControl>
                  <FormDescription>Stored in the metadata JSON on IPFS.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* ── Description ── */}
            <FadeIn delay={0.1}>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe this IP asset…" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* ── Token ID ── */}
            <FadeIn delay={0.12}>
              <FormField control={form.control} name="tokenId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Token ID *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="1" className="max-w-[180px]" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this token type within the collection. Immutable once minted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* ── Quantity ── */}
            <FadeIn delay={0.14}>
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1" className="max-w-[180px]" {...field} />
                  </FormControl>
                  <FormDescription>Number of copies to mint for this token ID.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* ── Recipient ── */}
            <FadeIn delay={0.16}>
              <FormField control={form.control} name="recipient" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient *</FormLabel>
                  <FormControl>
                    <Input placeholder="0x…" {...field} />
                  </FormControl>
                  <FormDescription>Wallet that receives the minted tokens. Defaults to your wallet.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* ── Submit ── */}
            <FadeIn delay={0.2}>
              <div className="btn-border-animated p-[1px] rounded-xl mt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl bg-background text-foreground hover:bg-muted/60"
                  disabled={imageUploading || mintStep !== "idle"}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mint Token
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Gas is free. Your PIN signs the transaction.
              </p>
            </FadeIn>

          </form>
        </Form>
      </div>

      <MintConfirmDialog
        open={pinOpen}
        imagePreview={imagePreview}
        assetName={form.getValues("name")}
        tokenId={form.getValues("tokenId")}
        quantity={form.getValues("value")}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
      <MintProgressDialog
        open={mintStep !== "idle"}
        mintStep={mintStep}
        txStatus={txStatus}
        assetName={form.getValues("name")}
        imagePreview={imagePreview}
        txHash={txHash}
        error={mintError}
        onMintAnother={handleMintAnother}
      />
    </>
  );
}

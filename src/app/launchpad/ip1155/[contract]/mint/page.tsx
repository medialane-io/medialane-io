"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Loader2, ImagePlus, X, CheckCircle2 } from "lucide-react";
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
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { IPCollection1155ABI } from "@medialane/sdk";
import { Contract } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { normalizeAddress } from "@medialane/sdk";

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
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

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

    try {
      const collection = new Contract(
        IPCollection1155ABI as any,
        collectionAddress,
        starknetProvider
      );
      const call = collection.populate("mint_item", [
        pendingValues.recipient,
        BigInt(pendingValues.tokenId),
        BigInt(pendingValues.value),
        tokenUri,
      ]);

      const result = await executeTransaction({
        pin,
        contractAddress: collectionAddress,
        calls: [{
          contractAddress: collectionAddress,
          entrypoint: "mint_item",
          calldata: call.calldata as string[],
        }],
      });

      if (result.status === "confirmed") {
        setTxHash(result.txHash);
        setDone(true);
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mint token");
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-violet-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Token minted</h1>
          <p className="text-muted-foreground">
            Your ERC-1155 IP asset is live on Starknet. It will appear in your portfolio
            within a minute once indexed.
          </p>
          {txHash && (
            <p className="text-xs text-muted-foreground break-all">Tx: {txHash}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/portfolio">View portfolio</Link>
          </Button>
          <Button
            onClick={() => {
              setDone(false);
              setTxHash(null);
              setImagePreview(null);
              setImageUri(null);
              form.reset({ tokenId: "", value: "1", recipient: walletAddress ?? "", name: "", description: "" });
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Mint another
          </Button>
        </div>
      </div>
    );
  }

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
                  disabled={isSubmitting || imageUploading}
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting…</>
                    : <><Sparkles className="h-4 w-4 mr-2" />Mint Token</>}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Gas is free. Your PIN signs the transaction.
              </p>
            </FadeIn>

          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Mint ERC-1155 token"
        description="Enter your PIN to mint this IP asset onto Starknet."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Layers, Loader2, ImagePlus, X } from "lucide-react";
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
import {
  CollectionProgressDialog,
  type CollectionStep,
} from "@/components/marketplace/collection-progress-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  IPCollection1155FactoryABI,
  ERC1155_FACTORY_CONTRACT_MAINNET,
  normalizeAddress,
} from "@medialane/sdk";
import { Contract, hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

const FACTORY = ERC1155_FACTORY_CONTRACT_MAINNET as `0x${string}`;
const COLLECTION_DEPLOYED_SELECTOR = hash.getSelectorFromName("CollectionDeployed");

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10, "Max 10 characters")
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  external_link: z
    .string()
    .max(500)
    .refine((v) => !v || v.startsWith("http://") || v.startsWith("https://"), {
      message: "Must start with http:// or https://",
    })
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateIP1155CollectionPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, status: txStatus, txHash } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const [collectionStep, setCollectionStep] = useState<CollectionStep>("idle");
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "", description: "", external_link: "" },
  });

  useEffect(() => {
    if (walletAddress && !form.getValues("external_link")) {
      form.setValue("external_link", `https://medialane.io/account/${walletAddress}`);
    }
  }, [walletAddress, form]);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"];

  const handleImageSelect = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported format", { description: "Please upload a JPG, PNG, GIF, SVG, or WebP image." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large", { description: `Max 10 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.` });
      return;
    }
    setImageFile(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setImagePreview(objectUrl);
    setImageUri(null);
    setImageUploading(true);
    try {
      const signedRes = await fetch("/api/pinata/signed-url", { method: "POST" });
      const signedData = await signedRes.json();
      if (!signedRes.ok || !signedData.url) throw new Error("Failed to get upload URL");
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("network", "public");
      fd.append("name", file.name);
      const uploadRes = await fetch(signedData.url, { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { data } = await uploadRes.json();
      if (!data?.cid) throw new Error("No CID returned");
      setImageUri(`ipfs://${data.cid}`);
      toast.success("Image uploaded to IPFS");
    } catch (err) {
      toast.error("Image upload failed", { description: err instanceof Error ? err.message : undefined });
      setImageUri(null);
    } finally {
      setImageUploading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUri(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setCollectionStep("idle");
    setCollectionError(null);
    setDeployedAddress(null);
    setPendingValues(null);
    form.reset();
    clearImage();
  };

  const onSubmit = (values: FormValues) => {
    if (imageFile && !imageUri && !imageUploading) {
      toast.error("Image upload failed", { description: "Please re-upload your collection image." });
      return;
    }
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingValues(values);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    setCollectionError(null);
    setCollectionStep("processing");

    try {
      // 1. Pin metadata JSON to IPFS
      let collectionMetaUri: string | undefined;
      if (imageUri) {
        try {
          const r = await fetch("/api/pinata/json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: pendingValues.name,
              description: pendingValues.description || "",
              image: imageUri,
              external_link: pendingValues.external_link || "",
            }),
          });
          const d = await r.json();
          if (d.uri) collectionMetaUri = d.uri;
        } catch { /* non-fatal */ }
      }

      // 2. Execute deploy_collection on the factory
      const factory = new Contract(IPCollection1155FactoryABI as any, FACTORY, starknetProvider);
      const call = factory.populate("deploy_collection", [pendingValues.name, pendingValues.symbol]);

      const result = await executeTransaction({
        pin,
        contractAddress: FACTORY,
        calls: [{
          contractAddress: FACTORY,
          entrypoint: "deploy_collection",
          calldata: call.calldata as string[],
        }],
      });

      if (result.status !== "confirmed") {
        throw new Error(result.revertReason ?? "Transaction reverted");
      }

      // 3. Extract deployed collection address from CollectionDeployed event
      let addr: string | null = null;
      try {
        const receipt = await starknetProvider.getTransactionReceipt(result.txHash);
        const events = (receipt as any)?.events ?? [];
        const deployEvent = events.find((e: any) =>
          e.keys?.[0] && BigInt(e.keys[0]) === BigInt(COLLECTION_DEPLOYED_SELECTOR)
        );
        if (deployEvent?.keys?.[1]) addr = normalizeAddress(deployEvent.keys[1]);
      } catch { /* non-fatal */ }

      // 4. Register with backend so it appears in portfolio immediately
      if (addr) {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
          await fetch(`${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/collections`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              contractAddress: addr,
              name: pendingValues.name,
              symbol: pendingValues.symbol,
              description: pendingValues.description || undefined,
              image: imageUri || undefined,
              baseUri: collectionMetaUri || undefined,
              owner: walletAddress,
              standard: "ERC1155",
              startBlock: 0,
            }),
          });
        } catch { /* non-fatal */ }
      }

      setDeployedAddress(addr);
      setCollectionStep("success");
    } catch (err) {
      setCollectionError(err instanceof Error ? err.message : "Something went wrong");
      setCollectionStep("error");
    }
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Layers className="h-10 w-10 text-violet-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to create a collection</h1>
        <p className="text-muted-foreground">Deploy a multi-edition ERC-1155 IP collection on Starknet.</p>
      </div>
    );
  }

  return (
    <>
      <CollectionProgressDialog
        open={collectionStep !== "idle"}
        collectionStep={collectionStep}
        txStatus={txStatus}
        collectionName={pendingValues?.name ?? ""}
        imagePreview={imagePreview}
        txHash={txHash}
        error={collectionError}
        onCreateAnother={handleReset}
        createAnotherLabel="Deploy another"
        firstStepLabel="Prepare metadata"
        mintHref={deployedAddress ? `/launchpad/ip1155/${deployedAddress}/mint` : undefined}
        deployedAddress={deployedAddress}
      />

      <div className="container max-w-2xl mx-auto px-4 pt-14 pb-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Layers className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">IP Collection · ERC-1155</span>
          </div>
          <h1 className="text-3xl font-bold">Create IP Collection</h1>
          <p className="text-muted-foreground">
            Deploy a multi-edition ERC-1155 collection on Starknet. Gas is free.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Collection image ── */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Collection image</p>
              <div className="flex items-start gap-4">
                <div
                  className="relative h-28 w-28 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload collection image"
                  onClick={() => !imageUploading && fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!imageUploading) fileInputRef.current?.click(); } }}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Collection image" fill className="object-cover" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  )}
                  {imageUploading && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={imageUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imageUploading
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                      : imageFile ? "Change image" : "Upload image"}
                  </Button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, SVG or WebP · max 10 MB
                    {imageUri && <span className="ml-2 text-emerald-500 font-medium">✓ Uploaded to IPFS</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Name ── */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Collection name *</FormLabel>
                <FormControl><Input placeholder="My Creative Works" {...field} /></FormControl>
                <FormDescription>The display name for your collection.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Symbol ── */}
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="MCW"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>Short ticker (2–10 uppercase letters). Shown in wallets and explorers.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Description ── */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your collection and what kind of work it contains…" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── External link ── */}
            <FormField control={form.control} name="external_link" render={({ field }) => (
              <FormItem>
                <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="https://yourwebsite.com" {...field} /></FormControl>
                <FormDescription>Your website, portfolio, or social profile. Stored in collection metadata on IPFS.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Submit ── */}
            <div className={`btn-border-animated p-[1px] rounded-xl ${collectionStep !== "idle" || imageUploading ? "opacity-40 pointer-events-none" : ""}`}>
              <button
                type="submit"
                disabled={collectionStep !== "idle" || imageUploading}
                className="w-full h-12 text-base font-semibold text-white rounded-[11px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-violet-600"
              >
                <Layers className="h-4 w-4" />
                Deploy Collection
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Gas is free. Your PIN signs the transaction.
            </p>

          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Deploy ERC-1155 collection"
        description="Enter your PIN to deploy your IP collection on Starknet."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}

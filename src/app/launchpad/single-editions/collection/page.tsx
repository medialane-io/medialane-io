"use client";

import { uploadImageToIpfs } from "@/lib/upload-image";
import { withSiwsAuth } from "@/lib/pinata-fetch";
import { rewardToast } from "@/lib/reward-toast";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import Link from "next/link";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { WalletTransactionDialog } from "@/components/transaction/wallet-transaction-dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { executeIntent } from "@/lib/wallet/intent-tx";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { ActionButton, MedialaneCollectionCard } from "@medialane/ui";
import { CreateCollectionAside } from "@/components/claim/create-collection-aside";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import { Layers, Loader2, ImagePlus, X } from "lucide-react";
import { friendlyErrorMessage } from "@/lib/friendly-error";

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

async function syncCollectionFromTx(txHash: string) {
  const maxAttempts = 5;
  let lastStatus = 0;
  let lastPayload: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const syncRes = await fetch(`${MEDIALANE_BACKEND_URL}/v1/collections/sync-tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(MEDIALANE_API_KEY ? { "x-api-key": MEDIALANE_API_KEY } : {}) },
      body: JSON.stringify({ txHash }),
    });
    const payload = await syncRes.json().catch(() => ({}));
    lastStatus = syncRes.status;
    lastPayload = payload;
    if (syncRes.ok && Number(payload?.data?.synced ?? 0) > 0) return payload;
    if (attempt === maxAttempts) {
      console.warn("[Medialane collection sync]", { txHash, status: syncRes.status, payload });
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }

  throw new Error(
    `Collection transaction confirmed, but indexing did not confirm the CollectionCreated event yet. Tx: ${txHash}. Sync status: ${lastStatus || "unknown"}. ${
      typeof lastPayload === "object" && lastPayload && "error" in lastPayload ? String(lastPayload.error) : "Please refresh or retry shortly."
    }`
  );
}

export default function LaunchpadCreateCollectionPage() {
  const { address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();
  const client = useMedialaneClient();

  const action = useWalletWriteAction();

  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadSuccess, setImageUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const hasWallet = !!walletAddress;

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
    const MAX_BYTES = 10 * 1024 * 1024;
    setImageUploadError(null);
    setImageUploadSuccess(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageUploadError("Unsupported format — please upload a JPG, PNG, GIF, SVG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setImageUploadError(`Image too large — max 10 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
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
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Secure your account first");

      const uri = await Promise.race([
        uploadImageToIpfs(file, token),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("the image service is slow right now — please try again")), 60_000),
        ),
      ]);
      setImageUri(uri);
      setImageUploadSuccess("Image uploaded to IPFS");
    } catch (err: unknown) {
      const msg = friendlyErrorMessage(err, "Upload failed");
      setImageUploadError(`Image upload failed: ${msg}`);
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

  const onSubmit = (values: FormValues) => {

    if (imageFile && !imageUri && !imageUploading) {
      setImageUploadError("Please re-upload your collection image before continuing.");
      return;
    }
    setPendingValues(values);

    void action.run((signer) => runCreate(values, signer));
  };

  const runCreate = async (values: FormValues, signer: StarknetVenueSigner) => {
    if (!walletAddress) throw new Error("Account not ready. Please refresh and try again.");

    const siwsToken = getValidToken() ?? (await signIn());
    if (!siwsToken) throw new Error("Secure your account first");

    let baseUri: string | undefined;
    if (imageUri) {
      const metaRes = await fetch("/api/pinata/json", withSiwsAuth(siwsToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || "",
          image: imageUri,
          external_link: values.external_link || "https://medialane.io",
        }),
      }));
      const metaData = await metaRes.json().catch(() => ({}));
      if (!metaRes.ok || !metaData.uri) {
        throw new Error("Couldn't save your collection details. Please try again.");
      }
      baseUri = metaData.uri;
    }

    const intentRes = await client.api.createCollectionIntent({
      owner: walletAddress,
      name: values.name,
      symbol: values.symbol,
      description: values.description || undefined,
      image: imageUri || undefined,
      baseUri,
    });

    const result = await executeIntent(signer, client, intentRes.data, { confirm: false });

    if (!result.txHash) {
      throw new Error("Collection transaction completed without a transaction hash. Please refresh and check your account activity.");
    }
    await syncCollectionFromTx(result.txHash);
    invalidatePortfolioCache(walletAddress);
    rewardToast("create_collection");
    return result;
  };

  const handleCreateAnother = () => {
    action.reset();
    form.reset();
    clearImage();
  };

  return (
    <>
      <WalletTransactionDialog
        action={action}
        title="Confirm collection creation"
        processingLabel="Deploying collection…"
        firstStepLabel="Create collection intent"
        successTitle="Collection deployed!"
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{pendingValues?.name || "Your collection"}</span> is
          live onchain. Start minting assets into it.
        </p>
        {imagePreview && (
          <div className="h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">

            <img src={imagePreview} alt={pendingValues?.name ?? ""} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleCreateAnother}>
            Create another
          </Button>
          <Button asChild className="flex-1">
            <Link href="/launchpad/single-editions">Mint an asset</Link>
          </Button>
        </div>
      </WalletTransactionDialog>

      <ClaimRouteShell
        icon={<Layers className="h-4 w-4 text-white" />}
        title="Create a Collection"
        subtitle="Set up a collection to mint your work into — free to publish, and it's yours."
        aside={
          <>

            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name") || "My Creative Works"}
              collection={form.watch("symbol") || "Collection"}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
            />
            <CreateCollectionAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={imageUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imageUploading ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                    ) : imageFile ? (
                      "Change image"
                    ) : (
                      "Upload image"
                    )}
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
                  </p>
                  {imageUploadError && (
                    <p className="text-xs text-destructive mt-1">{imageUploadError}</p>
                  )}
                  {imageUploadSuccess && (
                    <p className="text-xs text-emerald-500 mt-1">✓ {imageUploadSuccess}</p>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Creative Works" {...field} />
                  </FormControl>
                  <FormDescription>The display name for your collection.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MCW"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Short ticker (2–10 uppercase letters). Shown in wallets and marketplaces.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your collection and what kind of work it contains…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="external_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your website, portfolio, or social profile — saved with your collection so it travels with it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ActionButton
              type="submit"
              tone="blue"
              big
              icon={<Layers className="h-4 w-4" />}
              disabled={action.status !== "idle" || imageUploading}
              className={`w-full ${action.status !== "idle" || imageUploading ? "opacity-40 pointer-events-none" : ""}`}
            >
              Create collection
            </ActionButton>
            <p className="text-xs text-center text-muted-foreground">
              Free to publish — protocol fee is zero.
            </p>
          </form>
        </Form>
      </ClaimRouteShell>
    </>
  );
}

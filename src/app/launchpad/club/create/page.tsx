"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
import { Users, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useWriteAction } from "@/hooks/use-write-action";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { normalizeAddress } from "@medialane/sdk";
import { hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { collectionHref } from "@/lib/routes";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { CreateClubAside } from "@/components/claim/create-club-aside";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { serializeByteArray } from "@/lib/cairo-calldata";
import { STARKNET_IP_CLUB_FACTORY_CONTRACT } from "@/lib/constants";

const CLUB_DEPLOYED_SELECTOR = hash.getSelectorFromName("ClubDeployed");

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10, "Max 10 characters")
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreateClubPage() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const action = useWriteAction();
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const {
    imageFile, imagePreview, imageUri, imageUploading,
    fileInputRef, handleImageSelect, clearImage,
  } = useLaunchpadImageUpload({ successMessage: "Image uploaded" });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "", description: "" },
  });

  const handleReset = () => {
    action.reset();
    setPendingValues(null);
    setDeployedAddress(null);
    form.reset();
    clearImage();
  };

  const onSubmit = (values: FormValues) => {
    if (imageFile && !imageUri && !imageUploading) return;
    setPendingValues(values);
    // Pass `values` through the closure (synchronous-passkey rule).
    void action.run((secret) => handleUnlocked(values, secret));
  };

  const handleUnlocked = async (values: FormValues, secret: string) => {
    if (!walletAddress) throw new Error("Wallet not ready. Please refresh and try again.");
    setDeployedAddress(null);

    // Pin collection metadata first — base_uri goes on-chain in the immutable
    // deploy, so a failed pin is fatal (pinLaunchpadMetadata throws).
    let baseUri = "";
    if (imageUri) {
      baseUri = await pinLaunchpadMetadata({
        name: values.name,
        description: values.description || "",
        image: imageUri,
      });
    }

    const result = await action.executeTransaction({
      pin: secret,
      calls: [{
        contractAddress: STARKNET_IP_CLUB_FACTORY_CONTRACT,
        entrypoint: "deploy_collection",
        calldata: [
          ...serializeByteArray(values.name),
          ...serializeByteArray(values.symbol),
          ...serializeByteArray(baseUri),
        ],
      }],
    });

    if (result.status !== "confirmed") {
      throw new Error(result.revertReason ?? "Transaction reverted");
    }
    rewardToast("create_club");

    // Best-effort: read the deployed address from the ClubDeployed event.
    let addr: string | null = null;
    try {
      type ReceiptEvent = { keys?: string[] };
      type ReceiptShape = { events?: ReceiptEvent[] };
      let receipt: ReceiptShape | null = null;
      for (let attempt = 0; attempt < 2 && !receipt; attempt++) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
          const raw: unknown = await starknetProvider.getTransactionReceipt(result.txHash);
          receipt = raw as ReceiptShape;
        } catch { /* retry */ }
      }
      const deployEvent = (receipt?.events ?? []).find((e) =>
        e.keys?.[0] && BigInt(e.keys[0]) === BigInt(CLUB_DEPLOYED_SELECTOR)
      );
      if (deployEvent?.keys?.[1]) addr = normalizeAddress("STARKNET", deployEvent.keys[1]);
    } catch { /* non-fatal — tx confirmed, the indexer picks it up on the next poll */ }

    if (walletAddress) invalidatePortfolioCache(walletAddress);
    setDeployedAddress(addr);
    return result;
  };

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Users}
        iconClassName="text-brand-purple"
        title="Sign in to create a club"
        description="Create a club, then mint membership cards for your community."
      />
    );
  }

  return (
    <>
      <TransactionDialog
        action={action}
        title="Create club"
        processingLabel="Creating your club…"
        firstStepLabel="Prepare metadata"
        successTitle="Club created!"
        pinDescription="Enter your PIN to create your club."
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{pendingValues?.name || "Your club"}</span> is
          live — create membership tiers from its collection page.
        </p>
        {imagePreview && (
          <div className="h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt={pendingValues?.name ?? ""} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Create another
          </Button>
          {deployedAddress && (
            <Button asChild className="flex-1 bg-brand-purple hover:brightness-110 text-white">
              <Link href={collectionHref("STARKNET", deployedAddress)}>Create memberships</Link>
            </Button>
          )}
        </div>
      </TransactionDialog>

      <ClaimRouteShell
        icon={<Users className="h-4 w-4 text-white" />}
        title="Create Club"
        subtitle="One club — create membership tiers and mint cards to your community."
        aside={
          <>
            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name")}
              collection={form.watch("symbol") || "Club"}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
            />
            <CreateClubAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Club image */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Club image</p>
              <div className="flex items-start gap-4">
                <div
                  className="relative h-28 w-28 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload club image"
                  onClick={() => !imageUploading && fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!imageUploading) fileInputRef.current?.click();
                    }
                  }}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Club image" fill className="object-cover" />
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
                      const f = e.target.files?.[0];
                      if (f) void handleImageSelect(f);
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={imageUploading}
                    onClick={() => fileInputRef.current?.click()}>
                    {imageUploading
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                      : imageFile ? "Change image" : "Upload image"}
                  </Button>
                  {imageFile && (
                    <button type="button" onClick={clearImage}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, SVG or WebP · max 10 MB
                    {imageUri && <span className="ml-2 text-emerald-500 font-medium">✓ Uploaded</span>}
                  </p>
                </div>
              </div>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Club name *</FormLabel>
                <FormControl><Input placeholder="My Club" {...field} /></FormControl>
                <FormDescription>Shown in wallets, explorers, and on every membership card.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CLUB"
                    maxLength={10}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>Short ticker — 2 to 10 uppercase letters.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your club — what does membership unlock?" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <button
              type="submit"
              disabled={action.status !== "idle" || imageUploading}
              className={`w-full h-12 text-base font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple ${action.status !== "idle" || imageUploading ? "opacity-40 pointer-events-none" : ""}`}
            >
              <Users className="h-4 w-4" />
              Create Club
            </button>
            <p className="text-xs text-center text-muted-foreground">
              Free to publish — no gas fees.
            </p>
          </form>
        </Form>
      </ClaimRouteShell>

      <WalletSetupGate action={action} />
    </>
  );
}

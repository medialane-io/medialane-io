"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Users, CheckCircle2, Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useUser } from "@clerk/nextjs";
import { STARKNET_IP_CLUB_FACTORY_CONTRACT, MEDIALANE_BACKEND_URL } from "@/lib/constants";
import { getTokenBySymbol, normalizeAddress, SUPPORTED_TOKENS } from "@medialane/sdk";
import { serializeByteArray, encodeU256 } from "@/lib/cairo-calldata";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { rewardToast } from "@/lib/reward-toast";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { CreateClubAside } from "@/components/claim/create-club-aside";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { toast } from "sonner";

const LISTABLE_TOKENS = SUPPORTED_TOKENS.filter((t) => t.listable);

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z.string().min(1, "Symbol required").max(10).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  maxMembers: z.string().default("").refine((v) => v === "" || /^\d+$/.test(v), "Must be a positive integer"),
  entryFeeAmount: z.string().default("").refine((v) => v === "" || !Number.isNaN(Number(v)), "Enter a valid amount"),
  paymentToken: z.string().default("USDC"),
  royaltyBps: z.coerce.number().min(0).max(50).default(0),
});
type FormValues = z.infer<typeof schema>;

export default function CreateClubPage() {
  const { isSignedIn } = useUser();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const {
    imageFile, imagePreview, imageUri, imageUploading,
    fileInputRef, handleImageSelect, clearImage,
  } = useLaunchpadImageUpload({ successMessage: "Image uploaded" });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "", description: "", maxMembers: "", entryFeeAmount: "", paymentToken: "USDC", royaltyBps: 0 },
  });

  const onSubmit = (values: FormValues) => {
    if (!STARKNET_IP_CLUB_FACTORY_CONTRACT) {
      toast.error("IP Club factory not configured");
      return;
    }
    if (imageFile && !imageUri && !imageUploading) {
      toast.error("Image upload failed", { description: "Please re-upload the club image." });
      return;
    }
    void action.run(async (secret) => {
      const fee = values.entryFeeAmount ? Number(values.entryFeeAmount) : 0;
      const token = fee > 0 ? getTokenBySymbol(values.paymentToken) : null;
      if (fee > 0 && !token) throw new Error("Unsupported payment token");

      // Pin the club metadata first — base_uri goes on-chain in the immutable
      // deploy, so a failed pin is fatal (pinLaunchpadMetadata throws).
      let baseUri = "";
      if (imageUri) {
        baseUri = await pinLaunchpadMetadata({
          name: values.name,
          description: values.description || "",
          image: imageUri,
        });
      }

      // Factory deploys a standalone IPClubCollection ERC-721 (the club IS a
      // collection). deploy_club(name, symbol, base_uri, max_supply:u256,
      // entry_fee:u256, payment_token:Option<addr>, royalty_bps:u256)
      const maxSupply = values.maxMembers ? BigInt(values.maxMembers) : 0xffffffffffffffffn; // unlimited
      const entryFee = fee > 0 && token ? BigInt(Math.round(fee * 10 ** token.decimals)) : 0n;
      const paymentTokenOpt = entryFee > 0n && token ? ["0", token.address] : ["1"];
      const royaltyBps = BigInt(Math.round(values.royaltyBps * 100));

      const result = await action.executeTransaction({
        pin: secret,
        calls: [{
          contractAddress: STARKNET_IP_CLUB_FACTORY_CONTRACT,
          entrypoint: "deploy_club",
          calldata: [
            ...serializeByteArray(values.name),
            ...serializeByteArray(values.symbol),
            ...serializeByteArray(baseUri),
            ...encodeU256(maxSupply),
            ...encodeU256(entryFee),
            ...paymentTokenOpt,
            ...encodeU256(royaltyBps),
          ],
        }],
      });
      if (result.status !== "confirmed") {
        throw new Error(result.revertReason ?? "Transaction reverted");
      }
      rewardToast("create_club");

      // Parse ClubDeployed (keys = [selector, collection_address, owner]) and
      // fast-path register so the new club appears in browse before the indexer
      // catches up. Best-effort — the tx already confirmed.
      try {
        type ReceiptEvent = { keys?: string[] };
        type ReceiptShape = { events?: ReceiptEvent[] };
        let receipt: ReceiptShape | null = null;
        for (let attempt = 0; attempt < 2 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
            receipt = (await starknetProvider.getTransactionReceipt(result.txHash)) as ReceiptShape;
          } catch { /* retry */ }
        }
        const selector = hash.getSelectorFromName("ClubDeployed");
        const deployEvent = (receipt?.events ?? []).find(
          (e) => e.keys?.[0] && BigInt(e.keys[0]) === BigInt(selector)
        );
        const addr = deployEvent?.keys?.[1] ? normalizeAddress("STARKNET", deployEvent.keys[1]) : null;
        if (addr) {
          await fetch(`${MEDIALANE_BACKEND_URL}/v1/collections/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contractAddress: addr,
              startBlock: 0,
              standard: "ERC721",
              source: "MEDIALANE_IP_CLUB",
            }),
          });
        }
      } catch { /* non-fatal — indexer will pick the club up on its next poll */ }

      return result;
    });
  };

  if (action.status === "error") {
    return <LaunchpadErrorState description={action.error ?? "Failed to create club"} backHref="/launchpad/club" backLabel="Back to Club launchpad" onRetry={action.reset} />;
  }
  if (busy) return <LaunchpadProcessingState title="Creating your club…" />;

  if (action.status === "success") {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-brand-indigo/10"
        iconClassName="text-brand-indigo"
        actionClassName="bg-brand-indigo hover:brightness-110 text-white"
        title="Club created"
        description="Your club and its membership card are live onchain. It will appear in the launchpad within a minute once indexed."
        backHref="/launchpad/club"
        backLabel="Back to Club launchpad"
        actionLabel="Create another"
        onAction={() => { action.reset(); form.reset(); clearImage(); }}
      />
    );
  }

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Users}
        iconClassName="text-brand-indigo"
        title="Sign in to create a club"
        description="Give your closest fans a membership card that unlocks more."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
        icon={<Users className="h-4 w-4 text-white" />}
        title="Create a Club"
        subtitle="Give your closest fans a membership card — free to publish, no platform fee."
        aside={
          <>
            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name")}
              collection={form.watch("symbol") || "Club"}
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
                      const file = e.target.files?.[0];
                      if (file) void handleImageSelect(file);
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
                    ) : imageFile ? "Change image" : "Upload image"}
                  </Button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, SVG, WebP · max 10 MB
                    {imageUri && <span className="ml-2 text-emerald-500 font-medium">✓ Uploaded</span>}
                  </p>
                </div>
              </div>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Club name *</FormLabel>
                <FormControl><Input placeholder="Inner Circle" {...field} /></FormControl>
                <FormDescription>Your club&apos;s public name — shown on membership cards.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol *</FormLabel>
                <FormControl>
                  <Input placeholder="CIRCLE" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} className="max-w-[160px]" />
                </FormControl>
                <FormDescription>Short ticker shown in wallets — 2 to 10 uppercase letters.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Textarea placeholder="What is this club about?" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="maxMembers" render={({ field }) => (
              <FormItem>
                <FormLabel>Member cap <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input type="number" min={1} placeholder="Unlimited" {...field} /></FormControl>
                <FormDescription>Leave blank for no limit.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-3">
              <FormField control={form.control} name="entryFeeAmount" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Entry fee <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="number" min={0} step="0.01" placeholder="Free" {...field} /></FormControl>
                  <FormDescription>Members pay this to join. Proceeds go to your wallet.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentToken" render={({ field }) => (
                <FormItem className="w-28">
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LISTABLE_TOKENS.map((t) => (
                        <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="royaltyBps" render={({ field }) => (
              <FormItem>
                <FormLabel>Royalty <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      placeholder="0"
                      className="max-w-[120px]"
                      {...field}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormDescription>Royalty on secondary sales (0–50%). Paid to your wallet.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" size="lg" className="w-full rounded-xl bg-brand-indigo hover:brightness-110 text-white" disabled={busy || imageUploading}>
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <><Users className="h-4 w-4 mr-2" />Create Club</>}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Free to publish — no gas fees.
            </p>
          </form>
        </Form>
      </ClaimRouteShell>

      <PinDialog {...action.pinDialogProps} title="Create club" description="Enter your PIN to create this club onchain." />
      <WalletSetupGate action={action} />
    </>
  );
}

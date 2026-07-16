"use client";

// Create Membership — creates a new membership tier and mints its full supply
// straight to the creator's own wallet, in one action. Same shape as the IP
// Tickets mint page: one form, no redundant panels, no recipient field — the
// creator ends up holding the membership cards and lists them on the
// marketplace like any other asset. The validity window gates membership,
// never minting, so a future season pass can be minted and sold today.

import { use, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import {
  Users, Loader2, ImagePlus, X, ShieldCheck, ChevronDown, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Contract, cairo, CairoOption, CairoOptionVariant, type Abi } from "starknet";
import { normalizeAddress, IPClubCollectionABI } from "@medialane/sdk";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useWriteAction } from "@/hooks/use-write-action";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useWallet } from "@/hooks/use-wallet";
import { useCollection } from "@/hooks/use-collections";
import { predictNextMembershipId } from "@/hooks/use-club";
import { uploadImageToIpfs } from "@/lib/upload-image";
import { rewardToast } from "@/lib/reward-toast";
import { starknetProvider } from "@/lib/starknet";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { CreateClubAside } from "@/components/claim/create-club-aside";
import { collectionHref } from "@/lib/routes";
import { LICENSE_TYPES, GEOGRAPHIC_SCOPES, AI_POLICIES, DERIVATIVES_OPTIONS } from "@/types/ip";

function dateToUnixTimestamp(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return Math.floor(d.getTime() / 1000);
}

function ToggleGroup({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
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
            value === opt ? "bg-primary text-primary-foreground font-medium" : "bg-background hover:bg-muted text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const schema = z.object({
  name: z.string().min(1, "Membership name required").max(100),
  description: z.string().max(1000).optional(),
  external_url: z.string().max(500)
    .refine((v) => !v || v.startsWith("http://") || v.startsWith("https://"), { message: "Must start with http:// or https://" })
    .optional(),
  maxSupply: z.string().min(1, "Supply required").regex(/^\d+$/, "Must be a positive integer")
    .refine((v) => parseInt(v, 10) >= 1, "Minimum supply is 1"),
  royalty: z.coerce.number().min(0).max(50).default(2.5),
  licenseType: z.string().min(1),
  commercialUse: z.enum(["Yes", "No"]),
  derivatives: z.enum(["Allowed", "Not Allowed", "Share-Alike"]),
  attribution: z.enum(["Required", "Not Required"]),
  geographicScope: z.string(),
  aiPolicy: z.enum(["Allowed", "Not Allowed", "Training Only"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreateMembershipPage({ params }: { params: Promise<{ contract: string }> }) {
  const { contract: rawContract } = use(params);
  const contract = normalizeAddress("STARKNET", rawContract);
  const { isSignedIn } = useUser();
  const { address } = useWallet();
  const { collection, isLoading } = useCollection(contract);
  const action = useWriteAction();

  const [licensingOpen, setLicensingOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mintedTierId, setMintedTierId] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const previewRef = useRef<string | null>(null);
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", description: "", external_url: "",
      maxSupply: "100", royalty: 2.5, licenseType: "CC BY-SA", commercialUse: "Yes",
      derivatives: "Share-Alike", attribution: "Required", geographicScope: "Worldwide", aiPolicy: "Not Allowed",
    },
  });

  const isOwner = !!address && !!collection?.owner && address.toLowerCase() === collection.owner.toLowerCase();

  const handleImageSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setImagePreview(url);
    setImageUri(null);
    setImageUploading(true);
    try {
      const uri = await uploadImageToIpfs(file);
      setImageUri(uri);
      toast.success("Image uploaded");
    } catch (err) {
      if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; }
      setImagePreview(null);
      toast.error("Image upload failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageClear = () => { setImagePreview(null); setImageUri(null); };

  const handleReset = () => {
    action.reset();
    setMintedTierId(null);
    form.reset({ ...form.getValues(), name: "", description: "", maxSupply: "100" });
    handleImageClear();
  };

  const onSubmit = (values: FormValues) => {
    if (!imageUri) { toast.error("Upload a membership image first"); return; }
    setMintedTierId(null);
    void action.run((secret) => handleUnlocked(values, secret));
  };

  const handleUnlocked = async (values: FormValues, secret: string) => {
    if (!address) throw new Error("Wallet not ready. Please refresh and try again.");
    const metadataForm = new FormData();
    metadataForm.set("name", values.name);
    metadataForm.set("description", values.description ?? "");
    metadataForm.set("imageUri", imageUri!);
    if (values.external_url) metadataForm.set("external_url", values.external_url);
    metadataForm.set("ipType", "NFT");
    metadataForm.set("licenseType", values.licenseType);
    metadataForm.set("commercialUse", values.commercialUse);
    metadataForm.set("derivatives", values.derivatives);
    metadataForm.set("attribution", values.attribution);
    metadataForm.set("geographicScope", values.geographicScope);
    metadataForm.set("aiPolicy", values.aiPolicy);
    metadataForm.set("royalty", String(values.royalty));
    metadataForm.append("tmpl_Type", "IP Club Membership");
    metadataForm.append("tmpl_Token Standard", "ERC-1155");
    metadataForm.append("tmpl_Max Supply", values.maxSupply);
    metadataForm.append("tmpl_Collection Contract", contract);

    const uploadRes = await fetch("/api/pinata", { method: "POST", body: metadataForm });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || uploadData.error || !uploadData.uri) throw new Error(uploadData.error ?? "Metadata upload failed");
    const metadataUri: string = uploadData.uri;

    const startTime = dateToUnixTimestamp(values.startDate);
    const endTime = dateToUnixTimestamp(values.endDate);
    const royaltyBps = Math.round(values.royalty * 100);

    const col = new Contract(IPClubCollectionABI as unknown as Abi, contract, starknetProvider);

    // Ids are sequential and only the owner can ever call create_membership,
    // so the id can be predicted ahead of the tx and both calls bundled into
    // one multicall — one PIN unlock for what is one "create" action.
    const tierId = await predictNextMembershipId(contract);
    setMintedTierId(String(tierId));

    const createCall = col.populate("create_membership", [
      cairo.uint256(values.maxSupply),
      startTime != null ? new CairoOption(CairoOptionVariant.Some, startTime) : new CairoOption(CairoOptionVariant.None),
      endTime != null ? new CairoOption(CairoOptionVariant.Some, endTime) : new CairoOption(CairoOptionVariant.None),
      royaltyBps,
      metadataUri,
    ]);
    const mintCall = col.populate("mint", [address, cairo.uint256(tierId), cairo.uint256(values.maxSupply)]);

    const mintResult = await action.executeTransaction({
      pin: secret,
      calls: [
        { contractAddress: contract, entrypoint: "create_membership", calldata: createCall.calldata as string[] },
        { contractAddress: contract, entrypoint: "mint", calldata: mintCall.calldata as string[] },
      ],
    });
    if (mintResult.status !== "confirmed") throw new Error(mintResult.revertReason ?? "Failed to create membership");

    rewardToast("launch_launchpad");
    return mintResult;
  };

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Users}
        iconClassName="text-brand-purple"
        title="Sign in to create memberships"
        description="Create a membership tier and mint its supply to your wallet."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">Collection not found.</p>
        <Button asChild variant="outline" size="sm"><Link href="/launchpad/club">← Back</Link></Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Users className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">You don&apos;t own this club.</p>
        <Button asChild variant="outline" size="sm"><Link href="/launchpad/club">← Back to clubs</Link></Button>
      </div>
    );
  }

  return (
    <>
      <TransactionDialog
        action={action}
        title="Create membership"
        processingLabel="Creating your membership…"
        firstStepLabel="Upload membership metadata"
        successTitle="Membership created!"
        pinDescription="Enter your PIN to create and mint this membership."
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{form.getValues("maxSupply")}</span> membership
          card(s) are in your wallet — list them on the marketplace whenever you&apos;re ready.
        </p>
        {imagePreview && (
          <div className="h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt={form.getValues("name")} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Create another membership
          </Button>
          {mintedTierId && (
            <Button asChild className="flex-1 bg-brand-purple hover:brightness-110 text-white">
              <Link href={`${collectionHref("STARKNET", contract)}`}>View collection</Link>
            </Button>
          )}
        </div>
      </TransactionDialog>
      <WalletSetupGate action={action} />

      <ClaimRouteShell
        icon={<Users className="h-4 w-4 text-white" />}
        title="Create Membership"
        subtitle={`Add a new membership tier to ${collection.name ?? "your club"} and mint its supply to your wallet, ready to list.`}
        aside={
          <>
            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name")}
              collection={collection.symbol || "Club"}
              creator={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined}
            />
            <CreateClubAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Membership image <span className="text-destructive">*</span></p>
              <div className="flex items-center gap-4">
                <div
                  role="button" tabIndex={0}
                  onClick={() => !imageUploading && document.getElementById("mint-membership-file-input")?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("mint-membership-file-input")?.click(); }}
                  className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-brand-purple/50 transition-colors"
                >
                  {imagePreview ? <Image src={imagePreview} alt="Membership" fill className="object-cover" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                  {imageUploading && <div className="absolute inset-0 bg-background/70 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                </div>
                <div className="space-y-1.5">
                  <input id="mint-membership-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                  <Button type="button" variant="outline" size="sm" disabled={imageUploading} onClick={() => document.getElementById("mint-membership-file-input")?.click()}>
                    {imageUploading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</> : imagePreview ? "Change" : "Upload image"}
                  </Button>
                  {imagePreview && (
                    <button type="button" onClick={handleImageClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">{imageUri ? <span className="text-brand-purple">✓ Uploaded</span> : "JPG, PNG, SVG or WebP · max 10 MB"}</p>
                </div>
              </div>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Membership name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Kalamaha Fan Club — 2026 Season Pass" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Textarea placeholder="What does this membership unlock?" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="external_url" render={({ field }) => (
              <FormItem>
                <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="https://yourwebsite.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Collapsible open={licensingOpen} onOpenChange={setLicensingOpen}>
              <div className="sm:overflow-hidden sm:rounded-xl sm:border sm:border-border">
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between px-0 py-3 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Licensing Terms</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional · Berne Convention</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", licensingOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-0 pb-4 sm:px-5 sm:pb-5 space-y-4 border-t border-border/60 pt-4">
                    <FormField control={form.control} name="licenseType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>License</FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          form.setValue("licenseType", value);
                          const def = LICENSE_TYPES.find((l) => l.value === value);
                          if (def) { form.setValue("commercialUse", def.commercialUse); form.setValue("derivatives", def.derivatives); form.setValue("attribution", def.attribution); }
                        }}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{LICENSE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                        </Select>
                        {(() => { const def = LICENSE_TYPES.find((l) => l.value === field.value); return def ? <p className="text-xs text-muted-foreground mt-1">{def.description}</p> : null; })()}
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="commercialUse" render={({ field }) => (
                      <FormItem><FormLabel>Commercial Use</FormLabel><ToggleGroup value={field.value} options={["Yes", "No"]} onChange={field.onChange} /></FormItem>
                    )} />
                    <FormField control={form.control} name="derivatives" render={({ field }) => (
                      <FormItem><FormLabel>Derivatives</FormLabel><ToggleGroup value={field.value} options={DERIVATIVES_OPTIONS} onChange={field.onChange} /></FormItem>
                    )} />
                    <FormField control={form.control} name="attribution" render={({ field }) => (
                      <FormItem><FormLabel>Attribution</FormLabel><ToggleGroup value={field.value} options={["Required", "Not Required"]} onChange={field.onChange} /></FormItem>
                    )} />
                    <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                      <CollapsibleTrigger asChild>
                        <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                          Advanced options
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-3">
                        <FormField control={form.control} name="geographicScope" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Territory</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{GEOGRAPHIC_SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="aiPolicy" render={({ field }) => (
                          <FormItem><FormLabel>AI &amp; Data Mining</FormLabel><ToggleGroup value={field.value} options={AI_POLICIES} onChange={field.onChange} /></FormItem>
                        )} />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="maxSupply" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supply <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input type="number" min="1" placeholder="100" {...field} /></FormControl>
                  <FormDescription>Minted to your wallet.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="royalty" render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty % (0–50)</FormLabel>
                  <FormControl><Input type="number" min={0} max={50} step={0.5} placeholder="2.5" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormDescription>On secondary sales.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid from <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormDescription>You can mint and sell before it opens.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid until <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormDescription>Blank = lifetime membership.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <button
              type="submit"
              disabled={action.status !== "idle" || imageUploading}
              className={`w-full h-12 text-base font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple ${action.status !== "idle" || imageUploading ? "opacity-40 pointer-events-none" : ""}`}
            >
              <Users className="h-4 w-4 mr-2" />
              Create Membership
            </button>
          </form>
        </Form>
      </ClaimRouteShell>
    </>
  );
}

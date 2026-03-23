"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { usePostMintListing } from "@/hooks/use-post-mint-listing";
import { MintProgressDialog } from "@/components/marketplace/mint-progress-dialog";
import type { MintStep } from "@/components/marketplace/mint-progress-dialog";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { cn } from "@/lib/utils";
import { DURATION_OPTIONS } from "@/lib/constants";
import { getListableTokens } from "@medialane/sdk";
import {
  IP_TYPES,
  LICENSE_TYPES,
  GEOGRAPHIC_SCOPES,
  AI_POLICIES,
  DERIVATIVES_OPTIONS,
  type IPType,
} from "@/types/ip";
import { IPTypeFields } from "@/components/create/ip-type-fields";
import {
  Upload,
  ChevronDown,
  ShieldCheck,
  Boxes,
  Plus,
  ImagePlus,
  Tag,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { ChipiCall } from "@/hooks/use-chipi-transaction";

const LISTING_CURRENCIES = getListableTokens().map((t) => t.symbol);

const schema = z.object({
  collectionId: z.string().min(1, "Select a collection"),
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(1000).optional(),
  external_url: z
    .string()
    .max(500)
    .refine((v) => !v || v.startsWith("http://") || v.startsWith("https://"), {
      message: "Must start with http:// or https://",
    })
    .optional(),
  ipType: z.enum(IP_TYPES),
  licenseType: z.string().min(1, "License required"),
  commercialUse: z.enum(["Yes", "No"]),
  derivatives: z.enum(["Allowed", "Not Allowed", "Share-Alike"]),
  attribution: z.enum(["Required", "Not Required"]),
  geographicScope: z.string(),
  aiPolicy: z.enum(["Allowed", "Not Allowed", "Training Only"]),
  royalty: z.coerce.number().min(0).max(50),
  image: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof schema>;

function ToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
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

export default function CreateAssetPage() {
  const { executeTransaction, status, txHash, error, statusMessage } = useChipiTransaction();
  const { walletAddress } = useSessionKey();
  const client = useMedialaneClient();
  const { listingStep, listingError, runPostMintListing, resetListing } = usePostMintListing();

  // Fetch user's collections from the API (collectionId field contains on-chain registry ID)
  const { collections: allCollections, isLoading: collectionsLoading } = useCollectionsByOwner(walletAddress ?? null);
  // Only show collections that have been indexed with their on-chain ID (required for minting)
  const collections = allCollections.filter((c) => c.collectionId != null);

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [licensingOpen, setLicensingOpen] = useState(false);
  const [ipTypeOpen, setIpTypeOpen] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [listCurrency, setListCurrency] = useState<string>(LISTING_CURRENCIES[0] ?? "USDC");
  const [listDuration, setListDuration] = useState<number>(DURATION_OPTIONS[0]?.seconds ?? 86400);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
  const pinRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const hasWallet = !!walletAddress;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      collectionId: "",
      name: "",
      description: "",
      external_url: "",
      ipType: "NFT",
      licenseType: "All Rights Reserved",
      commercialUse: "No",
      derivatives: "Not Allowed",
      attribution: "Required",
      geographicScope: "Worldwide",
      aiPolicy: "Not Allowed",
      royalty: 0,
    },
  });

  // When a collection is selected, pre-fill external_url with the collection page URL
  const selectedCollectionId = form.watch("collectionId");
  useEffect(() => {
    const col = collections.find((c) => c.collectionId === selectedCollectionId);
    if (col?.contractAddress && !form.getValues("external_url")) {
      form.setValue("external_url", `https://medialane.io/collections/${col.contractAddress}`);
    }
  }, [selectedCollectionId, collections, form]);

  const handleLicenseChange = (value: string) => {
    form.setValue("licenseType", value);
    const def = LICENSE_TYPES.find((l) => l.value === value);
    if (def) {
      form.setValue("commercialUse", def.commercialUse);
      form.setValue("derivatives", def.derivatives);
      form.setValue("attribution", def.attribution);
    }
  };

  const onSubmit = (values: FormValues) => {
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    pinRef.current = pin;
    setMintError(null);
    resetListing();
    setMintStep("uploading");

    try {
      // 1. Upload image + metadata to IPFS via /api/pinata
      const formData = new FormData();
      formData.set("name", pendingValues.name);
      formData.set("description", pendingValues.description ?? "");
      if (pendingValues.external_url) formData.set("external_url", pendingValues.external_url);
      formData.set("creator", walletAddress);
      formData.set("ipType", pendingValues.ipType);
      formData.set("licenseType", pendingValues.licenseType);
      formData.set("commercialUse", pendingValues.commercialUse);
      formData.set("derivatives", pendingValues.derivatives);
      formData.set("attribution", pendingValues.attribution);
      formData.set("geographicScope", pendingValues.geographicScope);
      formData.set("aiPolicy", pendingValues.aiPolicy);
      formData.set("royalty", String(pendingValues.royalty));
      if (imageFile) formData.set("file", imageFile);

      // Forward template-specific fields — keyed as "tmpl_{trait_type}"
      Object.entries(templateFields).forEach(([key, value]) => {
        if (value?.trim()) formData.set(`tmpl_${key}`, value.trim());
      });

      const uploadRes = await fetch("/api/pinata", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) {
        throw new Error(uploadData.error ?? "IPFS upload failed");
      }
      const tokenUri: string = uploadData.uri;
      if (!tokenUri) throw new Error("IPFS upload returned no URI");

      setMintStep("processing");

      // 2. Create mint intent — backend validates ownership on-chain + encodes Cairo calldata
      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId: pendingValues.collectionId,
        recipient: walletAddress,
        tokenUri,
      });

      const intentData = intentRes.data as { calls?: { contractAddress: string; [key: string]: unknown }[] } | undefined;
      if (!intentData?.calls?.length) {
        throw new Error("Mint intent returned no calls");
      }

      // 3. Execute via ChipiPay
      const result = await executeTransaction({
        pin,
        contractAddress: intentData.calls[0].contractAddress,
        calls: intentData.calls as ChipiCall[],
      });

      if (result.status === "reverted") {
        throw new Error(result.revertReason || "Mint transaction reverted on chain");
      }

      setMintStep("success");
      invalidatePortfolioCache(walletAddress);

      // ── Optional listing after mint ──────────────────────────────────────
      const col = collections.find((c) => c.collectionId === pendingValues.collectionId);
      const wantListing = listingOpen && listPrice && parseFloat(listPrice) > 0 && col?.contractAddress && pinRef.current;
      if (wantListing) {
        const savedPin = pinRef.current!;
        pinRef.current = null;
        await runPostMintListing({
          walletAddress,
          collectionContract: col!.contractAddress,
          price: listPrice,
          currencySymbol: listCurrency,
          durationSeconds: listDuration,
          tokenName: pendingValues.name,
          pin: savedPin,
        });
      } else {
        pinRef.current = null;
      }
    } catch (err: unknown) {
      pinRef.current = null;
      setMintError(err instanceof Error ? err.message : "Something went wrong");
      setMintStep("error");
    }
  };

  const handleMintAnother = () => {
    setMintStep("idle");
    setMintError(null);
    resetListing();
    pinRef.current = null;
    form.reset();
    setTemplateFields({});
    setImageFile(null);
    setImagePreview(null);
    setListPrice("");
  };

  return (
    <>
      <MintProgressDialog
        open={mintStep !== "idle"}
        mintStep={mintStep}
        txStatus={status}
        assetName={pendingValues?.name ?? ""}
        imagePreview={imagePreview}
        txHash={txHash}
        error={mintError}
        onMintAnother={handleMintAnother}
        listingStep={listingStep}
        listingError={listingError}
      />

      <div className="container max-w-2xl mx-auto px-4 pt-14 pb-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <ImagePlus className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Create</span>
          </div>
          <h1 className="text-3xl font-bold">Create IP Asset</h1>
          <p className="text-muted-foreground">
            Mint your creative work as a programmable NFT on Starknet with immutable licensing embedded in IPFS metadata.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Collection selector */}
            <FormField
              control={form.control}
              name="collectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Boxes className="h-4 w-4" />
                    Collection *
                  </FormLabel>
                  {collectionsLoading ? (
                    <Skeleton className="h-10 w-full rounded-md" />
                  ) : collections.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        You don&apos;t have any collections yet. Create one first.
                      </p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/create/collection">
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Create collection
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collections.map((col) => (
                          <SelectItem key={col.collectionId!} value={col.collectionId!}>
                            {col.name || col.symbol || `Collection #${col.collectionId}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover image</label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                role="button"
                tabIndex={0}
                aria-label="Upload image"
                onClick={() => document.getElementById("image-upload")?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById("image-upload")?.click(); } }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">Click to upload (JPG, PNG, GIF, SVG, WebP · max 4 MB)</p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"];
                    if (file.size > 4 * 1024 * 1024) {
                      toast.error("File too large", { description: "Maximum file size is 4 MB." });
                      e.target.value = "";
                      return;
                    }
                    if (!ALLOWED.includes(file.type)) {
                      toast.error("Unsupported format", { description: "Please upload a JPG, PNG, GIF, SVG, or WebP image." });
                      e.target.value = "";
                      return;
                    }
                    setImageFile(file);
                    form.setValue("image", file);
                    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                    const objectUrl = URL.createObjectURL(file);
                    previewUrlRef.current = objectUrl;
                    setImagePreview(objectUrl);
                  }}
                />
              </div>
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Creative Work" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your work, its story, and any context for buyers…"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* External URL */}
            <FormField
              control={form.control}
              name="external_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional listing section */}
            <Collapsible open={listingOpen} onOpenChange={setListingOpen}>
              <div className="rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">List on marketplace after minting</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", listingOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Set a price and your asset will be listed on the marketplace immediately after it&apos;s minted. One PIN, two actions.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Price</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Currency</label>
                        <Select value={listCurrency} onValueChange={setListCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LISTING_CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Duration</label>
                      <Select value={String(listDuration)} onValueChange={(v) => setListDuration(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((d) => (
                            <SelectItem key={d.seconds} value={String(d.seconds)}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Licensing Terms — optional, collapsed by default */}
            <Collapsible open={licensingOpen} onOpenChange={setLicensingOpen}>
              <div className="rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Licensing Terms</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional · Berne Convention</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", licensingOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Set licensing terms for your work. These are embedded as immutable IPFS metadata and Berne Convention-compatible.
                    </p>
                    <FormField
                      control={form.control}
                      name="licenseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License</FormLabel>
                          <Select value={field.value} onValueChange={handleLicenseChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LICENSE_TYPES.map((l) => (
                                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(() => {
                            const def = LICENSE_TYPES.find((l) => l.value === field.value);
                            return def ? (
                              <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                            ) : null;
                          })()}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="commercialUse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commercial Use</FormLabel>
                          <ToggleGroup value={field.value} options={["Yes", "No"]} onChange={field.onChange} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="derivatives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Derivatives</FormLabel>
                          <ToggleGroup value={field.value} options={DERIVATIVES_OPTIONS} onChange={field.onChange} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="attribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attribution</FormLabel>
                          <ToggleGroup value={field.value} options={["Required", "Not Required"]} onChange={field.onChange} />
                        </FormItem>
                      )}
                    />
                    <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                          Advanced options
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-3">
                        <FormField
                          control={form.control}
                          name="geographicScope"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Territory</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {GEOGRAPHIC_SCOPES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="aiPolicy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI &amp; Data Mining</FormLabel>
                              <ToggleGroup value={field.value} options={AI_POLICIES} onChange={field.onChange} />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="royalty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Royalty % (0–50)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={50}
                                  step={0.5}
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* IP Type & template fields — optional, collapsed by default */}
            <Collapsible open={ipTypeOpen} onOpenChange={setIpTypeOpen}>
              <div className="rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">IP Type &amp; Metadata</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", ipTypeOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Choose a content type to unlock optional metadata fields tailored to your work — artist credits, embed links, technical specs, and more.
                    </p>
                    <FormField
                      control={form.control}
                      name="ipType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {IP_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <IPTypeFields
                      ipType={form.watch("ipType") as IPType}
                      onChange={setTemplateFields}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <div className={`btn-border-animated p-[1px] rounded-xl ${mintStep !== "idle" || collectionsLoading || collections.length === 0 ? "opacity-40 pointer-events-none" : ""}`}>
              <button
                type="submit"
                disabled={mintStep !== "idle" || collectionsLoading || collections.length === 0}
                className="w-full h-12 text-base font-semibold text-white rounded-[11px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue"
              >
                {listingOpen && listPrice && parseFloat(listPrice) > 0 ? "Mint & List" : "Mint asset"}
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Gas is free. Your PIN signs the mint{listingOpen && listPrice ? " and listing" : ""} transaction.
            </p>
          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm mint"
        description="Enter your PIN to mint this asset on Starknet."
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setPinOpen(true);
        }}
      />
    </>
  );
}

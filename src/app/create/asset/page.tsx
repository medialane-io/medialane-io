"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { TxStatus } from "@/components/chipi/tx-status";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useUserCollections } from "@/hooks/use-user-collections";
import { EXPLORER_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  IP_TYPES,
  LICENSE_TYPES,
  GEOGRAPHIC_SCOPES,
  AI_POLICIES,
  DERIVATIVES_OPTIONS,
} from "@/types/ip";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Boxes,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { ChipiCall } from "@/hooks/use-chipi-transaction";

const schema = z.object({
  collectionId: z.string().min(1, "Select a collection"),
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(1000).optional(),
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
  const { walletAddress, wallet } = useSessionKey();
  const client = useMedialaneClient();

  // Fetch user's collections from the collection registry on-chain
  const { collections, isLoading: collectionsLoading } = useUserCollections(walletAddress ?? null);

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const hasWallet = !!walletAddress;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      collectionId: "",
      name: "",
      description: "",
      ipType: "Art",
      licenseType: "All Rights Reserved",
      commercialUse: "No",
      derivatives: "Not Allowed",
      attribution: "Required",
      geographicScope: "Worldwide",
      aiPolicy: "Not Allowed",
      royalty: 0,
    },
  });

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

    try {
      // 1. Upload image + metadata to IPFS via /api/pinata
      const formData = new FormData();
      formData.set("name", pendingValues.name);
      formData.set("description", pendingValues.description ?? "");
      formData.set("ipType", pendingValues.ipType);
      formData.set("licenseType", pendingValues.licenseType);
      formData.set("commercialUse", pendingValues.commercialUse);
      formData.set("derivatives", pendingValues.derivatives);
      formData.set("attribution", pendingValues.attribution);
      formData.set("geographicScope", pendingValues.geographicScope);
      formData.set("aiPolicy", pendingValues.aiPolicy);
      formData.set("royalty", String(pendingValues.royalty));
      if (pendingValues.image) formData.set("file", pendingValues.image);

      const uploadRes = await fetch("/api/pinata", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) {
        throw new Error(uploadData.error ?? "IPFS upload failed");
      }
      const tokenUri: string = uploadData.uri;
      if (!tokenUri) throw new Error("IPFS upload returned no URI");

      // 2. Create mint intent — backend validates ownership on-chain + encodes Cairo calldata
      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId: pendingValues.collectionId,
        recipient: walletAddress,
        tokenUri,
      });

      if (!intentRes.data?.calls?.length) {
        throw new Error("Mint intent returned no calls");
      }

      // 3. Execute via ChipiPay
      const walletOverride = wallet
        ? { publicKey: wallet.publicKey, encryptedPrivateKey: wallet.encryptedPrivateKey }
        : undefined;

      await executeTransaction({
        pin,
        contractAddress: intentRes.data.calls[0].contractAddress,
        calls: intentRes.data.calls as ChipiCall[],
        wallet: walletOverride,
      });

      toast.success("Asset created!", { description: `${pendingValues.name} has been minted.` });
      form.reset();
      setImagePreview(null);
    } catch (err: any) {
      toast.error("Creation failed", { description: err?.message });
    }
  };

  if (status === "confirmed") {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold">Asset created!</h1>
        <p className="text-muted-foreground">{pendingValues?.name} has been minted on Starknet.</p>
        {txHash && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              View on Voyager <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={() => { form.reset(); window.location.reload(); }}>Create another</Button>
          <Button variant="outline" asChild>
            <Link href="/portfolio/assets">View portfolio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create IP Asset</h1>
          <p className="text-muted-foreground mt-1">
            Mint your creative work as a programmable NFT on Starknet with immutable licensing embedded in IPFS metadata.
          </p>
        </div>

        {(status === "submitting" || status === "confirming") && (
          <TxStatus status={status} txHash={txHash} statusMessage={statusMessage} />
        )}

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
                          <SelectItem key={col.onChainId} value={col.onChainId}>
                            {col.name || col.symbol || `Collection #${col.onChainId}`}
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
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">Click to upload (JPG, PNG, GIF, SVG, WebP · max 10 MB)</p>
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
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File too large", { description: "Maximum file size is 10 MB." });
                      e.target.value = "";
                      return;
                    }
                    if (!ALLOWED.includes(file.type)) {
                      toast.error("Unsupported format", { description: "Please upload a JPG, PNG, GIF, SVG, or WebP image." });
                      e.target.value = "";
                      return;
                    }
                    form.setValue("image", file);
                    setImagePreview(URL.createObjectURL(file));
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

            {/* IP Type */}
            <FormField
              control={form.control}
              name="ipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Licensing section */}
            <div className="space-y-4 rounded-xl border border-border p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Licensing Terms</p>
                <span className="text-xs text-muted-foreground ml-auto">Embedded in IPFS metadata · Berne Convention</span>
              </div>

              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License</FormLabel>
                    <Select value={field.value} onValueChange={handleLicenseChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={
                status === "submitting" ||
                status === "confirming" ||
                collectionsLoading ||
                collections.length === 0
              }
            >
              {status === "submitting" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting…</>
              ) : (
                "Mint asset"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Gas is free. Your PIN signs the mint transaction.
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

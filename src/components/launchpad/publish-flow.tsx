"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hash } from "starknet";
import { normalizeAddress, getService } from "@medialane/sdk";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import {
  ImagePlus, Music, Video, FileText, X, Loader2,
  Layers, ImagePlus as SingleIcon, ArrowRight, CheckCircle2, ChevronDown, Boxes, Plus, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { executeIntent } from "@/lib/wallet/intent-tx";
import { rewardToast } from "@/lib/reward-toast";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { uploadImageToIpfs } from "@/lib/upload-image";
import { uploadDocumentToIpfs } from "@/lib/upload-document";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { starknetProvider } from "@/lib/starknet";
import { suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { cn, ipfsToHttp } from "@/lib/utils";
import {
  IP_TYPES, LICENSE_TYPES, GEOGRAPHIC_SCOPES, AI_POLICIES, DERIVATIVES_OPTIONS,
  type IPType,
} from "@/types/ip";
import { IPTypeFields, type MetadataField } from "@/components/create/ip-type-fields";
import { toast } from "sonner";
import type { ApiCollection } from "@medialane/sdk";

const COLLECTION_DEPLOYED_SELECTOR = hash.getSelectorFromName("CollectionDeployed");

type MediaKind = "image" | "audio" | "video" | "document";

function detectMediaKind(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

const IP_TYPE_BY_KIND: Record<MediaKind, IPType> = {
  image: "NFT",
  audio: "Audio",
  video: "Video",
  document: "Documents",
};

const MEDIA_KIND_ICON: Record<MediaKind, typeof ImagePlus> = {
  image: ImagePlus,
  audio: Music,
  video: Video,
  document: FileText,
};

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
            value === opt ? "bg-primary text-primary-foreground font-medium" : "bg-background hover:bg-muted text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function collectionLabel(col: ApiCollection) {
  return col.name || col.symbol || `Collection #${col.collectionId}`;
}

function CollectionThumb({ image }: { image: string | null | undefined }) {
  const imageUrl = image ? ipfsToHttp(image) : null;
  return (
    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Boxes className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function CollectionPicker({
  collections, value, onChange,
}: { collections: ApiCollection[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  const selected = collections.find((c) => c.collectionId === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/40"
        >
          <CollectionThumb image={selected?.image} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {selected ? collectionLabel(selected) : collections.length ? "Choose a collection" : "No collections yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {selected ? `${selected.totalSupply ?? 0} work${selected.totalSupply === 1 ? "" : "s"}` : "Where this work will live"}
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="max-h-64 overflow-y-auto p-1">
          {collections.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No collections yet — create one instead.</p>
          ) : (
            collections.map((col) => {
              const isSelected = value === col.collectionId;
              return (
                <button
                  key={col.collectionId!}
                  type="button"
                  onClick={() => { onChange(col.collectionId!); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
                >
                  <CollectionThumb image={col.image} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{collectionLabel(col)}</p>
                    <p className="text-xs text-muted-foreground">{col.totalSupply ?? 0} work{col.totalSupply === 1 ? "" : "s"}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-brand-blue shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(1000).optional(),
  external_url: z.string().max(500).refine((v) => !v || v.startsWith("http://") || v.startsWith("https://"), {
    message: "Must start with http:// or https://",
  }).optional(),
  licenseType: z.string().min(1, "License required"),
  commercialUse: z.enum(["Yes", "No"]),
  derivatives: z.enum(["Allowed", "Not Allowed", "Share-Alike"]),
  attribution: z.enum(["Required", "Not Required"]),
  geographicScope: z.string(),
  aiPolicy: z.enum(["Allowed", "Not Allowed", "Training Only"]),
  royalty: z.coerce.number().min(0).max(50),
});
type FormValues = z.infer<typeof schema>;

export function PublishFlow() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();
  const action = useWalletWriteAction();
  const client = useMedialaneClient();
  const { collections, mutate: refetchCollections } = useCollectionsByOwner(walletAddress ?? null);
  const busy = action.status === "processing" || action.status === "confirming";

  const secureToken = async () => getValidToken() ?? (await signIn());

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind>("image");
  const [mediaUploading, setMediaUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [featurePreview, setFeaturePreview] = useState<string | null>(null);
  const [featureUri, setFeatureUri] = useState<string | null>(null);
  const [featureUploading, setFeatureUploading] = useState(false);
  const featurePreviewRef = useRef<string | null>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);

  const [assetType, setAssetType] = useState<"single" | "editions">("single");
  const [editionCount, setEditionCount] = useState("10");

  const [collectionMode, setCollectionMode] = useState<"existing" | "new">("existing");
  const [existingCollectionId, setExistingCollectionId] = useState("");
  const [existingCollectionContract, setExistingCollectionContract] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionSymbol, setNewCollectionSymbol] = useState("");
  const [autoSymbol, setAutoSymbol] = useState("");
  const [autoCollectionName, setAutoCollectionName] = useState("");

  const [ipType, setIpType] = useState<IPType>("NFT");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [ipTypeOpen, setIpTypeOpen] = useState(false);
  const templateFieldsRef = useRef<MetadataField[]>([]);

  const [mintedHref, setMintedHref] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (featurePreviewRef.current) URL.revokeObjectURL(featurePreviewRef.current);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", description: "", external_url: "",
      licenseType: "CC BY-SA", commercialUse: "Yes", derivatives: "Share-Alike",
      attribution: "Required", geographicScope: "Worldwide", aiPolicy: "Not Allowed", royalty: 0,
    },
  });
  const name = form.watch("name");

  useEffect(() => {
    const s = suggestLaunchpadSymbol(name);
    if (!s) return;
    if (!newCollectionSymbol || newCollectionSymbol === autoSymbol) {
      setNewCollectionSymbol(s);
      setAutoSymbol(s);
    }
    if (!newCollectionName || newCollectionName === autoCollectionName) {
      setNewCollectionName(name);
      setAutoCollectionName(name);
    }
  }, [name, autoSymbol, autoCollectionName, newCollectionSymbol, newCollectionName]);

  const erc721Collections = collections.filter((c) => getService(c.service)?.id === "mip-erc721");
  const erc1155Collections = collections.filter((c) => c.standard === "ERC1155");

  const handleMediaSelect = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 25 MB." });
      return;
    }
    const kind = detectMediaKind(file.type);
    setMediaFile(file);
    setMediaKind(kind);
    setIpType(IP_TYPE_BY_KIND[kind]);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setMediaPreview(objectUrl);
    setMediaUri(null);
    setMediaUploading(true);
    try {
      const token = await secureToken();
      if (!token) throw new Error("Secure your account first");
      const uri = await uploadDocumentToIpfs(file, token);
      setMediaUri(uri);
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setMediaUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaUri(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handleFeatureSelect = async (file: File) => {
    if (featurePreviewRef.current) URL.revokeObjectURL(featurePreviewRef.current);
    const objectUrl = URL.createObjectURL(file);
    featurePreviewRef.current = objectUrl;
    setFeaturePreview(objectUrl);
    setFeatureUri(null);
    setFeatureUploading(true);
    try {
      const token = await secureToken();
      if (!token) throw new Error("Secure your account first");
      const uri = await uploadImageToIpfs(file, token);
      setFeatureUri(uri);
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setFeatureUploading(false);
    }
  };

  const handleLicenseChange = (value: string) => {
    form.setValue("licenseType", value);
    const def = LICENSE_TYPES.find((l) => l.value === value);
    if (def) {
      form.setValue("commercialUse", def.commercialUse);
      form.setValue("derivatives", def.derivatives);
      form.setValue("attribution", def.attribution);
    }
  };

  const ready = !!mediaUri && !mediaUploading && name.trim().length > 0 &&
    (mediaKind === "image" || !!featureUri) &&
    (collectionMode === "existing"
      ? assetType === "single" ? !!existingCollectionId : !!existingCollectionContract
      : newCollectionName.trim().length > 0 && newCollectionSymbol.trim().length > 0);

  async function pollForNewCollection(name: string, symbol: string): Promise<ApiCollection | null> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await refetchCollections();
      const list: ApiCollection[] = Array.isArray(res) ? res : (res?.data ?? []);
      const match = list.find((c) => c.name === name && c.symbol === symbol);
      if (match?.collectionId) return match;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return null;
  }

  const onSubmit = (values: FormValues) => {
    if (!mediaUri) return;
    void action.run((signer) => handleUnlocked(values, signer));
  };

  const handleUnlocked = async (values: FormValues, signer: StarknetVenueSigner) => {
    if (!walletAddress || !mediaUri) throw new Error("Account not ready. Please refresh and try again.");

    const image = mediaKind === "image" ? mediaUri : featureUri!;
    const animationUrl = mediaKind === "image" ? undefined : mediaUri;

    const metadata: Record<string, unknown> = {
      name: values.name,
      description: values.description || "",
      image,
      external_link: values.external_url || "",
    };
    if (animationUrl) metadata.animation_url = animationUrl;
    templateFieldsRef.current.forEach(({ traitType, value }) => {
      if (traitType.trim() && value.trim()) {
        metadata[`tmpl_${traitType.trim()}`] = value.trim();
      }
    });
    const siwsToken = await secureToken();
    if (!siwsToken) throw new Error("Secure your account first");
    const tokenUri = await pinLaunchpadMetadata(metadata, siwsToken);

    if (assetType === "single") {
      let collectionId = existingCollectionId;

      if (collectionMode === "new") {
        const intentRes = await client.api.createCollectionIntent({
          owner: walletAddress,
          name: newCollectionName,
          symbol: newCollectionSymbol,
        });
        await executeIntent(signer, client, intentRes.data, { confirm: false });

        const found = await pollForNewCollection(newCollectionName, newCollectionSymbol);
        if (!found) throw new Error("Collection created, but it's still indexing — try minting again in a moment from My Collections.");
        collectionId = found.collectionId!;
      }

      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId,
        recipient: walletAddress,
        tokenUri,
        royaltyBps: Math.round(values.royalty * 100),
      });
      const result = await executeIntent(signer, client, intentRes.data, { confirm: false });

      setMintedHref("/portfolio");
      rewardToast("mint_asset");
      invalidatePortfolioCache(walletAddress);
      return result;
    }

    let collectionContract = existingCollectionContract;

    if (collectionMode === "new") {
      const intentRes = await client.api.createCollectionIntent({
        owner: walletAddress,
        name: newCollectionName,
        symbol: newCollectionSymbol,
        baseUri: "",
        service: "mip-erc1155",
      });
      const deployResult = await executeIntent(signer, client, intentRes.data, { confirm: false });

      let receipt: { events?: { keys?: string[] }[] } | null = null;
      for (let attempt = 0; attempt < 3 && !receipt; attempt++) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
          const raw: unknown = await starknetProvider.getTransactionReceipt(deployResult.txHash);
          receipt = raw as { events?: { keys?: string[] }[] };
        } catch { /* retry */ }
      }
      const events = receipt?.events ?? [];
      const deployEvent = events.find((e) =>
        e.keys?.[0] && BigInt(e.keys[0]) === BigInt(COLLECTION_DEPLOYED_SELECTOR)
      );
      if (!deployEvent?.keys?.[1]) throw new Error("Collection deployed, but its address couldn't be read — check My Collections to mint into it.");
      collectionContract = normalizeAddress("STARKNET", deployEvent.keys[1]);
    }

    const intentRes = await client.api.createMintIntent({
      owner: walletAddress,
      recipient: walletAddress,
      collectionContract,
      tokenUri,
      value: editionCount,
      royaltyBps: Math.round(values.royalty * 100),
    });
    const result = await executeIntent(signer, client, intentRes.data, { confirm: false });

    setMintedHref(`/launchpad/nfteditions/${collectionContract}/mint`);
    rewardToast("mint_asset");
    invalidatePortfolioCache(walletAddress);
    return result;
  };

  const resetAll = () => {
    action.reset();
    setMintedHref(null);
    form.reset();
    clearMedia();
    setFeaturePreview(null);
    setFeatureUri(null);
    setAssetType("single");
    setEditionCount("10");
    setCollectionMode("existing");
    setExistingCollectionId("");
    setExistingCollectionContract("");
    setNewCollectionName("");
    setNewCollectionSymbol("");
    setAutoSymbol("");
    setAutoCollectionName("");
    templateFieldsRef.current = [];
  };

  if (action.status === "success") {
    return (
      <section className="rounded-3xl bg-brand-blue/5 p-6 sm:p-10 text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold">Published</h2>
          <p className="text-sm text-muted-foreground">Your work is live onchain. It&apos;ll appear in your portfolio shortly.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={resetAll}>Publish another</Button>
          {mintedHref && (
            <Button asChild className="bg-brand-blue hover:brightness-110">
              <Link href={mintedHref}>View <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
            </Button>
          )}
        </div>
      </section>
    );
  }

  const KindIcon = MEDIA_KIND_ICON[mediaKind];

  return (
    <section className="rounded-3xl bg-brand-blue/5 p-6 sm:p-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Publish your work</h2>
          <p className="text-sm text-muted-foreground">
            Drop a photo, song, video, or document. Everything else can wait.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload media"
          onClick={() => !mediaUploading && mediaInputRef.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !mediaUploading) { e.preventDefault(); mediaInputRef.current?.click(); } }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleMediaSelect(f); }}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-card h-48 sm:h-56 cursor-pointer overflow-hidden transition-colors",
            mediaPreview ? "" : "hover:bg-card/70"
          )}
        >
          {mediaPreview ? (
            <>
              {mediaKind === "image" ? (
                <Image src={mediaPreview} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <KindIcon className="h-8 w-8" />
                  <p className="text-sm font-medium text-foreground truncate max-w-[80%]">{mediaFile?.name}</p>
                </div>
              )}
              {!mediaUploading && (
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={(e) => { e.stopPropagation(); clearMedia(); }}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {mediaUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drop a file, or click to upload</p>
              <p className="text-xs text-muted-foreground">Image, audio, video, or document · max 25 MB</p>
            </>
          )}
          <input ref={mediaInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaSelect(f); }} />
        </div>
        {mediaPreview && !mediaUploading && !mediaUri && (
          <p className="text-xs text-destructive text-center -mt-2">Upload failed — remove the file and try again.</p>
        )}

        {mediaUri && (
          <>
            <Input
              value={name}
              onChange={(e) => form.setValue("name", e.target.value)}
              placeholder="Name your work"
              className="h-12 text-base font-medium"
            />
            <Textarea
              value={form.watch("description")}
              onChange={(e) => form.setValue("description", e.target.value)}
              placeholder="Describe your work (optional)"
              rows={2}
            />
            <Input
              value={form.watch("external_url")}
              onChange={(e) => form.setValue("external_url", e.target.value)}
              placeholder="https://yourwebsite.com (optional)"
            />

            {mediaKind !== "image" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Feature image *</p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !featureUploading && featureInputRef.current?.click()}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !featureUploading) { e.preventDefault(); featureInputRef.current?.click(); } }}
                  className="relative h-24 w-24 rounded-xl bg-card flex items-center justify-center overflow-hidden cursor-pointer hover:bg-card/70 transition-colors"
                >
                  {featurePreview ? (
                    <Image src={featurePreview} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                  {featureUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <input ref={featureInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFeatureSelect(f); }} />
                </div>
                <p className="text-xs text-muted-foreground">Cover art shown wherever the work is previewed.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAssetType("single")}
                className={cn("flex items-start gap-3 rounded-2xl p-4 text-left transition-all",
                  assetType === "single" ? "bg-brand-blue text-white" : "bg-card hover:bg-card/70")}
              >
                <SingleIcon className={cn("h-5 w-5 shrink-0 mt-0.5", assetType === "single" ? "text-white" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-semibold">One copy</span>
                  <span className={cn("block text-xs mt-0.5", assetType === "single" ? "text-white/80" : "text-muted-foreground")}>Minted once</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAssetType("editions")}
                className={cn("flex items-start gap-3 rounded-2xl p-4 text-left transition-all",
                  assetType === "editions" ? "bg-brand-blue text-white" : "bg-card hover:bg-card/70")}
              >
                <Layers className={cn("h-5 w-5 shrink-0 mt-0.5", assetType === "editions" ? "text-white" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-semibold">Numbered copies</span>
                  <span className={cn("block text-xs mt-0.5", assetType === "editions" ? "text-white/80" : "text-muted-foreground")}>Several editions</span>
                </span>
              </button>
            </div>

            {assetType === "editions" && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Number of copies</p>
                <Input
                  type="number"
                  min={1}
                  value={editionCount}
                  onChange={(e) => setEditionCount(e.target.value)}
                  className="max-w-[140px]"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectionMode("existing")}
                  className={cn("flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
                    collectionMode === "existing" ? "bg-foreground text-background" : "bg-card hover:bg-card/70")}
                >
                  Existing collection
                </button>
                <button
                  type="button"
                  onClick={() => setCollectionMode("new")}
                  className={cn("flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
                    collectionMode === "new" ? "bg-foreground text-background" : "bg-card hover:bg-card/70")}
                >
                  <Plus className="h-3.5 w-3.5 inline mr-1" />New collection
                </button>
              </div>

              {collectionMode === "existing" ? (
                <CollectionPicker
                  collections={assetType === "single" ? erc721Collections : erc1155Collections}
                  value={assetType === "single" ? existingCollectionId : existingCollectionContract}
                  onChange={assetType === "single" ? setExistingCollectionId : setExistingCollectionContract}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                  />
                  <Input
                    value={newCollectionSymbol}
                    onChange={(e) => setNewCollectionSymbol(e.target.value.toUpperCase())}
                    placeholder="SYMBOL"
                  />
                </div>
              )}
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                  Licensing terms
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <Select value={form.watch("licenseType")} onValueChange={handleLicenseChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Commercial use</p>
                  <ToggleGroup value={form.watch("commercialUse")} options={["Yes", "No"]} onChange={(v) => form.setValue("commercialUse", v as "Yes" | "No")} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Derivatives</p>
                  <ToggleGroup value={form.watch("derivatives")} options={DERIVATIVES_OPTIONS} onChange={(v) => form.setValue("derivatives", v as FormValues["derivatives"])} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Territory</p>
                  <Select value={form.watch("geographicScope")} onValueChange={(v) => form.setValue("geographicScope", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GEOGRAPHIC_SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">AI &amp; data mining</p>
                  <ToggleGroup value={form.watch("aiPolicy")} options={AI_POLICIES} onChange={(v) => form.setValue("aiPolicy", v as FormValues["aiPolicy"])} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Royalty % (0–50)</p>
                  <Input
                    type="number" min={0} max={50} step={0.5}
                    value={form.watch("royalty")}
                    onChange={(e) => form.setValue("royalty", parseFloat(e.target.value) || 0)}
                    className="max-w-[120px]"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={ipTypeOpen} onOpenChange={setIpTypeOpen}>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", ipTypeOpen && "rotate-180")} />
                  IP type &amp; metadata
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <Select value={ipType} onValueChange={(v) => setIpType(v as IPType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <IPTypeFields
                  ipType={ipType}
                  onChange={(fields) => { templateFieldsRef.current = fields; }}
                  uploadDocument={async (file) => {
                    const token = await secureToken();
                    if (!token) throw new Error("Secure your account first");
                    return uploadDocumentToIpfs(file, token);
                  }}
                />
              </CollapsibleContent>
            </Collapsible>

            {action.status === "error" && action.error && <p className="text-xs text-destructive">{action.error}</p>}

            <button
              type="button"
              disabled={!ready || busy || !hasWallet}
              onClick={form.handleSubmit(onSubmit)}
              className={cn(
                "flex items-center justify-center gap-1.5 w-full h-12 rounded-xl text-base font-semibold text-white transition-all",
                ready && !busy && hasWallet ? "bg-brand-blue hover:brightness-110 active:scale-[0.98]" : "bg-brand-blue/40 cursor-not-allowed"
              )}
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</> : <>Mint<ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              {hasWallet ? "Zero platform fees to mint." : "Secure your account to mint."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hash } from "starknet";
import { normalizeAddress, getService, buildAssetMetadata } from "@medialane/sdk";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import {
  ImagePlus, Music, Video, FileText, Loader2, Upload,
  Layers, ImagePlus as SingleIcon, CheckCircle2, ChevronDown, Boxes, Plus, Check,
  ShieldCheck, Tag, ArrowRightLeft, GitBranch, Eye,
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
import { MedialaneCollectionCard } from "@medialane/ui";
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
import { uploadMediaToIpfs } from "@/lib/upload-media";
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
const IP_MINTED_SELECTOR = hash.getSelectorFromName("IPMinted");

async function readMintedTokenId(txHash: string, contractAddress: string): Promise<string | null> {
  let receipt: { events?: { from_address?: string; keys?: string[] }[] } | null = null;
  for (let attempt = 0; attempt < 3 && !receipt; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
      const raw: unknown = await starknetProvider.getTransactionReceipt(txHash);
      receipt = raw as { events?: { from_address?: string; keys?: string[] }[] };
    } catch { /* retry */ }
  }
  const events = receipt?.events ?? [];
  const mintEvent = events.find((e) =>
    e.from_address && BigInt(e.from_address) === BigInt(contractAddress) &&
    e.keys?.[0] && BigInt(e.keys[0]) === BigInt(IP_MINTED_SELECTOR)
  );
  if (!mintEvent?.keys?.[1]) return null;
  const low = BigInt(mintEvent.keys[1] ?? 0);
  const high = BigInt(mintEvent.keys[2] ?? 0);
  return (low + (high << 128n)).toString();
}

type MediaKind = "image" | "audio" | "video" | "document";

const MEDIA_ROUTE_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif",
  "video/mp4", "video/webm", "video/ogg",
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/flac",
  "application/pdf",
]);
const DOCUMENT_SIGNED_URL_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
  "text/plain",
  "text/markdown",
]);
const MEDIA_MAX_BYTES = 100 * 1024 * 1024;
const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

function detectMediaKind(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return MEDIA_ROUTE_MIME_TYPES.has(mime) ? "image" : null;
  if (mime.startsWith("video/")) return MEDIA_ROUTE_MIME_TYPES.has(mime) ? "video" : null;
  if (mime.startsWith("audio/")) return MEDIA_ROUTE_MIME_TYPES.has(mime) ? "audio" : null;
  if (mime === "application/pdf" || DOCUMENT_SIGNED_URL_MIME_TYPES.has(mime)) return "document";
  return null;
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

  const [mintedAsset, setMintedAsset] = useState<{ contract: string; tokenId: string } | null>(null);

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
    const kind = detectMediaKind(file.type);
    if (!kind) {
      toast.error("Unsupported file type", {
        description: "Publish an image, audio, video (JPG/PNG/GIF/SVG/WebP, MP3/WAV/OGG/FLAC, MP4/WebM), or document (PDF, DOC, DOCX, ODT, RTF, TXT, MD).",
      });
      return;
    }
    const viaMediaRoute = MEDIA_ROUTE_MIME_TYPES.has(file.type);
    const maxBytes = viaMediaRoute ? MEDIA_MAX_BYTES : DOCUMENT_MAX_BYTES;
    if (file.size > maxBytes) {
      toast.error("File too large", { description: `Maximum size is ${maxBytes / (1024 * 1024)} MB.` });
      return;
    }
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
      const uri = viaMediaRoute ? await uploadMediaToIpfs(file, token) : await uploadDocumentToIpfs(file, token);
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

    const built = buildAssetMetadata({
      name: values.name,
      description: values.description || "",
      externalUrl: values.external_url || "",
      imageUri: image,
      creator: walletAddress,
      ipType,
      licenseType: values.licenseType,
      commercialUse: values.commercialUse,
      derivatives: values.derivatives,
      attribution: values.attribution,
      geographicScope: values.geographicScope,
      aiPolicy: values.aiPolicy,
      royalty: String(values.royalty),
      templateTraits: templateFieldsRef.current
        .filter(({ traitType, value }) => traitType.trim() && value.trim())
        .map(({ traitType, value }) => ({ traitType, value })),
    });
    const metadata: Record<string, unknown> = { ...built };
    if (animationUrl) metadata.animation_url = animationUrl;

    const siwsToken = await secureToken();
    if (!siwsToken) throw new Error("Secure your account first");
    const tokenUri = await pinLaunchpadMetadata(metadata, siwsToken);

    if (assetType === "single") {
      let collectionId = existingCollectionId;
      let contractAddress = erc721Collections.find((c) => c.collectionId === existingCollectionId)?.contractAddress ?? null;

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
        contractAddress = found.contractAddress ?? null;
      }

      const intentRes = await client.api.createMintIntent({
        owner: walletAddress,
        collectionId,
        recipient: walletAddress,
        tokenUri,
        royaltyBps: Math.round(values.royalty * 100),
      });
      // The mint call's own target is the actual on-chain destination — more reliable
      // than the collection object's contractAddress for reading the mint event back.
      if (!intentRes.data.requiresSignature) {
        const calls = intentRes.data.calls;
        contractAddress = calls[calls.length - 1]?.contractAddress ?? contractAddress;
      }
      const result = await executeIntent(signer, client, intentRes.data, { confirm: false });

      if (contractAddress) {
        const tokenId = await readMintedTokenId(result.txHash, contractAddress);
        if (tokenId) setMintedAsset({ contract: contractAddress, tokenId });
      }
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

    const tokenId = await readMintedTokenId(result.txHash, collectionContract);
    if (tokenId) setMintedAsset({ contract: collectionContract, tokenId });
    rewardToast("mint_asset");
    invalidatePortfolioCache(walletAddress);
    return result;
  };

  const resetAll = () => {
    action.reset();
    setMintedAsset(null);
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

  const KindIcon = MEDIA_KIND_ICON[mediaKind];
  const selectedExistingCollection = assetType === "single"
    ? erc721Collections.find((c) => c.collectionId === existingCollectionId)
    : erc1155Collections.find((c) => c.contractAddress === existingCollectionContract);
  const collectionLabel = mediaUri
    ? (collectionMode === "new"
      ? (newCollectionName || "New collection")
      : (selectedExistingCollection?.name || "IP Asset"))
    : undefined;

  if (action.status === "success") {
    return (
      <section className="rounded-2xl border border-border p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-6 items-start">
          <MedialaneCollectionCard
            image={mediaKind === "image" ? mediaPreview : featurePreview}
            name={name}
            collection={collectionLabel}
          />
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold">Published — live onchain</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {mintedAsset ? "Ready to share, sell, or remix." : "It'll appear in your portfolio shortly."}
              </p>
            </div>

            {mintedAsset && (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href={`/asset/STARKNET/${mintedAsset.contract}/${mintedAsset.tokenId}`}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  View asset
                </Link>
                <Link
                  href={`/asset/STARKNET/${mintedAsset.contract}/${mintedAsset.tokenId}?action=list`}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  List on marketplace
                </Link>
                <Link
                  href={`/asset/STARKNET/${mintedAsset.contract}/${mintedAsset.tokenId}?action=transfer`}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  Transfer
                </Link>
                <Link
                  href={`/create/remix/${mintedAsset.contract}/${mintedAsset.tokenId}`}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  Create a remix
                </Link>
              </div>
            )}

            <Button variant="outline" onClick={resetAll} className="w-full sm:w-auto">
              Publish another
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!mediaFile) {
    return (
      <section
        role="button"
        tabIndex={0}
        aria-label="Upload media"
        onClick={() => mediaInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mediaInputRef.current?.click(); } }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleMediaSelect(f); }}
        className="relative flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors text-center rounded-3xl border-[3px] border-dashed border-brand-blue/40 hover:border-brand-blue/70 hover:bg-brand-blue/[0.04] min-h-[20rem] sm:min-h-[24rem] p-6"
      >
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Drop or upload your media</h2>
          <p className="text-base text-muted-foreground max-w-sm mx-auto">
            Protect your creation and start earning from it worldwide.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full mt-1 bg-card"
          onClick={(e) => { e.stopPropagation(); mediaInputRef.current?.click(); }}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Browse files
        </Button>
        <p className="text-2xs text-muted-foreground/70">Images, audio, video, and PDFs up to 100 MB; other documents up to 20 MB</p>
        <input ref={mediaInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaSelect(f); }} />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-border p-3">
        <div className="relative h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
          {mediaKind === "image" && mediaPreview ? (
            <Image src={mediaPreview} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <KindIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {mediaUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{mediaFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {mediaUploading ? "Uploading…" : mediaUri ? "Uploaded" : "Upload failed"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => mediaInputRef.current?.click()}
          className="text-xs font-semibold text-brand-blue hover:underline shrink-0"
        >
          Change
        </button>
        <input ref={mediaInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaSelect(f); }} />
      </div>

      {mediaUri && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={name}
                onChange={(e) => form.setValue("name", e.target.value)}
                placeholder="My Creative Work"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.watch("description")}
                onChange={(e) => form.setValue("description", e.target.value)}
                placeholder="Describe your work, its story, and any context for buyers…"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">External link <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                value={form.watch("external_url")}
                onChange={(e) => form.setValue("external_url", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>

            {mediaKind !== "image" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Feature image *</label>
                <div className="flex items-center gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !featureUploading && featureInputRef.current?.click()}
                    onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !featureUploading) { e.preventDefault(); featureInputRef.current?.click(); } }}
                    className="relative h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {featurePreview ? (
                      <Image src={featurePreview} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                    {featureUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    <input ref={featureInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFeatureSelect(f); }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Cover art shown wherever the work is previewed. JPG, PNG, GIF, SVG or WebP.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAssetType("single")}
                  className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    assetType === "single" ? "border-brand-blue bg-brand-blue/5" : "border-border hover:bg-muted/40")}
                >
                  <SingleIcon className={cn("h-5 w-5 shrink-0 mt-0.5", assetType === "single" ? "text-brand-blue" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-semibold">One copy</span>
                    <span className="block text-xs mt-0.5 text-muted-foreground">Minted once</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType("editions")}
                  className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    assetType === "editions" ? "border-brand-blue bg-brand-blue/5" : "border-border hover:bg-muted/40")}
                >
                  <Layers className={cn("h-5 w-5 shrink-0 mt-0.5", assetType === "editions" ? "text-brand-blue" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-semibold">Numbered copies</span>
                    <span className="block text-xs mt-0.5 text-muted-foreground">Several editions</span>
                  </span>
                </button>
              </div>
            </div>

            {assetType === "editions" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of copies</label>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Boxes className="h-4 w-4" />
                  Collection *
                </label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCollectionMode("existing")}
                    className={cn("px-3 h-7 text-xs font-medium transition-colors",
                      collectionMode === "existing" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground")}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectionMode("new")}
                    className={cn("px-3 h-7 text-xs font-medium border-l border-border transition-colors flex items-center gap-1",
                      collectionMode === "new" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground")}
                  >
                    <Plus className="h-3 w-3" />New
                  </button>
                </div>
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
              <div className="rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Licensing Terms</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional · Berne Convention</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", advancedOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4 border-t border-border/60 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">License</label>
                      <Select value={form.watch("licenseType")} onValueChange={handleLicenseChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LICENSE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Commercial use</label>
                      <ToggleGroup value={form.watch("commercialUse")} options={["Yes", "No"]} onChange={(v) => form.setValue("commercialUse", v as "Yes" | "No")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Derivatives</label>
                      <ToggleGroup value={form.watch("derivatives")} options={DERIVATIVES_OPTIONS} onChange={(v) => form.setValue("derivatives", v as FormValues["derivatives"])} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Territory</label>
                      <Select value={form.watch("geographicScope")} onValueChange={(v) => form.setValue("geographicScope", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GEOGRAPHIC_SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">AI &amp; data mining</label>
                      <ToggleGroup value={form.watch("aiPolicy")} options={AI_POLICIES} onChange={(v) => form.setValue("aiPolicy", v as FormValues["aiPolicy"])} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Royalty % (0–50)</label>
                      <Input
                        type="number" min={0} max={50} step={0.5}
                        value={form.watch("royalty")}
                        onChange={(e) => form.setValue("royalty", parseFloat(e.target.value) || 0)}
                        className="max-w-[120px]"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible open={ipTypeOpen} onOpenChange={setIpTypeOpen}>
              <div className="rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors">
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">IP Type &amp; Metadata</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", ipTypeOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4 border-t border-border/60 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">IP Type</label>
                      <Select value={ipType} onValueChange={(v) => setIpType(v as IPType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {IP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <IPTypeFields
                      ipType={ipType}
                      onChange={(fields) => { templateFieldsRef.current = fields; }}
                      uploadDocument={async (file) => {
                        const token = await secureToken();
                        if (!token) throw new Error("Secure your account first");
                        return uploadDocumentToIpfs(file, token);
                      }}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {action.status === "error" && action.error && <p className="text-xs text-destructive">{action.error}</p>}

            <button
              type="button"
              disabled={!ready || busy || !hasWallet}
              onClick={form.handleSubmit(onSubmit)}
              className={cn(
                "w-full h-12 text-base font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue",
                (!ready || busy || !hasWallet) && "opacity-40 pointer-events-none"
              )}
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Minting…</> : assetType === "single" ? "Mint NFT" : "Mint Editions"}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              {hasWallet ? "Zero platform fees to mint." : "Secure your account to mint."}
            </p>
          </div>

          <div className="lg:sticky lg:top-20">
            <MedialaneCollectionCard
              image={mediaKind === "image" ? mediaPreview : featurePreview}
              name={name}
              collection={collectionLabel}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
            />
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { assetHref } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { WalletTransactionDialog } from "@/components/transaction/wallet-transaction-dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { normalizeAddress } from "@medialane/sdk";
import { readAssignedEditionId } from "@/lib/erc1155-edition";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { withSiwsAuth } from "@/lib/pinata-fetch";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { executeIntent } from "@/lib/wallet/intent-tx";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { MintEditionAside } from "@/components/claim/mint-edition-aside";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { EXPLORER_URL } from "@/lib/constants";
import type { MetadataField } from "@/components/create/ip-type-fields";
import { NftEditionsMintForm } from "../../nfteditions-mint-form";
import {
  nftEditionsMintSchema,
  type NftEditionsMintFormValues,
} from "../../nfteditions-mint-schema";

export default function MintIP1155Page() {
  const { contract: rawContract } = useParams<{ contract: string }>();
  const collectionAddress = normalizeAddress("STARKNET", rawContract ?? "");

  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();
  const action = useWalletWriteAction();
  const client = useMedialaneClient();

  const [pendingValues, setPendingValues] = useState<NftEditionsMintFormValues | null>(null);
  const [ownerCheck, setOwnerCheck] = useState<"loading" | "ok" | "denied">("loading");
  const [formError, setFormError] = useState<string | null>(null);

  const metadataFieldsRef = useRef<MetadataField[]>([]);
  const handleMetadataFields = useCallback((fields: MetadataField[]) => {
    metadataFieldsRef.current = fields;
  }, []);
  const [metadataResetKey, setMetadataResetKey] = useState(0);
  const [autoExternalUrl, setAutoExternalUrl] = useState("");

  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const {
    imagePreview,
    imageUri,
    imageUploading,
    uploadError,
    uploadSuccess,
    fileInputRef,
    handleImageSelect,
    clearImage,
  } = useLaunchpadImageUpload({
    successMessage: "Image uploaded to IPFS",
    failureMessage: "Image upload failed",
  });

  const form = useForm<NftEditionsMintFormValues>({
    resolver: zodResolver(nftEditionsMintSchema),
    defaultValues: {
      value: "1",
      recipient: "",
      name: "",
      description: "",
      external_url: "",
      ipType: "NFT",
      licenseType: "CC BY-SA",
      commercialUse: "Yes",
      derivatives: "Share-Alike",
      attribution: "Required",
      geographicScope: "Worldwide",
      aiPolicy: "Allowed",
      royalty: 0,
    },
  });

  useEffect(() => {
    if (walletAddress && !form.getValues("recipient")) {
      form.setValue("recipient", walletAddress);
    }
  }, [walletAddress, form]);

  useEffect(() => {
    if (!collectionAddress) return;
    const suggested = `https://medialane.io/collections/${collectionAddress}`;
    const current = form.getValues("external_url");
    if (!current || current === autoExternalUrl) {
      form.setValue("external_url", suggested, { shouldDirty: false });
      setAutoExternalUrl(suggested);
    }
  }, [autoExternalUrl, collectionAddress, form]);

  useEffect(() => {
    if (!walletAddress || !collectionAddress) return;
    client.api.getCollection(collectionAddress)
      .then(({ data }) => {
        const onChainOwner = data.owner ? normalizeAddress("STARKNET", data.owner) : null;
        setOwnerCheck(onChainOwner === normalizeAddress("STARKNET", walletAddress) ? "ok" : "denied");
      })
      .catch(() => setOwnerCheck("denied"));
  }, [client, walletAddress, collectionAddress]);

  const onSubmit = (values: NftEditionsMintFormValues) => {
    if (!imageUri) {
      setFormError("Upload an image before minting.");
      return;
    }
    setFormError(null);
    setPendingValues(values);
    setMintedTokenId(null);
    void action.run((signer) => handleUnlocked(values, signer));
  };

  const handleUnlocked = async (values: NftEditionsMintFormValues, signer: StarknetVenueSigner) => {
    if (!walletAddress || !imageUri) throw new Error("Account not ready. Please refresh and try again.");

    const siwsToken = getValidToken() ?? (await signIn());
    if (!siwsToken) throw new Error("Secure your account first");

    const metadataForm = new FormData();
    metadataForm.set("name", values.name);
    metadataForm.set("description", values.description ?? "");
    metadataForm.set("imageUri", imageUri);
    if (values.external_url) metadataForm.set("external_url", values.external_url);
    metadataForm.set("ipType", values.ipType);
    metadataForm.set("licenseType", values.licenseType);
    metadataForm.set("commercialUse", values.commercialUse);
    metadataForm.set("derivatives", values.derivatives);
    metadataForm.set("attribution", values.attribution);
    metadataForm.set("geographicScope", values.geographicScope);
    metadataForm.set("aiPolicy", values.aiPolicy);
    metadataForm.set("royalty", String(values.royalty));

    const seenTraits = new Set<string>();
    const appendTrait = (traitType: string, value: string) => {
      const cleanTrait = traitType.trim();
      const cleanValue = value.trim();
      const key = cleanTrait.toLowerCase();
      if (!cleanTrait || !cleanValue || seenTraits.has(key)) return;
      seenTraits.add(key);
      metadataForm.append(`tmpl_${cleanTrait}`, cleanValue);
    };

    metadataFieldsRef.current.forEach(({ traitType, value }) => appendTrait(traitType, value));
    appendTrait("Token Standard", "ERC-1155");
    appendTrait("Editions", values.value);
    appendTrait("Collection Contract", collectionAddress);

    const uploadRes = await fetch("/api/pinata", withSiwsAuth(siwsToken, { method: "POST", body: metadataForm }));
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || uploadData.error || !uploadData.uri) {
      throw new Error(uploadData.error ?? "Metadata upload failed");
    }
    const tokenUri: string = uploadData.uri;

    const intentRes = await client.api.createMintIntent({
      owner: walletAddress,
      recipient: values.recipient,
      collectionContract: collectionAddress,
      tokenUri,
      value: values.value,

      royaltyBps: 0,
    });

    const result = await executeIntent(signer, client, intentRes.data, { confirm: false });

    setMintedTokenId(await readAssignedEditionId(result.txHash, collectionAddress));
    if (walletAddress) invalidatePortfolioCache(walletAddress);
    rewardToast("mint_asset");
    return result;
  };

  const handleMintAnother = () => {
    action.reset();
    setPendingValues(null);
    metadataFieldsRef.current = [];
    setMetadataResetKey((key) => key + 1);
    setAutoExternalUrl("");
    setMintedTokenId(null);
    clearImage();
    form.reset({
      value: "1",
      recipient: walletAddress ?? "",
      name: "",
      description: "",
      external_url: "",
      ipType: "NFT",
      licenseType: "CC BY-SA",
      commercialUse: "Yes",
      derivatives: "Share-Alike",
      attribution: "Required",
      geographicScope: "Worldwide",
      aiPolicy: "Allowed",
      royalty: 0,
    });
  };

  if (!hasWallet) {
    return (
      <LaunchpadSignedOutState
        icon={Sparkles}
        iconClassName="text-brand-purple"
        title="Secure your account to create"
        description="Secure your account to mint tokens into a multi-editions collection."
      />
    );
  }

  if (ownerCheck === "denied") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">Not the owner</h1>
        <p className="text-muted-foreground">
          Only the collection owner can mint tokens. Connect the wallet that deployed this collection.
        </p>
        <Button asChild variant="outline">
          <Link href="/launchpad">Back to Launchpad</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <ClaimRouteShell
        icon={<Sparkles className="h-4 w-4 text-white" />}
        title="Mint an Edition"
        subtitle="Add a new piece to your collection — its details and authorship are saved permanently. Free to mint, and it's yours."
        headerAccessory={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 max-w-full">
            <span className="tabular-nums text-xs text-foreground/80 truncate">Collection: {collectionAddress}</span>
          </div>
        }
        aside={
          <>
            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name")}
              collection="Edition"
              serial={Number(form.watch("value")) > 1 ? `${form.watch("value")} editions` : undefined}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
              creatorHref={walletAddress ? `/account/${walletAddress}` : undefined}
            />
            <MintEditionAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <NftEditionsMintForm
              form={form}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              mintDisabled={imageUploading || action.status !== "idle"}
              fileInputRef={fileInputRef}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
              metadataResetKey={metadataResetKey}
              onMetadataFieldsChange={handleMetadataFields}
            />
            {uploadError && (
              <p className="text-xs text-destructive mt-1">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="text-xs text-emerald-500 mt-1">✓ {uploadSuccess}</p>
            )}
            {formError && (
              <p className="text-xs text-destructive mt-1">{formError}</p>
            )}
          </form>
        </Form>
      </ClaimRouteShell>

      <WalletTransactionDialog
        action={action}
        title="Mint an edition"
        processingLabel="Minting your edition…"
        firstStepLabel="Upload metadata"
        successTitle="Edition minted!"
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{pendingValues?.name || "Your token"}</span> is
          live onchain.
        </p>
        {imagePreview && (
          <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">

            <Image src={imagePreview} alt={pendingValues?.name ?? ""} fill className="object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleMintAnother}>
            Mint another
          </Button>
          {mintedTokenId && (
            <Button asChild className="flex-1 bg-brand-purple hover:brightness-110 text-white">
              <Link href={assetHref("STARKNET", collectionAddress, mintedTokenId)}>View asset</Link>
            </Button>
          )}
        </div>
        {mintedTokenId && (
          <a
            href={`${EXPLORER_URL}/nft/${collectionAddress}/${mintedTokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View on explorer
          </a>
        )}
      </WalletTransactionDialog>
    </>
  );
}

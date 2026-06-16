"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import {
  MintProgressDialog,
  type MintStep,
} from "@/components/marketplace/mint-progress-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { FadeIn } from "@/components/ui/motion-primitives";
import { normalizeAddress } from "@medialane/sdk";
import { Contract, num, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { readAssignedEditionId } from "@/lib/erc1155-edition";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { LaunchpadPageIntro } from "@/components/launchpad/launchpad-page-intro";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { EXPLORER_URL } from "@/lib/constants";
import { serializeByteArray, encodeU256 } from "@/lib/cairo-calldata";
import type { MetadataField } from "@/components/create/ip-type-fields";
import { NftEditionsMintConfirmDialog } from "../../nfteditions-mint-confirm-dialog";
import { NftEditionsMintForm } from "../../nfteditions-mint-form";
import {
  nftEditionsMintSchema,
  type NftEditionsMintFormValues,
} from "../../nfteditions-mint-schema";

export default function MintIP1155Page() {
  const { contract: rawContract } = useParams<{ contract: string }>();
  const collectionAddress = normalizeAddress("STARKNET", rawContract ?? "");

  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, status: txStatus, txHash } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<NftEditionsMintFormValues | null>(null);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const [ownerCheck, setOwnerCheck] = useState<"loading" | "ok" | "denied">("loading");
  const [formError, setFormError] = useState<string | null>(null);
  // Read only at submit time — keep in a ref so each keystroke in IPTypeFields
  // doesn't re-render this whole form (the cause of the visible flicker).
  const metadataFieldsRef = useRef<MetadataField[]>([]);
  const handleMetadataFields = useCallback((fields: MetadataField[]) => {
    metadataFieldsRef.current = fields;
  }, []);
  const [metadataResetKey, setMetadataResetKey] = useState(0);
  const [autoExternalUrl, setAutoExternalUrl] = useState("");
  // The on-chain-assigned edition id, read from the IPMinted event in the mint handler.
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
      aiPolicy: "Not Allowed",
      royalty: 0,
    },
  });

  // Pre-fill recipient with connected wallet
  useEffect(() => {
    if (walletAddress && !form.getValues("recipient")) {
      form.setValue("recipient", walletAddress);
    }
  }, [walletAddress, form]);

  // Pre-fill external URL with the collection page (the edition id is assigned
  // on-chain at mint, so it isn't known here).
  useEffect(() => {
    if (!collectionAddress) return;
    const suggested = `https://medialane.io/collections/${collectionAddress}`;
    const current = form.getValues("external_url");
    if (!current || current === autoExternalUrl) {
      form.setValue("external_url", suggested, { shouldDirty: false });
      setAutoExternalUrl(suggested);
    }
  }, [autoExternalUrl, collectionAddress, form]);

  // Verify the connected wallet is the collection owner before showing the form
  useEffect(() => {
    if (!walletAddress || !collectionAddress) return;
    const OWNER_ABI = [{
      type: "function", name: "owner",
      inputs: [], outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
      state_mutability: "view",
    }];
    const contract = new Contract(OWNER_ABI as unknown as Abi, collectionAddress, starknetProvider);
    (contract as unknown as { owner: () => Promise<unknown> }).owner()
      .then((raw: unknown) => {
        // starknet.js decodes a ContractAddress as a bigint; String(bigint) is
        // decimal, which normalizeAddress would mis-parse as hex. Convert first.
        const onChainOwner = normalizeAddress("STARKNET", "0x" + num.toBigInt(String(raw)).toString(16));
        setOwnerCheck(onChainOwner === normalizeAddress("STARKNET", walletAddress) ? "ok" : "denied");
      })
      .catch(() => setOwnerCheck("ok"));
  }, [walletAddress, collectionAddress]);

  const onSubmit = (values: NftEditionsMintFormValues) => {
    if (!imageUri) {
      setFormError("Upload an image before minting.");
      return;
    }
    setFormError(null);
    setPendingValues(values);
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress || !imageUri) return;

    setMintStep("uploading");
    setMintError(null);

    try {
      const metadataForm = new FormData();
      metadataForm.set("name", pendingValues.name);
      metadataForm.set("description", pendingValues.description ?? "");
      metadataForm.set("imageUri", imageUri);
      if (pendingValues.external_url) metadataForm.set("external_url", pendingValues.external_url);
      metadataForm.set("ipType", pendingValues.ipType);
      metadataForm.set("licenseType", pendingValues.licenseType);
      metadataForm.set("commercialUse", pendingValues.commercialUse);
      metadataForm.set("derivatives", pendingValues.derivatives);
      metadataForm.set("attribution", pendingValues.attribution);
      metadataForm.set("geographicScope", pendingValues.geographicScope);
      metadataForm.set("aiPolicy", pendingValues.aiPolicy);
      metadataForm.set("royalty", String(pendingValues.royalty));

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
      appendTrait("Editions", pendingValues.value);
      appendTrait("Collection Contract", collectionAddress);

      const uploadRes = await fetch("/api/pinata", { method: "POST", body: metadataForm });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error || !uploadData.uri) {
        throw new Error(uploadData.error ?? "Metadata upload failed");
      }
      const tokenUri: string = uploadData.uri;

      setMintStep("processing");

      const [valueLow, valueHigh] = encodeU256(BigInt(pendingValues.value));

      // The contract assigns the edition id on-chain (sequential from 1).
      const result = await executeTransaction({
        pin,
        calls: [{
          contractAddress: collectionAddress,
          entrypoint: "mint_edition",
          calldata: [
            pendingValues.recipient,
            valueLow, valueHigh,
            ...serializeByteArray(tokenUri),
          ],
        }],
      });

      if (result.status === "confirmed") {
        // Read the assigned id from the IPMinted event for the success/asset link.
        setMintedTokenId(await readAssignedEditionId(result.txHash, collectionAddress));
        if (walletAddress) invalidatePortfolioCache(walletAddress);
        setMintStep("success");
      } else {
        setMintError(result.revertReason ?? "Transaction reverted");
        setMintStep("error");
      }
    } catch (err) {
      setMintError(err instanceof Error ? err.message : "Failed to mint token");
      setMintStep("error");
    }
  };

  const handleMintAnother = () => {
    setMintStep("idle");
    setMintError(null);
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
      aiPolicy: "Not Allowed",
      royalty: 0,
    });
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Sparkles}
        iconClassName="text-violet-500"
        title="Sign in to create"
        description="Sign in to mint tokens into multi-editions collection."
      />
    );
  }

  // ── Ownership check ───────────────────────────────────────────────────────
  if (ownerCheck === "denied") {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
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

  // ── Mint form ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">
        <FadeIn>
          <LaunchpadPageIntro
            icon={Sparkles}
            badge="ERC-1155 · Mint"
            title="Mint digital asset"
            description="Mint a new token type into your ERC-1155 collection. The URI and authorship are recorded permanently on-chain at first mint."
          >
            <p className="text-xs text-muted-foreground font-mono break-all">
              Collection: {collectionAddress}
            </p>
          </LaunchpadPageIntro>
        </FadeIn>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <NftEditionsMintForm
              form={form}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              mintDisabled={imageUploading || mintStep !== "idle"}
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
      </div>

      <NftEditionsMintConfirmDialog
        open={pinOpen}
        imagePreview={imagePreview}
        assetName={form.getValues("name")}
        quantity={form.getValues("value")}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
      <MintProgressDialog
        open={mintStep !== "idle"}
        mintStep={mintStep}
        txStatus={txStatus}
        assetName={form.getValues("name")}
        imagePreview={imagePreview}
        txHash={txHash}
        error={mintError}
        onMintAnother={handleMintAnother}
        mintedTokenId={mintedTokenId ?? ""}
        assetHref={`/asset/${collectionAddress}/${mintedTokenId ?? ""}`}
        explorerAssetHref={`${EXPLORER_URL}/nft/${collectionAddress}/${mintedTokenId ?? ""}`}
      />
    </>
  );
}

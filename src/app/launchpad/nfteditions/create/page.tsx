"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import {
  CollectionProgressDialog,
  type CollectionStep,
} from "@/components/marketplace/collection-progress-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { normalizeAddress } from "@medialane/sdk";
import { hash, byteArray as starkByteArray } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { LaunchpadPageIntro } from "@/components/launchpad/launchpad-page-intro";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { NftEditionsCreateForm } from "../nfteditions-create-form";
import {
  nftEditionsCreateSchema,
  type NftEditionsCreateFormValues,
} from "../nfteditions-create-schema";

/** Serialize a JS string into Cairo ByteArray calldata felts. */
function serializeByteArray(str: string): string[] {
  const ba = starkByteArray.byteArrayFromString(str);
  return [
    ba.data.length.toString(),
    ...ba.data.map(String),
    String(ba.pending_word),
    ba.pending_word_len.toString(),
  ];
}
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

// v2 ERC-1155 factory — hardcoded to avoid stale SDK npm cache
const FACTORY = "0x006b2dc7ca7c4f466bb4575ba043d934310f052074f849caf853a86bcb819fd6" as `0x${string}`;
const COLLECTION_DEPLOYED_SELECTOR = hash.getSelectorFromName("CollectionDeployed");

export default function CreateIP1155CollectionPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, status: txStatus, txHash } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<NftEditionsCreateFormValues | null>(null);
  const [autoSymbol, setAutoSymbol] = useState("");

  const [collectionStep, setCollectionStep] = useState<CollectionStep>("idle");
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const {
    imageFile,
    imagePreview,
    imageUri,
    imageUploading,
    fileInputRef,
    handleImageSelect,
    clearImage,
  } = useLaunchpadImageUpload({
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"],
    successMessage: "Image uploaded to IPFS",
    failureMessage: "Image upload failed",
    invalidTypeTitle: "Unsupported format",
    invalidTypeDescription: "Please upload a JPG, PNG, GIF, SVG, or WebP image.",
  });

  const form = useForm<NftEditionsCreateFormValues>({
    resolver: zodResolver(nftEditionsCreateSchema),
    defaultValues: { name: "", symbol: "", description: "", external_link: "" },
  });
  const collectionName = form.watch("name");

  useEffect(() => {
    if (walletAddress && !form.getValues("external_link")) {
      form.setValue("external_link", `https://medialane.io/account/${walletAddress}`);
    }
  }, [walletAddress, form]);

  useEffect(() => {
    const suggestedSymbol = suggestLaunchpadSymbol(collectionName);
    if (!suggestedSymbol) return;

    const currentSymbol = form.getValues("symbol");
    if (!currentSymbol || currentSymbol === autoSymbol) {
      form.setValue("symbol", suggestedSymbol, { shouldDirty: false });
      setAutoSymbol(suggestedSymbol);
    }
  }, [autoSymbol, collectionName, form]);

  const handleReset = () => {
    setCollectionStep("idle");
    setCollectionError(null);
    setDeployedAddress(null);
    setPendingValues(null);
    setAutoSymbol("");
    form.reset();
    clearImage();
  };

  const onSubmit = (values: NftEditionsCreateFormValues) => {
    if (imageFile && !imageUri && !imageUploading) {
      toast.error("Image upload failed", { description: "Please re-upload your collection image." });
      return;
    }
    setPendingValues(values);
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    setCollectionError(null);
    setCollectionStep("processing");

    try {
      // 1. Pin metadata JSON to IPFS
      let collectionMetaUri: string | undefined;
      if (imageUri) {
        try {
          const uri = await pinLaunchpadMetadata({
            name: pendingValues.name,
            description: pendingValues.description || "",
            image: imageUri,
            external_link: pendingValues.external_link || "",
          });
          if (uri) collectionMetaUri = uri;
        } catch { /* non-fatal */ }
      }

      // 2. Execute deploy_collection on the factory.
      // starknet.js 6.x encodes ByteArray as felt252 shortstring via contract.populate(),
      // producing wrong calldata. Build it manually using byteArray.byteArrayFromString().
      // v2 factory signature: deploy_collection(name, symbol, base_uri)
      const result = await executeTransaction({
        pin,
        contractAddress: FACTORY,
        calls: [{
          contractAddress: FACTORY,
          entrypoint: "deploy_collection",
          calldata: [
            ...serializeByteArray(pendingValues.name),
            ...serializeByteArray(pendingValues.symbol),
            ...serializeByteArray(collectionMetaUri ?? ""),
          ],
        }],
      });

      if (result.status !== "confirmed") {
        throw new Error(result.revertReason ?? "Transaction reverted");
      }

      // 3. Extract deployed collection address from CollectionDeployed event.
      // Best-effort: if we can't parse the event the tx still succeeded — the
      // collection will appear in portfolio once the indexer processes the event.
      let addr: string | null = null;
      try {
        // waitForTransaction already confirmed the tx; getTransactionReceipt may
        // fail due to RPC rate-limits or proxy issues, so we retry once.
        let receipt: any = null;
        for (let attempt = 0; attempt < 2 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
            receipt = await starknetProvider.getTransactionReceipt(result.txHash);
          } catch { /* retry */ }
        }
        const events = receipt?.events ?? [];
        const deployEvent = events.find((e: any) =>
          e.keys?.[0] && BigInt(e.keys[0]) === BigInt(COLLECTION_DEPLOYED_SELECTOR)
        );
        if (deployEvent?.keys?.[1]) addr = normalizeAddress(deployEvent.keys[1]);
      } catch { /* non-fatal — tx confirmed, collection will appear in portfolio */ }

      // 4. Register with backend so it appears in portfolio immediately.
      // If addr is null (event parse failed), the indexer will pick it up on the
      // next block poll — no action needed and we still show success.
      if (addr) {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
          await fetch(`${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/collections/register`, {
            method: "POST",
            headers,
            body: JSON.stringify({ contractAddress: addr, startBlock: 0 }),
          });
        } catch { /* non-fatal */ }
      }

      setDeployedAddress(addr);
      setCollectionStep("success");
    } catch (err) {
      setCollectionError(err instanceof Error ? err.message : "Something went wrong");
      setCollectionStep("error");
    }
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Layers}
        iconClassName="text-violet-500"
        title="Sign in to create a collection"
        description="Deploy a multi-edition ERC-1155 IP collection on Starknet."
      />
    );
  }

  return (
    <>
      <CollectionProgressDialog
        open={collectionStep !== "idle"}
        collectionStep={collectionStep}
        txStatus={txStatus}
        collectionName={pendingValues?.name ?? ""}
        imagePreview={imagePreview}
        txHash={txHash}
        error={collectionError}
        onCreateAnother={handleReset}
        createAnotherLabel="Deploy another"
        firstStepLabel="Prepare metadata"
        mintHref={deployedAddress ? `/launchpad/nfteditions/${deployedAddress}/mint` : undefined}
        deployedAddress={deployedAddress}
      />

      <div className="container max-w-2xl mx-auto px-4 pt-14 pb-8 space-y-8">
        <LaunchpadPageIntro
          icon={Layers}
          badge="IP Collection · ERC-1155"
          title="Create IP Collection"
          description="Deploy a multi-edition ERC-1155 collection on Starknet. Gas is free."
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <NftEditionsCreateForm
              form={form}
              imageFile={imageFile}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              deployDisabled={collectionStep !== "idle" || imageUploading}
              fileInputRef={fileInputRef}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
            />
          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Deploy ERC-1155 collection"
        description="Enter your PIN to deploy your IP collection on Starknet."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}

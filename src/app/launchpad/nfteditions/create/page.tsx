"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import Link from "next/link";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { WalletTransactionDialog } from "@/components/transaction/wallet-transaction-dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { normalizeAddress } from "@medialane/sdk";
import { hash } from "starknet";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { executeIntent } from "@/lib/wallet/intent-tx";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { CreateEditionsAside } from "@/components/claim/create-editions-aside";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { NftEditionsCreateForm } from "../nfteditions-create-form";
import {
  nftEditionsCreateSchema,
  type NftEditionsCreateFormValues,
} from "../nfteditions-create-schema";

const API_BASE = "/api/proxy";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";

const COLLECTION_DEPLOYED_SELECTOR = hash.getSelectorFromName("CollectionDeployed");

export default function CreateIP1155CollectionPage() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();

  const action = useWalletWriteAction();
  const client = useMedialaneClient();
  const [pendingValues, setPendingValues] = useState<NftEditionsCreateFormValues | null>(null);
  const [autoSymbol, setAutoSymbol] = useState("");

  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const {
    imageFile,
    imagePreview,
    imageUri,
    imageUploading,
    uploadError,
    uploadSuccess,
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
    action.reset();
    setDeployedAddress(null);
    setPendingValues(null);
    setAutoSymbol("");
    form.reset();
    clearImage();
  };

  const onSubmit = (values: NftEditionsCreateFormValues) => {
    if (imageFile && !imageUri && !imageUploading) {
      return;
    }
    setPendingValues(values);

    void action.run((signer) => handleUnlocked(values, signer));
  };

  const handleUnlocked = async (pendingValues: NftEditionsCreateFormValues, signer: StarknetVenueSigner) => {
    if (!walletAddress) throw new Error("Account not ready. Please refresh and try again.");
    setDeployedAddress(null);

    let collectionMetaUri: string | undefined;
    if (imageUri) {
      const siwsToken = getValidToken() ?? (await signIn());
      if (!siwsToken) throw new Error("Secure your account first");
      collectionMetaUri = await pinLaunchpadMetadata({
        name: pendingValues.name,
        description: pendingValues.description || "",
        image: imageUri,
        external_link: pendingValues.external_link || "",
      }, siwsToken);
    }

      const intentRes = await client.api.createCollectionIntent({
        owner: walletAddress,
        name: pendingValues.name,
        symbol: pendingValues.symbol,
        baseUri: collectionMetaUri ?? "",
        service: "mip-erc1155",
      });
      const result = await executeIntent(signer, client, intentRes.data, { confirm: false });
      rewardToast("create_collection");

      let addr: string | null = null;
      try {

        type ReceiptEvent = { keys?: string[]; data?: string[] };
        type ReceiptShape = { events?: ReceiptEvent[] };
        let receipt: ReceiptShape | null = null;
        for (let attempt = 0; attempt < 2 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
            const raw: unknown = await starknetProvider.getTransactionReceipt(result.txHash);
            receipt = raw as ReceiptShape;
          } catch {  }
        }
        const events: ReceiptEvent[] = receipt?.events ?? [];
        const deployEvent = events.find((e) =>
          e.keys?.[0] && BigInt(e.keys[0]) === BigInt(COLLECTION_DEPLOYED_SELECTOR)
        );
        if (deployEvent?.keys?.[1]) addr = normalizeAddress("STARKNET", deployEvent.keys[1]);
      } catch {  }

      if (addr) {
        try {
          await fetch(`${API_BASE}/v1/collections/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contractAddress: addr,
              startBlock: 0,
              standard: "ERC1155",
              source: "MEDIALANE_ERC1155",
            }),
          });
        } catch {  }
      }

    if (walletAddress) invalidatePortfolioCache(walletAddress);
    setDeployedAddress(addr);
    return result;
  };

  if (!hasWallet) {
    return (
      <LaunchpadSignedOutState
        icon={Layers}
        iconClassName="text-brand-purple"
        title="Secure your account to create a collection"
        description="Deploy a multi-edition ERC-1155 IP collection onchain."
      />
    );
  }

  return (
    <>
      <WalletTransactionDialog
        action={action}
        title="Deploy ERC-1155 collection"
        processingLabel="Deploying collection…"
        firstStepLabel="Prepare metadata"
        successTitle="Collection deployed!"
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{pendingValues?.name || "Your collection"}</span> is
          live onchain. Mint editions into it.
        </p>
        {imagePreview && (
          <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">

            <Image src={imagePreview} alt={pendingValues?.name ?? ""} fill className="object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Deploy another
          </Button>
          {deployedAddress && (
            <Button asChild className="flex-1">
              <Link href={`/launchpad/nfteditions/${deployedAddress}/mint`}>Mint tokens</Link>
            </Button>
          )}
        </div>
      </WalletTransactionDialog>

      <ClaimRouteShell
        icon={<Layers className="h-4 w-4 text-white" />}
        title="Create an Edition Collection"
        subtitle="Create a collection where each piece can have multiple editions — free to publish, and it's yours."
        aside={
          <>
            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name")}
              collection={form.watch("symbol") || "Editions"}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
            />
            <CreateEditionsAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <NftEditionsCreateForm
              form={form}
              imageFile={imageFile}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              deployDisabled={action.status !== "idle" || imageUploading}
              fileInputRef={fileInputRef}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
            />
            {uploadError && (
              <p className="text-xs text-destructive mt-1">{uploadError}</p>
            )}

          </form>
        </Form>
      </ClaimRouteShell>
    </>
  );
}

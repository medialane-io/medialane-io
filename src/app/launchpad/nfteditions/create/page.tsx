"use client";

import { requireAccount, requireSignedIn } from "@/lib/account-gate";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";
import { Form } from "@medialane/ui/form";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { WalletTransactionDialog } from "@/components/transaction/wallet-transaction-dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useMedialaneClient, MedialaneCollectionCard } from "@medialane/ui";
import { executeIntent, deployedCollectionFromReceipt } from "@medialane/sdk/starknet";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { buildCollectionMetadata } from "@medialane/sdk";
import { useSession } from "@/hooks/use-session";
import { suggestLaunchpadSymbol } from "@medialane/ui/utils/launchpad-defaults";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { CreateEditionsAside } from "@/components/claim/create-editions-aside";
import { CreationSuccess } from "@medialane/ui";
import { RewardEarned } from "@/lib/reward-earned";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { NftEditionsCreateForm } from "../nfteditions-create-form";
import {
  nftEditionsCreateSchema,
  type NftEditionsCreateFormValues,
} from "../nfteditions-create-schema";

import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { collectionHref, profileHref } from "@/lib/routes";

export default function CreateIP1155CollectionPage() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { session } = useSession();

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
    fileInputRef,
    handleImageSelect,
    clearImage,
  } = useLaunchpadImageUpload({
    successMessage: "Image uploaded to IPFS",
    failureMessage: "Image upload failed",
  });

  const form = useForm<NftEditionsCreateFormValues>({
    resolver: zodResolver(nftEditionsCreateSchema),
    defaultValues: { name: "", symbol: "", description: "", external_link: "" },
  });

  useEffect(() => {
    if (walletAddress && !form.getValues("external_link")) {
      form.setValue("external_link", `https://www.medialane.io/account/${walletAddress}`);
    }
  }, [walletAddress, form]);
  const collectionName = form.watch("name");

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
    requireAccount(walletAddress);
    setDeployedAddress(null);

    requireSignedIn(session);
    const collectionMetaUri = await pinLaunchpadMetadata(
      buildCollectionMetadata({
        name: pendingValues.name,
        description: pendingValues.description,
        image: imageUri,
        externalLink: pendingValues.external_link,
        owner: walletAddress,
      }),
    );

      const intentRes = await client.api.intents.create("create-collection", {
        owner: walletAddress,
        name: pendingValues.name,
        symbol: pendingValues.symbol,
        baseUri: collectionMetaUri,
        service: "mip-erc1155",
      });
      const result = await executeIntent(signer, client, intentRes, { confirm: false });

      const addr = deployedCollectionFromReceipt(result.receipt, "mip-erc1155");

      if (addr) {
        await client.api.collections.register(addr).catch(() => {});
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
        successTitle="Your collection is live"
        successContent={
          <CreationSuccess
            name={pendingValues?.name || "Your collection"}
            image={imagePreview}
            caption="Your collection is live"
            primary={deployedAddress ? { href: `/launchpad/nfteditions/${deployedAddress}/mint`, label: "Mint tokens" } : undefined}
            secondary={deployedAddress ? { href: collectionHref("STARKNET", deployedAddress), label: "View collection" } : undefined}
            onAgain={handleReset}
            againLabel="Create another"
          >
            <RewardEarned actionType="create_collection" />
          </CreationSuccess>
        }
      />

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
              creatorHref={walletAddress ? profileHref({ address: walletAddress }) : undefined}
            />
            <CreateEditionsAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <NftEditionsCreateForm
              walletAddress={walletAddress}
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

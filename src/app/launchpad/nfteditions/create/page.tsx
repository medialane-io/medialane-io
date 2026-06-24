"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import Link from "next/link";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useWriteAction } from "@/hooks/use-write-action";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { normalizeAddress } from "@medialane/sdk";
import { hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { CreateEditionsAside } from "@/components/claim/create-editions-aside";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { NftEditionsCreateForm } from "../nfteditions-create-form";
import {
  nftEditionsCreateSchema,
  type NftEditionsCreateFormValues,
} from "../nfteditions-create-schema";
import { COLLECTION_1155_CONTRACT } from "@/lib/constants";

// Same-origin BFF proxy — injects MEDIALANE_API_KEY server-side.
const API_BASE = "/api/proxy";
import { invalidatePortfolioCache } from "@/lib/portfolio-cache";
import { serializeByteArray } from "@/lib/cairo-calldata";

const COLLECTION_DEPLOYED_SELECTOR = hash.getSelectorFromName("CollectionDeployed");

export default function CreateIP1155CollectionPage() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  // One primitive owns gate → unlock (passkey/PIN) → execute → result + self-heal.
  const action = useWriteAction();
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
    // Pass `values` through the closure (synchronous-passkey rule). action.run
    // gates signed-in/wallet and opens wallet setup itself when needed.
    void action.run((secret) => handleUnlocked(values, secret));
  };

  // The `prepare` body. `secret` is the wallet-unlock material (PIN or passkey
  // key). useWriteAction owns status/error/self-heal — return the tx result.
  const handleUnlocked = async (pendingValues: NftEditionsCreateFormValues, secret: string) => {
    if (!walletAddress) throw new Error("Wallet not ready. Please refresh and try again.");
    setDeployedAddress(null);

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
      // v2 factory signature: deploy_collection(name, symbol, base_uri)
      const result = await action.executeTransaction({
        pin: secret,
        calls: [{
          contractAddress: COLLECTION_1155_CONTRACT,
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
        // Receipt shape is a starknet.js union; we only touch `.events`, so a
        // narrow local type is enough.
        type ReceiptEvent = { keys?: string[]; data?: string[] };
        type ReceiptShape = { events?: ReceiptEvent[] };
        let receipt: ReceiptShape | null = null;
        for (let attempt = 0; attempt < 2 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
            const raw: unknown = await starknetProvider.getTransactionReceipt(result.txHash);
            receipt = raw as ReceiptShape;
          } catch { /* retry */ }
        }
        const events: ReceiptEvent[] = receipt?.events ?? [];
        const deployEvent = events.find((e) =>
          e.keys?.[0] && BigInt(e.keys[0]) === BigInt(COLLECTION_DEPLOYED_SELECTOR)
        );
        if (deployEvent?.keys?.[1]) addr = normalizeAddress("STARKNET", deployEvent.keys[1]);
      } catch { /* non-fatal — tx confirmed, collection will appear in portfolio */ }

      // 4. Register with backend so it appears in portfolio immediately.
      // If addr is null (event parse failed), the indexer will pick it up on the
      // next block poll — no action needed and we still show success.
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
        } catch { /* non-fatal */ }
      }

    if (walletAddress) invalidatePortfolioCache(walletAddress);
    setDeployedAddress(addr);
    return result;
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Layers}
        iconClassName="text-violet-500"
        title="Sign in to create a collection"
        description="Deploy a multi-edition ERC-1155 IP collection onchain."
      />
    );
  }

  return (
    <>
      <TransactionDialog
        action={action}
        title="Deploy ERC-1155 collection"
        processingLabel="Deploying collection…"
        firstStepLabel="Prepare metadata"
        successTitle="Collection deployed!"
        pinDescription="Enter your PIN to deploy your IP collection onchain."
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{pendingValues?.name || "Your collection"}</span> is
          live onchain. Mint editions into it.
        </p>
        {imagePreview && (
          <div className="h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt={pendingValues?.name ?? ""} className="h-full w-full object-cover" />
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
      </TransactionDialog>

      <ClaimRouteShell
        gated={false}
        icon={<Layers className="h-4 w-4 text-white" />}
        title="Create an Edition Collection"
        subtitle="Create a collection where each piece can have multiple editions — free to publish, and it's yours."
        aside={<CreateEditionsAside />}
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
            {/* Upload success is shown inline next to the image (create-form) —
                no page-bottom duplicate. */}
          </form>
        </Form>
      </ClaimRouteShell>

      <WalletSetupGate action={action} />
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
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
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { normalizeAddress } from "@medialane/sdk";
import { Contract, byteArray as starkByteArray } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { NftEditionsMintConfirmDialog } from "../../nfteditions-mint-confirm-dialog";
import { NftEditionsMintForm } from "../../nfteditions-mint-form";
import {
  nftEditionsMintSchema,
  type NftEditionsMintFormValues,
} from "../../nfteditions-mint-schema";

function serializeByteArray(str: string): string[] {
  const ba = starkByteArray.byteArrayFromString(str);
  return [
    ba.data.length.toString(),
    ...ba.data.map(String),
    String(ba.pending_word),
    ba.pending_word_len.toString(),
  ];
}

function encodeU256(n: bigint): [string, string] {
  return [
    (n & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString(),
    (n >> BigInt(128)).toString(),
  ];
}

export default function MintIP1155Page() {
  const { contract: rawContract } = useParams<{ contract: string }>();
  const collectionAddress = normalizeAddress(rawContract ?? "");

  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, status: txStatus, txHash } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<NftEditionsMintFormValues | null>(null);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const [ownerCheck, setOwnerCheck] = useState<"loading" | "ok" | "denied">("loading");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const form = useForm<NftEditionsMintFormValues>({
    resolver: zodResolver(nftEditionsMintSchema),
    defaultValues: {
      tokenId: "",
      value: "1",
      recipient: "",
      name: "",
      description: "",
    },
  });

  // Pre-fill recipient with connected wallet
  useEffect(() => {
    if (walletAddress && !form.getValues("recipient")) {
      form.setValue("recipient", walletAddress);
    }
  }, [walletAddress, form]);

  // Verify the connected wallet is the collection owner before showing the form
  useEffect(() => {
    if (!walletAddress || !collectionAddress) return;
    const OWNER_ABI = [{
      type: "function", name: "owner",
      inputs: [], outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
      state_mutability: "view",
    }];
    const contract = new Contract(OWNER_ABI as any, collectionAddress, starknetProvider);
    (contract as any).owner()
      .then((raw: unknown) => {
        const onChainOwner = normalizeAddress(String(raw));
        setOwnerCheck(onChainOwner === normalizeAddress(walletAddress) ? "ok" : "denied");
      })
      .catch(() => setOwnerCheck("ok"));
  }, [walletAddress, collectionAddress]);

  const handleImageSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setImagePreview(url);
    setImageUri(null);
    setImageUploading(true);
    try {
      const signedRes = await fetch("/api/pinata/signed-url", { method: "POST" });
      const { url: uploadUrl } = await signedRes.json();
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("network", "public");
      fd.append("name", file.name);
      const up = await fetch(uploadUrl, { method: "POST", body: fd });
      const { data } = await up.json();
      if (!data?.cid) throw new Error("No CID");
      setImageUri(`ipfs://${data.cid}`);
      toast.success("Image uploaded to IPFS");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = (values: NftEditionsMintFormValues) => {
    if (!imageUri) { toast.error("Upload an image first"); return; }
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingValues(values);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress || !imageUri) return;

    setMintStep("uploading");
    setMintError(null);

    // Build and pin metadata JSON
    let tokenUri = imageUri;
    try {
      const metadata: Record<string, unknown> = {
        name: pendingValues.name,
        image: imageUri,
      };
      if (pendingValues.description) metadata.description = pendingValues.description;
      const r = await fetch("/api/pinata/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const d = await r.json();
      if (d.uri) tokenUri = d.uri;
    } catch { /* fall back to raw image URI */ }

    setMintStep("processing");

    try {
      const [tokenIdLow, tokenIdHigh] = encodeU256(BigInt(pendingValues.tokenId));
      const [valueLow, valueHigh]     = encodeU256(BigInt(pendingValues.value));

      const result = await executeTransaction({
        pin,
        contractAddress: collectionAddress,
        calls: [{
          contractAddress: collectionAddress,
          entrypoint: "mint_item",
          calldata: [
            pendingValues.recipient,
            tokenIdLow, tokenIdHigh,
            valueLow, valueHigh,
            ...serializeByteArray(tokenUri),
          ],
        }],
      });

      if (result.status === "confirmed") {
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
    setImagePreview(null);
    setImageUri(null);
    form.reset({ tokenId: "", value: "1", recipient: walletAddress ?? "", name: "", description: "" });
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-violet-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to create</h1>
        <p className="text-muted-foreground">Sign in to mint tokens into multi-editions collection.</p>
      </div>
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
          <div className="space-y-1">
            <span className="pill-badge inline-flex gap-1.5">
              <Sparkles className="h-3 w-3" />
              ERC-1155 · Mint
            </span>
            <h1 className="text-3xl font-bold mt-3">Mint IP Asset</h1>
            <p className="text-muted-foreground text-sm">
              Mint a new token type into your ERC-1155 collection. The URI and authorship
              are recorded permanently on-chain at first mint.
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all">
              Collection: {collectionAddress}
            </p>
          </div>
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
              onClearImage={() => { setImagePreview(null); setImageUri(null); }}
            />
          </form>
        </Form>
      </div>

      <NftEditionsMintConfirmDialog
        open={pinOpen}
        imagePreview={imagePreview}
        assetName={form.getValues("name")}
        tokenId={form.getValues("tokenId")}
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
      />
    </>
  );
}

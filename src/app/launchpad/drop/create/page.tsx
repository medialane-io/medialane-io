"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Contract } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import {
  Package,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { getListableTokens } from "@medialane/sdk";
import { DropFactoryABI, DROP_FACTORY_CONTRACT } from "@/lib/launchpad-contracts";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import { DropCreateForm, type PaymentTokenOption } from "../drop-create-form";
import { dropCreateSchema, type DropCreateFormValues } from "../drop-create-schema";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { getDefaultDropSchedule, suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { LaunchpadSuccessState } from "@/components/launchpad/launchpad-success-state";

const PAYMENT_TOKENS = getListableTokens().map((t) => ({ symbol: t.symbol, address: t.address }));

const SUPPLY_PRESETS = [
  { label: "100",   value: 100 },
  { label: "500",   value: 500 },
  { label: "1 000", value: 1000 },
  { label: "5 000", value: 5000 },
];

export default function CreateDropPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [supplyPreset, setSupplyPreset] = useState<number | "custom">(1000);
  const [priceFree, setPriceFree] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PaymentTokenOption>(PAYMENT_TOKENS[0]);

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<DropCreateFormValues | null>(null);
  const [done, setDone] = useState(false);
  const [autoSymbol, setAutoSymbol] = useState("");
  const {
    imagePreview,
    imageUri,
    imageUploading,
    fileInputRef,
    handleImageSelect,
    clearImage,
  } = useLaunchpadImageUpload({
    successMessage: "Cover image uploaded",
    failureMessage: "Image upload failed",
  });

  const form = useForm<DropCreateFormValues>({
    resolver: zodResolver(dropCreateSchema),
    defaultValues: {
      name: "", symbol: "", supplyCustom: "",
      priceAmount: "", paymentToken: PAYMENT_TOKENS[0].address,
      startDate: "", startTime: "00:00",
      endDate: "", endTime: "23:59",
      maxPerWallet: "1",
    },
  });
  const collectionName = form.watch("name");

  useEffect(() => {
    const defaults = getDefaultDropSchedule();
    if (!form.getValues("startDate")) {
      form.setValue("startDate", defaults.startDate, { shouldDirty: false });
      form.setValue("startTime", defaults.startTime, { shouldDirty: false });
    }
    if (!form.getValues("endDate")) {
      form.setValue("endDate", defaults.endDate, { shouldDirty: false });
      form.setValue("endTime", defaults.endTime, { shouldDirty: false });
    }
  }, [form]);

  useEffect(() => {
    const suggestedSymbol = suggestLaunchpadSymbol(collectionName);
    if (!suggestedSymbol) return;

    const currentSymbol = form.getValues("symbol");
    if (!currentSymbol || currentSymbol === autoSymbol) {
      form.setValue("symbol", suggestedSymbol, { shouldDirty: false });
      setAutoSymbol(suggestedSymbol);
    }
  }, [autoSymbol, collectionName, form]);

  const resolvedSupply = (): bigint => {
    if (supplyPreset === "custom") {
      const v = parseInt(form.getValues("supplyCustom") ?? "0", 10);
      return BigInt(isNaN(v) || v <= 0 ? 0 : v);
    }
    return BigInt(supplyPreset);
  };

  const handleLaunchAnother = () => {
    const defaults = getDefaultDropSchedule();
    setDone(false);
    form.reset({
      name: "",
      symbol: "",
      supplyCustom: "",
      priceAmount: "",
      paymentToken: PAYMENT_TOKENS[0].address,
      startDate: defaults.startDate,
      startTime: defaults.startTime,
      endDate: defaults.endDate,
      endTime: defaults.endTime,
      maxPerWallet: "1",
    });
    clearImage();
    setPendingValues(null);
    setSupplyPreset(1000);
    setPriceFree(true);
    setIsPublic(true);
    setSelectedToken(PAYMENT_TOKENS[0]);
    setTokenDropdownOpen(false);
    setAutoSymbol("");
  };

  const persistDropConditions = async (
    ownerAddress: string,
    maxSupply: bigint,
    claimConditions: {
      start_time: number;
      end_time: number;
      price: bigint;
      payment_token: string;
      max_quantity_per_wallet: bigint;
    }
  ) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
    const base = MEDIALANE_BACKEND_URL.replace(/\/$/, "");

    // Poll up to 30s for the newly indexed collection (indexer ~6s cycle)
    let collectionAddress: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(
          `${base}/v1/collections?source=COLLECTION_DROP&owner=${ownerAddress}&sort=recent&limit=1`,
          { headers }
        );
        const json = await res.json();
        const latest = json?.data?.[0];
        if (latest?.contractAddress) {
          collectionAddress = latest.contractAddress;
          break;
        }
      } catch {
        // keep polling
      }
    }

    if (!collectionAddress) return;

    try {
      await fetch(`${base}/v1/drop/conditions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          collectionAddress,
          maxSupply: maxSupply.toString(),
          price: claimConditions.price.toString(),
          paymentToken: claimConditions.payment_token,
          startTime: claimConditions.start_time,
          endTime: claimConditions.end_time,
          maxPerWallet: claimConditions.max_quantity_per_wallet.toString(),
        }),
      });
    } catch {
      // Non-fatal
    }
  };

  const onSubmit = (values: DropCreateFormValues) => {
    if (resolvedSupply() <= 0n) { toast.error("Set a valid max supply"); return; }
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingValues(values);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    let baseUri = "";
    try {
      const metadata: Record<string, unknown> = {
        name: pendingValues.name,
        attributes: [
          { trait_type: "Visibility", value: isPublic ? "Public" : "Private" },
          { trait_type: "Supply Cap", value: resolvedSupply().toString() },
        ],
      };
      if (imageUri) metadata.image = imageUri;
      const uri = await pinLaunchpadMetadata(metadata);
      if (uri) baseUri = uri;
    } catch { /* non-fatal */ }

    const startTs = Math.floor(new Date(`${pendingValues.startDate}T${pendingValues.startTime}:00`).getTime() / 1000);
    const endTs   = Math.floor(new Date(`${pendingValues.endDate}T${pendingValues.endTime}:00`).getTime() / 1000);
    const priceWei = priceFree ? 0n : BigInt(Math.round(parseFloat(pendingValues.priceAmount ?? "0") * 1e18));
    const maxPerWallet = BigInt(parseInt(pendingValues.maxPerWallet ?? "1", 10));
    const maxSupply = resolvedSupply();

    const claimConditions = {
      start_time: startTs,
      end_time: endTs,
      price: priceWei,
      payment_token: priceFree ? "0x0" : selectedToken.address,
      max_quantity_per_wallet: maxPerWallet,
    };

    try {
      const factory = new Contract(DropFactoryABI as any, DROP_FACTORY_CONTRACT, starknetProvider);
      const call = factory.populate("create_drop", [
        pendingValues.name,
        pendingValues.symbol,
        baseUri,
        maxSupply,
        claimConditions,
      ]);

      const result = await executeTransaction({
        pin,
        contractAddress: DROP_FACTORY_CONTRACT,
        calls: [{
          contractAddress: DROP_FACTORY_CONTRACT,
          entrypoint: "create_drop",
          calldata: call.calldata as string[],
        }],
      });

      if (result.status === "confirmed") {
        // Fire-and-forget: persist conditions once collection is indexed (~6-30s)
        if (walletAddress) {
          persistDropConditions(walletAddress, maxSupply, claimConditions);
        }
        setDone(true);
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create drop");
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-orange-500/10"
        iconClassName="text-orange-500"
        actionClassName="bg-orange-600 hover:bg-orange-700 text-white"
        title="Drop launched"
        description="Your Collection Drop is live on Starknet. It will appear in the launchpad within a minute once indexed."
        backHref="/launchpad/drop"
        backLabel="Back to Drops"
        actionLabel="Launch another"
        onAction={handleLaunchAnother}
      />
    );
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Package className="h-10 w-10 text-orange-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to launch a drop</h1>
        <p className="text-muted-foreground">Sign in to deploy a limited-edition collection on Starknet.</p>
      </div>
    );
  }

  // ── Launch form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">

        <FadeIn>
          <div className="space-y-1">
            <span className="pill-badge inline-flex gap-1.5">
              <Package className="h-3 w-3" />
              Collection Drop
            </span>
            <h1 className="text-3xl font-bold mt-3">Launch Drop</h1>
            <p className="text-muted-foreground text-sm">
              Deploy a limited-edition ERC-721 collection with a fixed supply cap and mint window.
            </p>
          </div>
        </FadeIn>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <DropCreateForm
              form={form}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              isSubmitting={isSubmitting}
              priceFree={priceFree}
              isPublic={isPublic}
              supplyPreset={supplyPreset}
              supplyPresets={SUPPLY_PRESETS}
              paymentTokens={PAYMENT_TOKENS}
              selectedToken={selectedToken}
              tokenDropdownOpen={tokenDropdownOpen}
              fileInputRef={fileInputRef}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
              onSetPriceFree={setPriceFree}
              onSetSupplyPreset={(value) => {
                setSupplyPreset(value);
                if (value !== "custom") form.setValue("supplyCustom", "");
              }}
              onSetTokenDropdownOpen={setTokenDropdownOpen}
              onSelectToken={(token) => {
                setSelectedToken(token);
                form.setValue("paymentToken", token.address);
                setTokenDropdownOpen(false);
              }}
              onSetPublic={setIsPublic}
            />
          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Deploy drop collection"
        description="Enter your PIN to deploy your limited-edition collection on Starknet."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}

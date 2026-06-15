"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Package, CheckCircle2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { getListableTokens } from "@medialane/sdk";
import { DropFactoryABI, DROP_FACTORY_CONTRACT } from "@/lib/launchpad-contracts";
import { DropCreateForm, type PaymentTokenOption } from "../drop-create-form";
import { dropCreateSchema, type DropCreateFormValues } from "../drop-create-schema";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { getDefaultDropSchedule, suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { buildDropSet } from "@/lib/drop-build-set";
import { parseAddresses, batchAllowlistCalldata } from "../drop-allowlist";
import type { DraftItem } from "../drop-item-list";
import type { MetadataField } from "@/components/create/ip-type-fields";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { LaunchpadPageIntro } from "@/components/launchpad/launchpad-page-intro";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";

// API_BASE = same-origin BFF proxy that injects the server-only API key.
const API_BASE = "/api/proxy";

const PAYMENT_TOKENS = getListableTokens().map((t) => ({ symbol: t.symbol, address: t.address }));

export default function CreateDropPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [items, setItems] = useState<DraftItem[]>([]);
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [ipTypeOpen, setIpTypeOpen] = useState(false);
  const [priceFree, setPriceFree] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PaymentTokenOption>(PAYMENT_TOKENS[0]);

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<DropCreateFormValues | null>(null);
  const [done, setDone] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [autoSymbol, setAutoSymbol] = useState("");

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
    successMessage: "Cover image uploaded",
    failureMessage: "Image upload failed",
  });

  const form = useForm<DropCreateFormValues>({
    resolver: zodResolver(dropCreateSchema),
    defaultValues: {
      name: "", symbol: "",
      ipType: "NFT", licenseType: "CC BY-SA",
      commercialUse: "Yes", derivatives: "Share-Alike", attribution: "Required",
      geographicScope: "Worldwide", aiPolicy: "Not Allowed", royalty: 0,
      descriptionTemplate: "",
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

  useEffect(() => {
    if (priceFree) {
      form.setValue("priceAmount", "", { shouldDirty: false });
      setTokenDropdownOpen(false);
    }
  }, [form, priceFree]);

  // ── Item handlers ───────────────────────────────────────────────────────────
  const addItemFiles = (files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        name: "",
        description: "",
      })),
    ]);
  };
  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  };
  const editItem = (id: string, patch: Partial<Pick<DraftItem, "name" | "description">>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const resetItems = () => {
    setItems((prev) => {
      prev.forEach((it) => URL.revokeObjectURL(it.previewUrl));
      return [];
    });
  };

  const handleLaunchAnother = () => {
    const defaults = getDefaultDropSchedule();
    setDone(false);
    form.reset({
      name: "", symbol: "",
      ipType: "NFT", licenseType: "CC BY-SA",
      commercialUse: "Yes", derivatives: "Share-Alike", attribution: "Required",
      geographicScope: "Worldwide", aiPolicy: "Not Allowed", royalty: 0,
      descriptionTemplate: "",
      priceAmount: "", paymentToken: PAYMENT_TOKENS[0].address,
      startDate: defaults.startDate, startTime: defaults.startTime,
      endDate: defaults.endDate, endTime: defaults.endTime,
      maxPerWallet: "1",
    });
    clearImage();
    resetItems();
    setMetadataFields([]);
    setIpTypeOpen(false);
    setPendingValues(null);
    setPriceFree(true);
    setIsPublic(true);
    setSelectedToken(PAYMENT_TOKENS[0]);
    setTokenDropdownOpen(false);
    setAutoSymbol("");
  };

  // Poll the indexer for the freshly-deployed drop collection address (~6-30s cycle).
  const pollForDropAddress = async (ownerAddress: string): Promise<string | null> => {
    const headers = { "Content-Type": "application/json" };
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`${API_BASE}/v1/collections?service=drop-collection&owner=${ownerAddress}&sort=recent&limit=1`, { headers });
        const json = await res.json();
        const latest = json?.data?.[0];
        if (latest?.contractAddress) return latest.contractAddress as string;
      } catch { /* keep polling */ }
    }
    return null;
  };

  type ContractConditions = { start_time: number; end_time: number; price: bigint; payment_token: string; max_quantity_per_wallet: bigint };

  // Fire-and-forget: persist conditions once the collection is indexed (detail-page fallback).
  // TODO(M4): retire once ClaimConditionsUpdated indexing fully covers the detail page.
  const persistDropConditions = async (collectionAddress: string, maxSupply: bigint, c: ContractConditions) => {
    try {
      await fetch(`${API_BASE}/v1/drop/conditions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionAddress, maxSupply: maxSupply.toString(),
          price: c.price.toString(), paymentToken: c.payment_token,
          startTime: c.start_time, endTime: c.end_time,
          maxPerWallet: c.max_quantity_per_wallet.toString(),
        }),
      });
    } catch { /* non-fatal */ }
  };

  // Persist the pending public phase so the backend scheduled worker (M4) can fire
  // set_claim_conditions + set_allowlist_enabled at the public start time.
  const postPhaseSchedule = async (collectionAddress: string, publicC: ContractConditions, transitionAt: number) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/v1/drop/phase-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          collectionAddress,
          publicStartTime: publicC.start_time,
          publicEndTime: publicC.end_time,
          publicPrice: publicC.price.toString(),
          publicPaymentToken: publicC.payment_token,
          publicMaxPerWallet: publicC.max_quantity_per_wallet.toString(),
          transitionAt,
        }),
      });
    } catch { /* non-fatal — manual "Start public sale now" remains available */ }
  };

  const onSubmit = (values: DropCreateFormValues) => {
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    setPendingValues(values);
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    let baseUri = "";
    let maxSupply = 0n;
    try {
      const built = await buildDropSet(
        items.map((it, i) => ({
          imageFile: it.file,
          name: it.name || `${pendingValues.name} #${i + 1}`,
          description: it.description || pendingValues.descriptionTemplate || "",
        })),
        {
          ipType: pendingValues.ipType,
          licenseType: pendingValues.licenseType,
          commercialUse: pendingValues.commercialUse,
          derivatives: pendingValues.derivatives,
          attribution: pendingValues.attribution,
          geographicScope: pendingValues.geographicScope,
          aiPolicy: pendingValues.aiPolicy,
          royalty: pendingValues.royalty,
          templateTraits: metadataFields,
        },
        { name: pendingValues.name, description: pendingValues.descriptionTemplate, image: imageUri }
      );
      baseUri = built.baseUri;
      maxSupply = BigInt(built.count);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Failed to prepare drop metadata");
      return;
    }

    const toTs = (d: string, t: string) => Math.floor(new Date(`${d}T${t}:00`).getTime() / 1000);
    const toWei = (amount: string) => BigInt(Math.round(parseFloat(amount || "0") * 1e18));
    const maxPerWallet = BigInt(parseInt(pendingValues.maxPerWallet ?? "1", 10));
    const paymentToken = priceFree ? "0x0" : selectedToken.address;

    const publicConditions = {
      start_time: toTs(pendingValues.startDate, pendingValues.startTime),
      end_time: toTs(pendingValues.endDate, pendingValues.endTime),
      price: priceFree ? 0n : toWei(pendingValues.priceAmount ?? "0"),
      payment_token: paymentToken,
      max_quantity_per_wallet: maxPerWallet,
    };

    const presale = pendingValues.presaleEnabled;
    // Presale price falls back to the public price when left blank.
    const presaleConditions = presale
      ? {
          start_time: toTs(pendingValues.presaleStartDate, pendingValues.presaleStartTime),
          end_time: toTs(pendingValues.presaleEndDate, pendingValues.presaleEndTime),
          price: priceFree ? 0n : (pendingValues.presalePriceAmount ? toWei(pendingValues.presalePriceAmount) : publicConditions.price),
          payment_token: paymentToken,
          max_quantity_per_wallet: maxPerWallet,
        }
      : null;

    // Deploy with the presale conditions as the initial phase when a presale is set.
    const initialConditions = presaleConditions ?? publicConditions;
    const allowlist = presale ? parseAddresses(pendingValues.allowlistAddresses) : [];

    try {
      const factory = new Contract(DropFactoryABI as unknown as Abi, DROP_FACTORY_CONTRACT, starknetProvider);
      const call = factory.populate("create_drop", [
        pendingValues.name, pendingValues.symbol, baseUri, maxSupply, initialConditions,
      ]);

      const result = await executeTransaction({
        pin,
        calls: [{ contractAddress: DROP_FACTORY_CONTRACT, entrypoint: "create_drop", calldata: call.calldata as string[] }],
      });

      if (result.status !== "confirmed") {
        setTxError(result.revertReason ?? "Transaction reverted");
        return;
      }

      // Drop deployed. Find its address, then (if presale) enable + populate the allowlist
      // and schedule the public transition. All best-effort — the drop already exists onchain.
      const dropAddress = await pollForDropAddress(walletAddress);
      if (dropAddress) {
        if (presale && allowlist.length > 0) {
          try {
            await executeTransaction({
              pin,
              calls: [
                { contractAddress: dropAddress, entrypoint: "set_allowlist_enabled", calldata: ["1"] },
                { contractAddress: dropAddress, entrypoint: "batch_add_to_allowlist", calldata: batchAllowlistCalldata(allowlist) },
              ],
            });
          } catch { /* owner can finish allowlist setup in Manage */ }
          postPhaseSchedule(dropAddress, publicConditions, presaleConditions!.end_time);
        }
        persistDropConditions(dropAddress, maxSupply, initialConditions);
      }
      setDone(true);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Failed to create drop");
    }
  };

  // ── Error ───────────────────────────────────────────────────────────────────
  if (txError) {
    return (
      <LaunchpadErrorState description={txError} backHref="/launchpad/drop" backLabel="Back to Drops" onRetry={() => setTxError(null)} />
    );
  }

  // ── Processing ──────────────────────────────────────────────────────────────
  if (isSubmitting && !done && !txError) {
    return <LaunchpadProcessingState title="Creating your drop…" />;
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-orange-500/10"
        iconClassName="text-orange-500"
        actionClassName="bg-orange-600 hover:bg-orange-700 text-white"
        title="Drop launched"
        description="Your Collection Drop is live onchain. It will appear in the launchpad within a minute once indexed."
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
      <LaunchpadSignedOutState
        icon={Package}
        iconClassName="text-orange-500"
        title="Sign in to launch a drop"
        description="Sign in to deploy a limited-edition collection onchain."
      />
    );
  }

  // ── Launch form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">
        <FadeIn>
          <LaunchpadPageIntro
            icon={Package}
            badge="Collection Drop"
            title="Launch Drop"
            description="Deploy a limited set of unique, individually-licensed ERC-721 assets with a timed mint window."
            className="text-orange-600 dark:text-orange-400"
          />
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
              paymentTokens={PAYMENT_TOKENS}
              selectedToken={selectedToken}
              tokenDropdownOpen={tokenDropdownOpen}
              fileInputRef={fileInputRef}
              items={items}
              ipTypeOpen={ipTypeOpen}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
              onSetPriceFree={setPriceFree}
              onSetTokenDropdownOpen={setTokenDropdownOpen}
              onSelectToken={(token) => {
                setSelectedToken(token);
                form.setValue("paymentToken", token.address);
                setTokenDropdownOpen(false);
              }}
              onSetPublic={setIsPublic}
              onAddItemFiles={addItemFiles}
              onRemoveItem={removeItem}
              onEditItem={editItem}
              onMetadataFieldsChange={setMetadataFields}
              onSetIpTypeOpen={setIpTypeOpen}
            />
            {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
            {uploadSuccess && <p className="text-xs text-emerald-500 mt-1">✓ {uploadSuccess}</p>}
          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Deploy drop collection"
        description="Enter your PIN to deploy your limited-edition collection onchain."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}

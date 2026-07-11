"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import {
  Award,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { POPFactoryABI, STARKNET_POP_FACTORY_CONTRACT, type PopEventType } from "@/lib/launchpad-contracts";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { getDefaultClaimWindow, suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { PopCreateForm } from "../pop-create-form";
import { popCreateSchema, type PopCreateFormValues } from "../pop-create-schema";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { rewardToast } from "@/lib/reward-toast";
import { CreatePopAside } from "@/components/claim/create-pop-aside";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";

export default function CreatePOPPage() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const [eventType, setEventType] = useState<PopEventType>("Conference");
  const [isPublic, setIsPublic] = useState(false);
  const [pendingValues, setPendingValues] = useState<PopCreateFormValues | null>(null);
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
    successMessage: "Badge image uploaded",
    failureMessage: "Image upload failed",
  });

  const form = useForm<PopCreateFormValues>({
    resolver: zodResolver(popCreateSchema),
    defaultValues: { name: "", symbol: "", claimEndDate: "", claimEndTime: "23:59" },
  });
  const eventName = form.watch("name");

  useEffect(() => {
    const defaults = getDefaultClaimWindow();
    if (!form.getValues("claimEndDate")) {
      form.setValue("claimEndDate", defaults.claimEndDate, { shouldDirty: false });
      form.setValue("claimEndTime", defaults.claimEndTime, { shouldDirty: false });
    }
  }, [form]);

  useEffect(() => {
    const suggestedSymbol = suggestLaunchpadSymbol(eventName);
    if (!suggestedSymbol) return;

    const currentSymbol = form.getValues("symbol");
    if (!currentSymbol || currentSymbol === autoSymbol) {
      form.setValue("symbol", suggestedSymbol, { shouldDirty: false });
      setAutoSymbol(suggestedSymbol);
    }
  }, [autoSymbol, eventName, form]);

  const handleCreateAnother = () => {
    const defaults = getDefaultClaimWindow();
    action.reset();
    form.reset({
      name: "",
      symbol: "",
      claimEndDate: defaults.claimEndDate,
      claimEndTime: defaults.claimEndTime,
    });
    clearImage();
    setPendingValues(null);
    setEventType("Conference");
    setIsPublic(false);
    setAutoSymbol("");
  };

  const onSubmit = (values: PopCreateFormValues) => {
    if (!STARKNET_POP_FACTORY_CONTRACT) {
      toast.error("POP Factory contract not configured");
      return;
    }
    setPendingValues(values);
    // Pass `values` through the closure — the passkey path runs synchronously,
    // before a same-tick setState settles. action.run gates wallet + unlock.
    void action.run((secret) => handleUnlocked(values, secret));
  };

  // `secret` is the wallet-unlock material — a typed PIN or the passkey key.
  // `pendingValues` (param) shadows the display-only state.
  const handleUnlocked = async (pendingValues: PopCreateFormValues, secret: string) => {
    if (!walletAddress) throw new Error("Wallet not ready. Please refresh and try again.");

    let baseUri = "";
    try {
      const metadata: Record<string, unknown> = {
        name: pendingValues.name,
        attributes: [
          { trait_type: "Visibility", value: isPublic ? "Public" : "Private" },
          { trait_type: "Event Type", value: eventType },
        ],
      };
      if (imageUri) metadata.image = imageUri;
      const uri = await pinLaunchpadMetadata(metadata);
      if (uri) baseUri = uri;
    } catch { /* non-fatal */ }

    const claimEndTimestamp = Math.floor(
      new Date(`${pendingValues.claimEndDate}T${pendingValues.claimEndTime}:00`).getTime() / 1000
    );

    const factory = new Contract(POPFactoryABI as unknown as Abi, STARKNET_POP_FACTORY_CONTRACT, starknetProvider);
    const call = factory.populate("create_collection", [
      pendingValues.name,
      pendingValues.symbol,
      baseUri,
      claimEndTimestamp,
      { [eventType]: {} },
    ]);

    // action owns status/error — return the result, throw on real failure.
    const result = await action.executeTransaction({
      pin: secret,
      calls: [{
        contractAddress: STARKNET_POP_FACTORY_CONTRACT,
        entrypoint: "create_collection",
        calldata: call.calldata as string[],
      }],
    });
    if (result.status === "confirmed") rewardToast("launch_launchpad");
    return result;
  };

  // ── Error ──────────────────────────────────────────────────────────────────
  if (action.status === "error") {
    return (
      <LaunchpadErrorState
        description={action.error ?? "Failed to create event"}
        backHref="/launchpad/pop"
        backLabel="Back to POP launchpad"
        onRetry={action.reset}
      />
    );
  }

  // ── Processing ─────────────────────────────────────────────────────────────
  // Full-page feedback while the on-chain tx is pending. Without this, the
  // user sees the form with a disabled button and may think nothing is
  // happening — they could navigate away mid-tx.
  if (busy) {
    return <LaunchpadProcessingState title="Creating your POP event…" />;
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (action.status === "success") {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-green-500/10"
        iconClassName="text-green-500"
        actionClassName="bg-green-600 hover:bg-green-700 text-white"
        title="Event created"
        description="Your POP credential collection is live onchain. It will appear in the launchpad within a minute once indexed."
        backHref="/launchpad/pop"
        backLabel="Back to POP launchpad"
        actionLabel="Create another"
        onAction={handleCreateAnother}
      />
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Award}
        iconClassName="text-green-500"
        title="Sign in to create a POP event"
        description="Sign in to deploy a credential collection onchain."
      />
    );
  }

  // ── Create form ────────────────────────────────────────────────────────────
  return (
    <>
      <ClaimRouteShell
        gated={false}
        icon={<Award className="h-4 w-4 text-white" />}
        title="Create a POP Event"
        subtitle="Give attendees a collectible badge that proves they were part of your event — free to publish."
        aside={
          <>
            <MedialaneCollectionCard
              image={imagePreview}
              name={form.watch("name")}
              collection={form.watch("symbol") || "POP Event"}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
            />
            <CreatePopAside />
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <PopCreateForm
              form={form}
              eventType={eventType}
              isPublic={isPublic}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              isSubmitting={busy}
              fileInputRef={fileInputRef}
              onSetEventType={setEventType}
              onSetPublic={setIsPublic}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
            />
            {uploadError && (
              <p className="text-xs text-destructive mt-1">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="text-xs text-emerald-500 mt-1">✓ {uploadSuccess}</p>
            )}
          </form>
        </Form>
      </ClaimRouteShell>

      <PinDialog {...action.pinDialogProps}
        title="Deploy POP collection"
        description="Enter your PIN to deploy your event credential collection onchain." />
      <WalletSetupGate action={action} />
    </>
  );
}

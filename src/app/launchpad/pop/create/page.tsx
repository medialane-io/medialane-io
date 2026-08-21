"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Award,
  CheckCircle2,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { type PopEventType } from "@/lib/launchpad-contracts";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { executeIntent } from "@/lib/wallet/intent-tx";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { useSiwsToken } from "@/hooks/use-siws-token";
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
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();
  const action = useWalletWriteAction();
  const client = useMedialaneClient();
  const busy = action.status === "processing" || action.status === "confirming";

  const [eventType, setEventType] = useState<PopEventType>("Conference");
  const [isPublic, setIsPublic] = useState(false);
  const [, setPendingValues] = useState<PopCreateFormValues | null>(null);
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
    setPendingValues(values);
    void action.run((signer) => handleUnlocked(values, signer));
  };

  const handleUnlocked = async (
    pendingValues: PopCreateFormValues,
    signer: StarknetVenueSigner,
  ) => {
    if (!walletAddress) throw new Error("Account not ready. Please refresh and try again.");

    const metadata: Record<string, unknown> = {
      name: pendingValues.name,
      attributes: [
        { trait_type: "Visibility", value: isPublic ? "Public" : "Private" },
        { trait_type: "Event Type", value: eventType },
      ],
    };
    if (imageUri) metadata.image = imageUri;
    const siwsToken = getValidToken() ?? (await signIn());
    if (!siwsToken) throw new Error("Secure your account first");
    const baseUri = await pinLaunchpadMetadata(metadata, siwsToken);

    const claimEndTimestamp = Math.floor(
      new Date(`${pendingValues.claimEndDate}T${pendingValues.claimEndTime}:00`).getTime() / 1000
    );

    const intentRes = await client.api.createCollectionIntent({
      owner: walletAddress,
      name: pendingValues.name,
      symbol: pendingValues.symbol,
      baseUri,
      service: "pop-protocol",
      claimEndTimestamp,
      eventType,
    });

    const result = await executeIntent(signer, client, intentRes.data, { confirm: false });
    rewardToast("launch_launchpad");
    return result;
  };

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

  if (busy) {
    return <LaunchpadProcessingState title="Creating your POP event…" />;
  }

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

  if (!hasWallet) {
    return (
      <LaunchpadSignedOutState
        icon={Award}
        iconClassName="text-green-500"
        title="Secure your account to create a POP event"
        description="Secure your account to deploy a credential collection onchain."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
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
              creatorHref={walletAddress ? `/account/${walletAddress}` : undefined}
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
    </>
  );
}

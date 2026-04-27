"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Contract } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import {
  Award,
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
import { POPFactoryABI, POP_FACTORY_CONTRACT, type PopEventType } from "@/lib/launchpad-contracts";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { getDefaultClaimWindow, suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { PopCreateForm } from "../pop-create-form";
import { popCreateSchema, type PopCreateFormValues } from "../pop-create-schema";
import { LaunchpadSuccessState } from "@/components/launchpad/launchpad-success-state";
import { LaunchpadPageIntro } from "@/components/launchpad/launchpad-page-intro";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";

export default function CreatePOPPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [eventType, setEventType] = useState<PopEventType>("Conference");
  const [isPublic, setIsPublic] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PopCreateFormValues | null>(null);
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
    setDone(false);
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
    if (!POP_FACTORY_CONTRACT) {
      toast.error("POP Factory contract not configured");
      return;
    }
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

    try {
      const factory = new Contract(POPFactoryABI as any, POP_FACTORY_CONTRACT, starknetProvider);
      const call = factory.populate("create_collection", [
        pendingValues.name,
        pendingValues.symbol,
        baseUri,
        claimEndTimestamp,
        { [eventType]: {} },
      ]);

      const result = await executeTransaction({
        pin,
        contractAddress: POP_FACTORY_CONTRACT,
        calls: [{
          contractAddress: POP_FACTORY_CONTRACT,
          entrypoint: "create_collection",
          calldata: call.calldata as string[],
        }],
      });

      if (result.status === "confirmed") {
        setDone(true);
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  // ── Success ────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-green-500/10"
        iconClassName="text-green-500"
        actionClassName="bg-green-600 hover:bg-green-700 text-white"
        title="Event created"
        description="Your POP credential collection is live on Starknet. It will appear in the launchpad within a minute once indexed."
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
        description="Sign in to deploy a credential collection on Starknet."
      />
    );
  }

  // ── Create form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">

        <FadeIn>
          <LaunchpadPageIntro
            icon={Award}
            badge="Proof of Participation"
            title="Create Event"
            description="Deploy a soulbound credential collection for your event or program."
            className="text-green-600 dark:text-green-400"
          />
        </FadeIn>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <PopCreateForm
              form={form}
              eventType={eventType}
              isPublic={isPublic}
              imagePreview={imagePreview}
              imageUri={imageUri}
              imageUploading={imageUploading}
              isSubmitting={isSubmitting}
              fileInputRef={fileInputRef}
              onSetEventType={setEventType}
              onSetPublic={setIsPublic}
              onImageSelect={handleImageSelect}
              onClearImage={clearImage}
            />
          </form>
        </Form>
      </div>

      <PinDialog open={pinOpen} onSubmit={handlePin} onCancel={() => setPinOpen(false)}
        title="Deploy POP collection"
        description="Enter your PIN to deploy your event credential collection on Starknet." />
      <WalletSetupDialog open={walletSetupOpen} onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }} />
    </>
  );
}

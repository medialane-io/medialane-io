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
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Event created</h1>
          <p className="text-muted-foreground">
            Your POP credential collection is live on Starknet. It will appear in the launchpad within a minute once indexed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/launchpad/pop">Back to POP launchpad</Link>
          </Button>
          <Button
            onClick={() => { setDone(false); form.reset(); clearImage(); setEventType("Conference"); }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Create another
          </Button>
        </div>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Award className="h-10 w-10 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to create a POP event</h1>
        <p className="text-muted-foreground">Sign in to deploy a credential collection on Starknet.</p>
      </div>
    );
  }

  // ── Create form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">

        <FadeIn>
          <div className="space-y-1">
            <span className="pill-badge inline-flex gap-1.5">
              <Award className="h-3 w-3" />
              Proof of Participation
            </span>
            <h1 className="text-3xl font-bold mt-3">Create Event</h1>
            <p className="text-muted-foreground text-sm">
              Deploy a soulbound credential collection for your event or program.
            </p>
          </div>
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

"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { Contract } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import {
  Award, Mic2, Code2, Wrench, Zap, Users, BookOpen, Star,
  Loader2, ImagePlus, X, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { POPFactoryABI, POP_FACTORY_CONTRACT, type PopEventType } from "@/lib/launchpad-contracts";
import { cn } from "@/lib/utils";

const EVENT_TYPES: { value: PopEventType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "Conference",  label: "Conference",  icon: Mic2,     description: "Talks & panels"     },
  { value: "Bootcamp",    label: "Bootcamp",    icon: Code2,    description: "Intensive training"  },
  { value: "Workshop",    label: "Workshop",    icon: Wrench,   description: "Hands-on learning"   },
  { value: "Hackathon",   label: "Hackathon",   icon: Zap,      description: "Build & compete"     },
  { value: "Meetup",      label: "Meetup",      icon: Users,    description: "Community gathering" },
  { value: "Course",      label: "Course",      icon: BookOpen, description: "Structured learning" },
  { value: "Other",       label: "Other",       icon: Star,     description: "Something unique"    },
];

const schema = z.object({
  name:         z.string().min(1, "Event name required").max(100),
  symbol:       z.string().min(1, "Symbol required").max(10).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  claimEndDate: z.string().min(1, "Claim end date required"),
  claimEndTime: z.string().default("23:59"),
});

type FormValues = z.infer<typeof schema>;

export default function CreatePOPPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [eventType, setEventType] = useState<PopEventType>("Conference");
  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [done, setDone] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "", claimEndDate: "", claimEndTime: "23:59" },
  });

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
      toast.success("Badge image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
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
    if (imageUri) {
      try {
        const r = await fetch("/api/pinata/json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: pendingValues.name, image: imageUri }),
        });
        const d = await r.json();
        if (d.uri) baseUri = d.uri;
      } catch { /* non-fatal */ }
    }

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
            onClick={() => { setDone(false); form.reset(); setImagePreview(null); setImageUri(null); setEventType("Conference"); }}
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

        {/* Event type selector */}
        <FadeIn delay={0.06}>
          <div className="space-y-3">
            <p className="text-sm font-medium">What kind of event is this?</p>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map(({ value, label, icon: Icon }) => {
                const selected = eventType === value;
                return (
                  <button key={value} type="button" onClick={() => setEventType(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                      selected
                        ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                        : "border-border bg-muted/30 hover:border-green-500/40 hover:bg-green-500/5 text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", selected && "text-green-500")} />
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {EVENT_TYPES.find((e) => e.value === eventType)?.description}
            </p>
          </div>
        </FadeIn>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Badge image */}
            <FadeIn delay={0.1}>
              <div className="space-y-2">
                <p className="text-sm font-medium">Badge image <span className="text-muted-foreground font-normal">(optional)</span></p>
                <div className="flex items-center gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !imageUploading && fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                    className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-green-500/50 transition-colors"
                  >
                    {imagePreview
                      ? <Image src={imagePreview} alt="Badge" fill className="object-cover" />
                      : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                    {imageUploading && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                    <Button type="button" variant="outline" size="sm" disabled={imageUploading}
                      onClick={() => fileInputRef.current?.click()}>
                      {imageUploading
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                        : imagePreview ? "Change" : "Upload badge art"}
                    </Button>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImagePreview(null); setImageUri(null); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {imageUri
                        ? <span className="text-green-500">✓ Uploaded to IPFS</span>
                        : "JPG, PNG, SVG or WebP · max 10 MB"}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Name */}
            <FadeIn delay={0.12}>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Event name *</FormLabel>
                  <FormControl><Input placeholder="Starknet Hackathon 2026" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* Symbol */}
            <FadeIn delay={0.14}>
              <FormField control={form.control} name="symbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input placeholder="SKHACK" {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="max-w-[160px]" />
                  </FormControl>
                  <FormDescription>Short ticker shown in wallets.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            {/* Claim window */}
            <FadeIn delay={0.16}>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Claim window closes *</p>
                <div className="flex gap-2 items-center">
                  <FormField control={form.control} name="claimEndDate" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="claimEndTime" render={({ field }) => (
                    <FormItem className="w-28">
                      <FormControl><Input type="time" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <p className="text-xs text-muted-foreground">Participants can only claim credentials before this time.</p>
              </div>
            </FadeIn>

            {/* Submit */}
            <FadeIn delay={0.2}>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                disabled={isSubmitting || imageUploading}
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating event…</>
                  : <><Award className="h-4 w-4 mr-2" />Create Event</>}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">Gas is free. Your PIN signs the transaction.</p>
            </FadeIn>

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

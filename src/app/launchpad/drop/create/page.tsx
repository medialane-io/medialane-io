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
  Package, Layers, DollarSign, Clock, ShieldCheck,
  Loader2, ImagePlus, X, Mail, CheckCircle2, ChevronDown,
  Zap, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { useIsDropOrganizer } from "@/hooks/use-organizer-status";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { DropFactoryABI, DROP_FACTORY_CONTRACT_MAINNET } from "@medialane/sdk";
import { cn } from "@/lib/utils";

// Payment tokens supported on Starknet mainnet
const PAYMENT_TOKENS = [
  { symbol: "ETH",  address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" },
  { symbol: "STRK", address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" },
  { symbol: "USDC", address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" },
  { symbol: "USDT", address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8" },
];

const SUPPLY_PRESETS = [
  { label: "100",   value: 100 },
  { label: "500",   value: 500 },
  { label: "1 000", value: 1000 },
  { label: "5 000", value: 5000 },
];

const schema = z.object({
  name:            z.string().min(1, "Collection name required").max(100),
  symbol:          z.string().min(1, "Symbol required").max(10).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  supplyCustom:    z.string().optional(),
  priceAmount:     z.string().optional(),
  paymentToken:    z.string().default(PAYMENT_TOKENS[0].address),
  startDate:       z.string().min(1, "Start date required"),
  startTime:       z.string().default("00:00"),
  endDate:         z.string().min(1, "End date required"),
  endTime:         z.string().default("23:59"),
  maxPerWallet:    z.string().default("1"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateDropPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { isOrganizer, isLoading: checkingOrganizer } = useIsDropOrganizer(walletAddress);
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  // Supply preset selection ("custom" = manual input)
  const [supplyPreset, setSupplyPreset] = useState<number | "custom">(1000);
  // Price mode
  const [priceFree, setPriceFree] = useState(true);
  // Token selector dropdown
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(PAYMENT_TOKENS[0]);

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [done, setDone] = useState(false);

  // Cover image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", symbol: "", supplyCustom: "",
      priceAmount: "", paymentToken: PAYMENT_TOKENS[0].address,
      startDate: "", startTime: "00:00",
      endDate: "", endTime: "23:59",
      maxPerWallet: "1",
    },
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
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const resolvedSupply = (): bigint => {
    if (supplyPreset === "custom") {
      const v = parseInt(form.getValues("supplyCustom") ?? "0", 10);
      return BigInt(isNaN(v) || v <= 0 ? 0 : v);
    }
    return BigInt(supplyPreset);
  };

  const onSubmit = (values: FormValues) => {
    if (resolvedSupply() <= 0n) {
      toast.error("Set a valid max supply");
      return;
    }
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingValues(values);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    // Build baseUri from collection metadata
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

    const startTs = Math.floor(
      new Date(`${pendingValues.startDate}T${pendingValues.startTime}:00`).getTime() / 1000
    );
    const endTs = Math.floor(
      new Date(`${pendingValues.endDate}T${pendingValues.endTime}:00`).getTime() / 1000
    );

    const priceWei = priceFree
      ? 0n
      : BigInt(Math.round(parseFloat(pendingValues.priceAmount ?? "0") * 1e18));

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
      const factory = new Contract(DropFactoryABI as any, DROP_FACTORY_CONTRACT_MAINNET, starknetProvider);
      const call = factory.populate("create_drop", [
        pendingValues.name,
        pendingValues.symbol,
        baseUri,
        maxSupply,
        claimConditions,
      ]);

      const result = await executeTransaction({
        pin,
        contractAddress: DROP_FACTORY_CONTRACT_MAINNET,
        calls: [{
          contractAddress: DROP_FACTORY_CONTRACT_MAINNET,
          entrypoint: "create_drop",
          calldata: call.calldata as string[],
        }],
      });

      if (result.status === "confirmed") {
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
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Drop launched</h1>
          <p className="text-muted-foreground">
            Your Collection Drop is live on Starknet. It will appear in the launchpad within a minute once indexed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/launchpad/drop">Back to Drops</Link>
          </Button>
          <Button
            onClick={() => {
              setDone(false);
              form.reset();
              setImagePreview(null);
              setImageUri(null);
              setSupplyPreset(1000);
              setPriceFree(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Launch another
          </Button>
        </div>
      </div>
    );
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Package className="h-10 w-10 text-orange-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to launch a drop</h1>
        <p className="text-muted-foreground">You need to be signed in and registered as an organizer.</p>
      </div>
    );
  }

  // ── Checking organizer status ──────────────────────────────────────────────
  if (checkingOrganizer) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not an organizer ───────────────────────────────────────────────────────
  if (!isOrganizer) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 space-y-6">
        <FadeIn>
          <div className="bento-cell p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold">Organizer access required</h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                To launch Collection Drops you need to be a registered organizer.
                We onboard projects, DAOs, artists, and brands launching limited editions.
              </p>
            </div>
            <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
              <a href="mailto:hello@medialane.io?subject=Collection Drop Organizer Application">
                <Mail className="h-4 w-4" />
                Contact us to become an organizer
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Already registered? Make sure you&apos;re connected with the right wallet.
            </p>
          </div>
        </FadeIn>
      </div>
    );
  }

  // ── Launch form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-8">

        {/* Header */}
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Panel 1: Identity ─────────────────────────────────────────── */}
            <FadeIn delay={0.06}>
              <div className="bento-cell p-5 space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4 text-orange-500" />
                  Identity
                </div>

                {/* Cover image + name + symbol */}
                <div className="flex gap-4 items-start">
                  {/* Cover thumbnail */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !imageUploading && fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                    className="relative h-24 w-24 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-orange-500/50 transition-colors"
                  >
                    {imagePreview
                      ? <Image src={imagePreview} alt="Cover" fill className="object-cover" />
                      : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <ImagePlus className="h-5 w-5" />
                          <span className="text-[10px]">Cover</span>
                        </div>
                      )}
                    {imageUploading && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />

                  <div className="flex-1 space-y-3">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection name *</FormLabel>
                        <FormControl><Input placeholder="Genesis Series" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="symbol" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol *</FormLabel>
                        <FormControl>
                          <Input placeholder="GEN" {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="max-w-[140px]" />
                        </FormControl>
                        <FormDescription>Short ticker shown in wallets.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {imageUri && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-500">✓ Cover uploaded to IPFS</span>
                    <button type="button" onClick={() => { setImagePreview(null); setImageUri(null); }}
                      className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </FadeIn>

            {/* ── Panel 2: Supply ───────────────────────────────────────────── */}
            <FadeIn delay={0.1}>
              <div className="bento-cell p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  Supply cap
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">How many tokens can ever be minted?</p>
                  <div className="flex flex-wrap gap-2">
                    {SUPPLY_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => { setSupplyPreset(p.value); form.setValue("supplyCustom", ""); }}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                          supplyPreset === p.value
                            ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "border-border bg-muted/30 hover:border-orange-500/40 text-muted-foreground"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSupplyPreset("custom")}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                        supplyPreset === "custom"
                          ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "border-border bg-muted/30 hover:border-orange-500/40 text-muted-foreground"
                      )}
                    >
                      Custom
                    </button>
                  </div>

                  {supplyPreset === "custom" && (
                    <FormField control={form.control} name="supplyCustom" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter max supply…"
                            min={1}
                            className="max-w-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </div>
            </FadeIn>

            {/* ── Panel 3: Economics ────────────────────────────────────────── */}
            <FadeIn delay={0.14}>
              <div className="bento-cell p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  Economics
                </div>

                {/* Free / Paid toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceFree(true)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                      priceFree
                        ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-border bg-muted/30 hover:border-orange-500/40 text-muted-foreground"
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Free mint
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceFree(false)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                      !priceFree
                        ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-border bg-muted/30 hover:border-orange-500/40 text-muted-foreground"
                    )}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    Paid mint
                  </button>
                </div>

                {!priceFree && (
                  <div className="flex gap-2 items-start">
                    <FormField control={form.control} name="priceAmount" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Price per token</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.01" step="any" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Token selector */}
                    <div className="relative mt-[22px]">
                      <button
                        type="button"
                        onClick={() => setTokenDropdownOpen((o) => !o)}
                        className="flex items-center gap-1.5 h-10 px-3 rounded-md border border-border bg-muted/30 text-sm font-semibold hover:border-orange-500/50 transition-colors"
                      >
                        {selectedToken.symbol}
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {tokenDropdownOpen && (
                        <div className="absolute top-11 right-0 z-50 w-28 rounded-lg border border-border bg-background shadow-lg py-1">
                          {PAYMENT_TOKENS.map((t) => (
                            <button
                              key={t.address}
                              type="button"
                              onClick={() => {
                                setSelectedToken(t);
                                form.setValue("paymentToken", t.address);
                                setTokenDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                                selectedToken.address === t.address && "text-orange-500 font-semibold"
                              )}
                            >
                              {t.symbol}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Per-wallet limit */}
                <FormField control={form.control} name="maxPerWallet" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max per wallet</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={10000} className="max-w-[120px]" {...field} />
                    </FormControl>
                    <FormDescription>Maximum tokens one wallet can mint.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FadeIn>

            {/* ── Panel 4: Mint window ──────────────────────────────────────── */}
            <FadeIn delay={0.18}>
              <div className="bento-cell p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Mint window
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opens</p>
                    <div className="flex gap-2">
                      <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="startTime" render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl><Input type="time" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Closes</p>
                    <div className="flex gap-2">
                      <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="endTime" render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl><Input type="time" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* ── Submit ────────────────────────────────────────────────────── */}
            <FadeIn delay={0.22}>
              <div className={`btn-border-animated p-[1px] rounded-xl ${isSubmitting || imageUploading ? "opacity-40 pointer-events-none" : ""}`}>
                <button
                  type="submit"
                  className="w-full h-12 text-base font-semibold text-white rounded-[11px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-orange-600"
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Launching…</>
                    : <><Package className="h-4 w-4" />Launch Drop</>}
                </button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">Gas is free. Your PIN signs the transaction.</p>
            </FadeIn>

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

"use client";

/**
 * Creator Coin Launch Studio — the creator designs their coin (image,
 * description: platform-layer profile) with a live preview, sets the
 * economics in plain language, then launches through the existing
 * two-transaction gasless flow.
 *
 * Spec: medialane-core/docs/specs/2026-06-11-coin-launch-studio-design.md
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, ExternalLink, TrendingUp, ArrowRight, ArrowLeft, Lock, Sparkles, ImagePlus, X, Loader2 } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useWalletAuthMethod } from "@/hooks/use-wallet-auth-method";
import {
  getTokenBySymbol, formatAmount,
  validateCoinName as validateName,
  validateCoinSymbol as validateSymbol,
  validateCoinSupply as validateSupply,
  coinToRaw as toRaw,
  teamCoinsRaw, buybackQuoteRaw, fdvHuman,
} from "@medialane/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { ServiceFormShell, StepNav, ActionButton } from "@medialane/ui";
import { CreateCoinAside } from "@/components/claim/create-coin-aside";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import {
  LaunchpadSuccessState,
  LaunchpadProcessingState,
  LaunchpadErrorState,
} from "@/components/launchpad/launchpad-success-state";
import { CoinLaunchPreview, type CoinPreviewData } from "@/components/coin/coin-launch-preview";
import { useSessionKey } from "@/hooks/use-session-key";
import { useTokenBalance } from "@/hooks/use-erc20-balance";
import { useLaunchCoin, type LaunchCoinInput } from "@/hooks/use-launch-coin";
import { useLaunchpadImageUpload } from "@/hooks/use-launchpad-image-upload";
import { suggestLaunchpadSymbol } from "@/lib/launchpad-defaults";
import { getMedialaneClient } from "@/lib/medialane-client";
import { cn } from "@/lib/utils";

const QUOTE_OPTIONS = ["STRK", "ETH"] as const;
type Quote = (typeof QUOTE_OPTIONS)[number];

const SUPPLY_PRESETS = [
  { label: "1M", value: "1000000" },
  { label: "100M", value: "100000000" },
  { label: "1B", value: "1000000000" },
];

const DAPP_COLLECTIONS_BASE = "https://starknet.medialane.io/collections";

type StudioStep = 1 | 2 | 3;
type ProfileStatus = "idle" | "saving" | "saved" | "failed";

export default function CoinCreatePage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { walletAddress, hasWallet } = useSessionKey();
  const { launch, status, error } = useLaunchCoin();
  // io wallets unlock with PIN or passkey — passkey-first when registered,
  // PIN dialog otherwise (the passkey-derived key rides the same param).
  // Authoritative (cross-device) signal, not just the device-local flag.
  const { usesPasskey, authenticate, encryptKey } = useWalletAuthMethod();
  const [authBusy, setAuthBusy] = useState(false);

  const [step, setStep] = useState<StudioStep>(1);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [autoSymbol, setAutoSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [supply, setSupply] = useState("");
  const [quote, setQuote] = useState<Quote>("STRK");
  const [teamPct, setTeamPct] = useState(5);

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");

  const {
    imagePreview, imageUri, imageUploading, uploadError, uploadSuccess,
    fileInputRef, handleImageSelect, clearImage,
  } = useLaunchpadImageUpload({
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"],
    successMessage: "Image ready",
  });

  const quoteToken = getTokenBySymbol(quote)!;
  const { rawBalance } = useTokenBalance(quote, walletAddress ?? null);

  const nameErr = name ? validateName(name) : null;
  const symErr = symbol ? validateSymbol(symbol) : null;
  const supplyErr = supply ? validateSupply(supply) : null;
  const identityValid = !validateName(name) && !validateSymbol(symbol);
  const economicsValid = !validateSupply(supply);

  const handleNameChange = (v: string) => {
    setName(v);
    const suggested = suggestLaunchpadSymbol(v);
    if (suggested && (!symbol || symbol === autoSymbol)) {
      setSymbol(suggested);
      setAutoSymbol(suggested);
    }
  };

  const preview = useMemo(() => {
    if (validateSupply(supply)) return null;
    const supplyHuman = Number(supply);
    const supplyRaw = toRaw(BigInt(supply));
    const teamRaw = teamCoinsRaw(supplyRaw, teamPct);
    const buybackRaw = buybackQuoteRaw(teamRaw, quoteToken.decimals);
    return {
      fdv: fdvHuman(supplyHuman),
      teamCoins: supplyHuman * (teamPct / 100),
      buybackRaw,
      buybackHuman: formatAmount(buybackRaw.toString(), quoteToken.decimals),
    };
  }, [supply, teamPct, quoteToken.decimals]);

  const insufficient = preview != null && rawBalance != null && rawBalance < preview.buybackRaw;
  const canLaunch = identityValid && economicsValid && preview != null && !insufficient && !imageUploading;

  const previewData: CoinPreviewData = {
    name,
    symbol,
    description,
    imageUrl: imagePreview,
    supplyHuman: economicsValid && supply ? Number(supply) : null,
    quoteSymbol: quote,
    teamPct,
  };

  /** Platform-layer identity: saved to the coin's CollectionProfile after launch.
   *  claimedBy lands when the factory event is indexed (instant via sync in the
   *  normal case; 50s poll worst case) — retry briefly, never block the success. */
  const saveCoinProfile = async (contract: string) => {
    if (!imageUri && !description) return;
    setProfileStatus("saving");
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 10_000));
        const token = await getToken();
        if (!token) throw new Error("no session");
        await getMedialaneClient().api.updateCollectionProfile(contract, {
          displayName: name,
          ...(description ? { description } : {}),
          ...(imageUri ? { image: imageUri } : {}),
        }, token);
        setProfileStatus("saved");
        return;
      } catch {
        // claimedBy may not be indexed yet — retry
      }
    }
    setProfileStatus("failed");
  };

  const runLaunch = async (secret: string) => {
    if (!walletAddress) return;
    const input: LaunchCoinInput = { name, symbol, supplyHuman: supply, quoteSymbol: quote, teamPct };
    try {
      const result = await launch(input, secret, walletAddress);
      setCoinAddress(result.coinAddress);
      void saveCoinProfile(result.coinAddress);
    } catch {
      // status/error handled by the hook; error state rendered below
    }
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    await runLaunch(pin);
  };

  const handleLaunchClick = async () => {
    if (!canLaunch || authBusy) return;
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    if (usesPasskey) {
      setAuthBusy(true);
      try {
        const key = encryptKey ?? (await authenticate());
        if (key) { await runLaunch(key); return; }
      } catch { /* fall through to PIN */ } finally {
        setAuthBusy(false);
      }
    }
    setPinOpen(true);
  };

  const handleReset = () => {
    setCoinAddress(null);
    setProfileStatus("idle");
    setStep(1);
    setName(""); setSymbol(""); setAutoSymbol(""); setDescription("");
    setSupply(""); setTeamPct(5);
    clearImage();
  };

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={TrendingUp}
        iconClassName="text-brand-rose"
        title="Launch a Creator Coin"
        description="Sign in to design and launch your own coin with permanently-locked liquidity — gasless, in a few clicks."
      />
    );
  }

  if (status === "done" && coinAddress) {
    return (
      <LaunchpadSuccessState
        icon={Coins}
        accentClassName="bg-brand-rose/10"
        iconClassName="text-brand-rose"
        actionClassName="bg-brand-rose hover:bg-brand-rose/90"
        title={`${name} is live`}
        description="Deployed and launched with permanently-locked liquidity. Trading starts on the dapp right away."
        backHref="/launchpad"
        backLabel="Back to Launchpad"
        actionLabel="Launch another coin"
        onAction={handleReset}
      >
        <div className="space-y-4 w-full max-w-sm mx-auto">
          <CoinLaunchPreview data={previewData} />
          {profileStatus === "saving" && (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving your coin&apos;s image &amp; description…
            </p>
          )}
          {profileStatus === "saved" && (
            <p className="text-xs text-emerald-500 text-center">✓ Image &amp; description saved to your coin&apos;s page</p>
          )}
          {profileStatus === "failed" && (
            <p className="text-xs text-muted-foreground text-center">
              Couldn&apos;t save the image &amp; description right now — add them anytime from your collection settings.
            </p>
          )}
          <p className="font-mono text-xs text-muted-foreground break-all text-center">{coinAddress}</p>
          <Button asChild className="w-full bg-brand-rose hover:bg-brand-rose/90">
            <a href={`${DAPP_COLLECTIONS_BASE}/${coinAddress}`} target="_blank" rel="noopener noreferrer">
              View &amp; trade your coin <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </LaunchpadSuccessState>
    );
  }

  if (status === "deploying" || status === "launching" || status === "indexing") {
    return (
      <LaunchpadProcessingState
        title={
          status === "deploying" ? "Deploying your coin…" :
          status === "launching" ? "Opening the market…" : "Almost there…"
        }
        description="Two on-chain steps, fully gasless. Please keep this window open."
      />
    );
  }

  if (status === "error" && error) {
    return (
      <LaunchpadErrorState
        description={error}
        backHref="/launchpad"
        backLabel="Back to Launchpad"
        onRetry={handleReset}
      />
    );
  }

  return (
    <>
      <ServiceFormShell
        icon={<Coins className="h-4 w-4 text-white" />}
        title="Design your Creator Coin"
        subtitle="Give it a face, set the numbers, and launch — gasless, with liquidity locked forever."
        backSlot={<ClaimBackButton />}
        aboveForm={
          <StepNav
            current={step}
            onStep={(s) => setStep(s as StudioStep)}
            accentText="text-brand-rose"
            accentBg="bg-brand-rose"
            steps={[
              { label: "Your coin", reachable: true },
              { label: "Economics", reachable: step >= 2 || identityValid },
              { label: "Launch", reachable: step >= 3 || (identityValid && economicsValid) },
            ]}
          />
        }
        aside={
          <>
            <CoinLaunchPreview data={previewData} />
            <CreateCoinAside />
          </>
        }
      >
        <div className="space-y-6">

          {step === 1 && (
            <>
              {/* Feature image — platform-layer profile, shown everywhere the coin appears */}
              <div className="space-y-1.5">
                <Label>Coin image</Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border border-dashed border-border bg-muted/20 flex items-center justify-center"
                  >
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="Coin" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                    {imageUploading && (
                      <span className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </span>
                    )}
                  </button>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>JPG, PNG, GIF, SVG or WebP · max 10 MB</p>
                    <p>This becomes your coin&apos;s face across Medialane.</p>
                    {imagePreview && (
                      <button type="button" onClick={clearImage} className="inline-flex items-center gap-1 text-muted-foreground active:text-foreground">
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                    {uploadError && <p className="text-destructive">{uploadError}</p>}
                    {uploadSuccess && <p className="text-emerald-500">✓ {uploadSuccess}</p>}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageSelect(f); }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="My Coin" />
                  {nameErr && <p className="text-xs text-destructive">{nameErr}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="COIN" />
                  {symErr && <p className="text-xs text-destructive">{symErr}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Tell your community what this coin is about…"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Shown on your coin&apos;s page. You can edit it anytime.</p>
              </div>

              <Button onClick={() => setStep(2)} disabled={!identityValid || imageUploading} className="w-full bg-brand-rose hover:bg-brand-rose/90 text-white">
                Next: Economics <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="supply">Total supply</Label>
                <div className="flex gap-2 mb-1">
                  {SUPPLY_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSupply(p.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        supply === p.value ? "border-brand-rose/50 bg-brand-rose/10 text-brand-rose" : "border-border text-muted-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input
                  id="supply" inputMode="numeric" value={supply}
                  onChange={(e) => setSupply(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="1000000"
                />
                {supplyErr && <p className="text-xs text-destructive">{supplyErr}</p>}
                {preview && (
                  <p className="text-xs text-muted-foreground">
                    Your coin starts at a <span className="font-semibold text-foreground">{preview.fdv.toLocaleString()} {quote}</span> market cap
                    (price is fixed at 0.01 {quote}/coin — supply sets the cap).
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Quote token</Label>
                <div className="flex gap-2">
                  {QUOTE_OPTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuote(q)}
                      className={cn(
                        "rounded-lg border px-4 py-1.5 text-sm font-medium",
                        quote === q ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">The currency your coin trades against.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alloc">Your allocation: {teamPct}%</Label>
                <input
                  id="alloc" type="range" min={0} max={10} step={1}
                  value={teamPct} onChange={(e) => setTeamPct(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--brand-rose))]"
                />
                <p className="text-xs text-muted-foreground">
                  Up to 10% goes straight to your wallet at launch — you fund it
                  {preview ? <> (<span className="font-semibold text-foreground">{preview.buybackHuman} {quote}</span>)</> : null}.
                  The rest belongs to the market.
                </p>
                {insufficient && (
                  <p className="text-xs text-destructive">
                    You need {preview?.buybackHuman} {quote} in your wallet for this allocation — lower it or top up.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!economicsValid || insufficient} className="flex-1 bg-brand-rose hover:bg-brand-rose/90 text-white">
                  Next: Review <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span><span className="font-semibold">Liquidity locked forever.</span> Nobody can pull it — not even us.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span><span className="font-semibold">Gasless.</span> One confirmation with your PIN or passkey — we cover the fees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span><span className="font-semibold">Tradable immediately.</span> Your coin opens on the market the moment it launches.</span>
                </li>
              </ul>

              <div className="rounded-xl bg-muted/30 p-4 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Coin</span><span className="font-semibold">{name} (${symbol})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Supply</span><span className="font-semibold">{Number(supply).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Market cap</span><span className="font-semibold">{preview?.fdv.toLocaleString()} {quote}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Your share</span><span className="font-semibold">{teamPct}% {preview && teamPct > 0 ? `(you fund ${preview.buybackHuman} ${quote})` : ""}</span></div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <ActionButton
                  tone="rose"
                  onClick={handleLaunchClick}
                  disabled={!canLaunch || authBusy}
                  className={`flex-1 ${!canLaunch || authBusy ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {authBusy ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Confirm with your passkey…</> : <>Launch your coin <ArrowRight className="h-4 w-4 ml-1.5" /></>}
                </ActionButton>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/launchpad/memecoin" className="underline active:text-foreground">
                  Already launched a coin? Claim it instead.
                </Link>
              </p>
            </>
          )}
        </div>
      </ServiceFormShell>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm coin launch"
        description="Enter your PIN to deploy and launch your coin."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}

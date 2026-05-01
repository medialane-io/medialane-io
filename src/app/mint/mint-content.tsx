"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth, useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
import { byteArray, CallData } from "starknet";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  ArrowRight,
  Trophy,
  Camera,
  ImageIcon,
  Gift,
  Coins,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  FileCheck,
  Zap,
  Users,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, MINT_CONTRACT, MINT_NFT_URI, MINT_NFT_IMAGE_URL } from "@/lib/constants";
import { completeOnboarding } from "@/app/onboarding/_actions";

// ─── Event image card ─────────────────────────────────────────────────────────

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = MINT_NFT_IMAGE_URL || "/genesis.jpg";

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-border/40 shadow-2xl shadow-black/20 ring-1 ring-white/5">
        {errored ? (
          <div className="w-full aspect-square bg-muted/30 flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Medialane Airdrop 2026</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Medialane Creator's Airdrop"
            className="w-full aspect-square object-cover"
            onError={() => setErrored(true)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Below-fold sections (shown only when not signed in) ─────────────────────

const WHAT_YOU_GET = [
  {
    icon: FileCheck,
    title: "Participation record",
    desc: "A permanent, verifiable entry that proves your place in the Medialane airdrop — secured on a public network and yours forever.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Coins,
    title: "Prize pool entry",
    desc: "Automatically eligible for every distribution — Phase 1 at 5,000 members, Phase 2 at 10,000 members, and every annual cycle after.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Camera,
    title: "Creator platform",
    desc: "Publish photos, videos, music, and documents. Build a following, earn from your work, and connect with an audience worldwide.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create your account",
    desc: "Sign up with your Google account in seconds. No approval, no ID, no credit card required.",
  },
  {
    step: "2",
    title: "Secure it",
    desc: "Add a 6-digit PIN or biometrics (Face ID / fingerprint) to protect your participation.",
  },
  {
    step: "3",
    title: "Claim your record",
    desc: "Confirm your airdrop participation with one tap. Your place in the fund is permanent.",
  },
];

const PRIZE_PHASES = [
  {
    phase: "Phase 1",
    trigger: "5,000 participants",
    desc: "First distribution from the creator fund. All eligible members receive their proportional share.",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "text-blue-400",
  },
  {
    phase: "Phase 2",
    trigger: "10,000 participants",
    desc: "Second distribution, plus all revenue accumulated since Phase 1. Community votes on the allocation.",
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "text-purple-400",
  },
];

function WhatYouGet() {
  return (
    <div className="py-14 border-t border-border/30">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">What&apos;s included</p>
        <h2 className="text-2xl font-black">Everything you get, free</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {WHAT_YOU_GET.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="rounded-2xl border border-border/40 bg-muted/10 p-6 space-y-3 hover:bg-muted/20 transition-colors">
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h3 className="font-bold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="py-14 border-t border-border/30">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">Simple process</p>
        <h2 className="text-2xl font-black">How it works</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
        {HOW_IT_WORKS.map(({ step, title, desc }) => (
          <div key={step} className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-primary">{step}</span>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrizePool() {
  return (
    <div className="py-14 border-t border-border/30">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">Distribution schedule</p>
        <h2 className="text-2xl font-black">The prize pool</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Platform revenue goes entirely to the community. No investors taking a cut.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {PRIZE_PHASES.map(({ phase, trigger, desc, color, badge }) => (
          <div key={phase} className={`rounded-2xl border p-6 space-y-2 ${color}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm">{phase}</p>
              <span className={`text-xs font-semibold ${badge}`}>{trigger}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border/40 bg-muted/10 p-5 flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-sm">Annual cycle — ongoing forever</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Every year the Medialane community votes on how to distribute that year&apos;s revenue. The fund repeats indefinitely — Medialane has no investors drawing revenue.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Inline account setup ─────────────────────────────────────────────────────

type WalletSetupStep = "choose" | "pin" | "passkey" | "creating" | "done";

function WalletSetup({ email, onDone }: { email?: string | null; onDone: () => void }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { session } = useClerk();

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet } = useChipiWallet({
    externalUserId: user?.id ?? null,
    getBearerToken,
    enabled: false,
  });

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [step, setStep] = useState<WalletSetupStep>(passkeySupported ? "choose" : "pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWalletWithKey = async (encryptKey: string) => {
    const wallet = await createWallet({ encryptKey });
    const walletKey = wallet.normalizedPublicKey ?? wallet.publicKey;
    if (!walletKey) throw new Error("Failed to activate account. Please try again.");
    const result = await completeOnboarding({ publicKey: walletKey });
    if (result.error) throw new Error(result.error);
    await user?.reload();
    await session?.touch();
    setStep("done");
    setTimeout(onDone, 1200);
  };

  const handlePasskey = async () => {
    setIsSubmitting(true);
    setError(null);
    setStep("passkey");
    try {
      const userName = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "user";
      const { encryptKey } = await createWalletPasskey(user?.id ?? "", userName);
      setStep("creating");
      await createWalletWithKey(encryptKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Try using a PIN instead.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setIsSubmitting(true);
    setError(null);
    setStep("creating");
    try {
      await createWalletWithKey(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account activation failed. Please try again.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "creating" || step === "passkey") {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <p className="font-bold">Activating your account…</p>
          <p className="text-sm text-muted-foreground mt-1">Getting everything ready.</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <div>
          <p className="font-bold text-emerald-600 dark:text-emerald-300">Account activated!</p>
          <p className="text-sm text-muted-foreground mt-1">Preparing your participation…</p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        {email && (
          <div className="flex items-center gap-2 text-sm mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{email}</span>
          </div>
        )}
        <h2 className="text-3xl font-black tracking-tight leading-[1.1]">
          Secure your{" "}
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            account
          </span>
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          {step === "pin"
            ? "Create a 6-digit security PIN. You'll use it to confirm your participation."
            : "Add biometrics or a PIN to protect your airdrop participation."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "choose" && passkeySupported && (
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
            onClick={handlePasskey}
            disabled={isSubmitting}
          >
            <ShieldCheck className="h-4 w-4" />
            Use biometrics (Face ID / fingerprint)
          </Button>
          <Button
            size="lg"
            className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
            onClick={() => setStep("pin")}
            disabled={isSubmitting}
          >
            <KeyRound className="h-4 w-4" />
            Create PIN code (6 digits)
          </Button>
        </div>
      )}

      {step === "choose" && !passkeySupported && (
        <Button
          size="lg"
          className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
          onClick={() => setStep("pin")}
          disabled={isSubmitting}
        >
          <KeyRound className="h-4 w-4" />
          Create PIN code (6 digits)
        </Button>
      )}

      {step === "pin" && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Create your security PIN</p>
          </div>
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setPinError(null); }}
            error={pinError}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              onClick={handlePin}
              disabled={pin.length < 6 || isSubmitting}
            >
              Activate my account
            </Button>
            {passkeySupported && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl h-11"
                onClick={() => { setStep("choose"); setPin(""); setPinError(null); setError(null); }}
              >
                Back
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Your PIN or passkey secures your account and is never shared.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

export function MintContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { executeTransaction, status, error: txError, reset } = useChipiTransaction();

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintPin, setMintPin] = useState("");
  const [mintPinError, setMintPinError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [walletJustCreated, setWalletJustCreated] = useState(false);

  const userId = user?.id;
  const storageKey = userId ? `ml_mint_${userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) { setCompletedTxHash(stored); setMintStep("success"); }
  }, [storageKey]);

  const handleClaim = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparing your record…");

    try {
      if (!walletAddress) throw new Error("Account not found. Please try again.");
      if (!MINT_CONTRACT) throw new Error("Airdrop has not started yet.");

      let tokenUri = MINT_NFT_URI
        ? MINT_NFT_URI.startsWith("ipfs://") || MINT_NFT_URI.startsWith("ar://")
          ? MINT_NFT_URI
          : `ipfs://${MINT_NFT_URI}`
        : "";
      if (!tokenUri) {
        setMintStatusMsg("Registering your participation…");
        const form = new FormData();
        form.append("name", "Medialane Launch Airdrop");
        form.append("description", "Early participant in the Medialane airdrop campaign.");
        form.append("external_url", "https://medialane.io/mint");
        const res = await fetch("/api/pinata", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error("Failed to register. Please try again.");
        tokenUri = data.uri;
      }

      setMintStatusMsg("Confirming participation…");
      const encodedUri = byteArray.byteArrayFromString(tokenUri);
      const calldata = CallData.compile([walletAddress, encodedUri]);

      const result = await executeTransaction({
        pin: mintPin,
        contractAddress: MINT_CONTRACT,
        calls: [{ contractAddress: MINT_CONTRACT, entrypoint: "mint_item", calldata }],
      });

      if (result.status === "confirmed") {
        setMintStep("success");
        setCompletedTxHash(result.txHash);
        if (storageKey) localStorage.setItem(storageKey, result.txHash);
      } else {
        throw new Error("Could not confirm. Please try again.");
      }
    } catch (err: unknown) {
      setMintStep("error");
      setMintError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }, [mintPin, walletAddress, storageKey, executeTransaction]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setMintStep("ready");
  };

  const handleWalletCreated = useCallback(() => {
    setWalletJustCreated(true);
    window.location.reload();
  }, []);

  const showingSections = isLoaded && !isSignedIn && !walletJustCreated;

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/30">
        <MedialaneLogo />
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal" forceRedirectUrl="/mint">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </SignInButton>
        )}
      </header>

      {/* Hero */}
      <div className="flex-1">
        <div className="container mx-auto px-5 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-12 lg:py-20">

            {/* Action panel */}
            <div className="space-y-6 order-1 lg:order-2">

              {/* Loading */}
              {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet) || walletJustCreated) && (
                <div className="space-y-4">
                  <div className="h-10 w-48 rounded-lg bg-muted/40 animate-pulse" />
                  <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                  <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
                </div>
              )}

              {/* Not signed in */}
              {isLoaded && !isSignedIn && !walletJustCreated && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">Medialane Launch</p>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                      Creator&apos;s{" "}
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Airdrop
                      </span>
                    </h1>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                      Join the Medialane launch. Claim your participation record and become eligible for{" "}
                      <strong className="text-foreground font-semibold">every distribution</strong>{" "}
                      from the community fund — completely free.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <SignUpButton mode="modal" forceRedirectUrl="/mint">
                      <Button
                        size="lg"
                        className="w-full rounded-2xl py-7 text-base font-bold gap-2.5 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                      >
                        <Sparkles className="h-5 w-5" />
                        Join with Google — it&apos;s free
                      </Button>
                    </SignUpButton>
                    <SignInButton mode="modal" forceRedirectUrl="/mint">
                      <Button size="lg" variant="ghost" className="w-full rounded-xl text-sm text-muted-foreground hover:text-foreground">
                        Already have an account — sign in
                      </Button>
                    </SignInButton>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      <span>Free</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      <span>No approval required</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      <span>Instant access</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Signed in, no wallet */}
              {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && !walletJustCreated && (
                <WalletSetup
                  email={user?.primaryEmailAddress?.emailAddress}
                  onDone={handleWalletCreated}
                />
              )}

              {/* Has wallet: claim flow */}
              {isLoaded && !isLoadingWallet && isSignedIn && hasWallet && !walletJustCreated && (
                <div className="space-y-5">

                  {mintStep === "ready" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Account active</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                          Creator&apos;s{" "}
                          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            Airdrop
                          </span>
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          Claim your participation record to lock in your place in the community fund.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {[
                          { icon: FileCheck, label: "Permanent participation record" },
                          { icon: Coins,     label: "Eligible for all fund distributions" },
                          { icon: Camera,    label: "Full platform access — publish your work" },
                        ].map(({ icon: Icon, label }) => (
                          <div key={label} className="flex items-center gap-3 text-sm">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-1">
                        <Button
                          size="lg"
                          className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                          onClick={() => setMintStep("enter-pin")}
                          disabled={!MINT_CONTRACT}
                        >
                          <Sparkles className="h-4 w-4" />
                          {MINT_CONTRACT ? "Claim my participation record" : "Airdrop not started yet"}
                          {MINT_CONTRACT && <ArrowRight className="h-4 w-4 ml-auto" />}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Your permanent record of participation in Medialane.
                        </p>
                      </div>
                    </>
                  )}

                  {mintStep === "enter-pin" && (
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                      <div>
                        <p className="font-bold">Confirm with your security code</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Enter the 6-digit PIN you created when activating your account.
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">Record</span>
                        <span className="font-medium">Unique · permanent</span>
                        <span className="text-muted-foreground">Cost</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
                        <span className="text-muted-foreground">Fees</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">None</span>
                      </div>
                      <PinInput
                        value={mintPin}
                        onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                        placeholder="Your security PIN"
                        error={mintPinError}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="lg"
                          className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                          onClick={handleClaim}
                          disabled={mintPin.length < 6}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="rounded-xl h-11"
                          onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {mintStep === "minting" && (
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                      <div className="flex items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary shrink-0" />
                        <div>
                          <p className="font-bold">Registering your participation…</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{mintStatusMsg || "Please wait…"}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        {[
                          { label: "Preparing your record",       done: status !== "idle" },
                          { label: "Submitting to the network",   done: status === "confirming" || status === "confirmed" },
                          { label: "Confirmed!",                  done: status === "confirmed" },
                        ].map(({ label, done }) => (
                          <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {done
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />}
                            <span className={done ? "text-foreground" : ""}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mintStep === "success" && (
                    <div className="space-y-5">
                      <div>
                        <h1 className="text-5xl font-black tracking-tight leading-[1.05]">
                          You&apos;re{" "}
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">in!</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">Your place in the Creator&apos;s Airdrop is confirmed.</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-600 dark:text-emerald-300">Participation confirmed!</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Welcome to Medialane.</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                            <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <span>Eligible for the community creator fund</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                            <Camera className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>Publish and share your creative work</span>
                          </div>
                        </div>
                        {completedTxHash && (
                          <a
                            href={`${EXPLORER_URL}/tx/${completedTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span className="font-mono">{completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <Button size="lg" className="flex-1 p-4" asChild>
                          <Link href="/create/asset">Publish content</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="flex-1 p-4" asChild>
                          <Link href="/marketplace">Explore the app</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {mintStep === "error" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm">Could not complete</p>
                            {(mintError || txError) && (
                              <p className="text-xs text-muted-foreground mt-1">{mintError || txError}</p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Try again
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Image */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-sm">
                <EventCard />
              </div>
            </div>

          </div>

          {/* Below-fold content: only for non-signed-in visitors */}
          {showingSections && (
            <>
              <WhatYouGet />
              <HowItWorks />
              <PrizePool />
              <div className="py-10">
                <SignUpButton mode="modal" forceRedirectUrl="/mint">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl py-7 text-base font-bold gap-2.5 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                  >
                    <Sparkles className="h-5 w-5" />
                    Join with Google — it&apos;s free
                  </Button>
                </SignUpButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-6 pt-4">
          Free participation · No purchase required · Fund distribution governed by Medialane DAO ·{" "}
          <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            Campaign terms
          </Link>
        </p>
        <div className="px-6 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/campaign-terms" className="hover:text-foreground transition-colors">Campaign</Link>
          <a href="https://docs.medialane.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">About</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}

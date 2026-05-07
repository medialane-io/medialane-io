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
  AlertCircle,
  FileCheck,
  Coins,
  Users,
  ShieldCheck,
  KeyRound,
  ImageIcon,
  Shield,
  Info,
  PenLine,
  ShoppingCart,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, MINT_CONTRACT, MINT_NFT_URI, MINT_NFT_IMAGE_URL } from "@/lib/constants";
import { completeOnboarding } from "@/app/onboarding/_actions";

// ─── Genesis NFT image ────────────────────────────────────────────────────────

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = MINT_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative rounded-3xl overflow-hidden border border-border/40 shadow-2xl shadow-black/20 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Medialane Airdrop 2026</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Medialane Creator's Airdrop"
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

// ─── Wallet setup ─────────────────────────────────────────────────────────────

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

  const [passkeySupported] = useState(() => typeof window !== "undefined" && isWebAuthnSupported());
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
      setError(err instanceof Error ? err.message : "Setup failed. Try a PIN instead.");
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
      setError(err instanceof Error ? err.message : "Activation failed. Please try again.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "creating" || step === "passkey") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-semibold text-sm text-muted-foreground">Activating your account…</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="font-semibold text-emerald-600 dark:text-emerald-300">Account activated!</p>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {email && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{email}</span>
        </div>
      )}
      <div>
        <p className="font-bold">One last step — secure your account</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {step === "pin" ? "Create a 6-digit PIN to confirm actions." : "Add Face ID, fingerprint, or a PIN."}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {step === "choose" && (
        <div className="space-y-2">
          <Button size="lg" className="w-full h-12 font-bold gap-2" onClick={handlePasskey} disabled={isSubmitting}>
            <ShieldCheck className="h-4 w-4" />
            Use Face ID / fingerprint
          </Button>
          <Button size="lg" variant="outline" className="w-full h-12 gap-2" onClick={() => setStep("pin")} disabled={isSubmitting}>
            <KeyRound className="h-4 w-4" />
            Create a PIN instead
          </Button>
        </div>
      )}
      {step === "pin" && (
        <div className="space-y-3">
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setPinError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 6) handlePin(); }}
            error={pinError}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="lg" className="flex-1 h-12 font-bold" onClick={handlePin} disabled={pin.length < 6 || isSubmitting}>
              Activate my account
            </Button>
            {passkeySupported && (
              <Button size="lg" variant="outline" className="h-12" onClick={() => { setStep("choose"); setPin(""); setPinError(null); setError(null); }}>
                Back
              </Button>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center">Your PIN is never shared or stored by us.</p>
    </div>
  );
}

// ─── Claim flow ────────────────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

function GenesisMint() {
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

  const handleResetMintGate = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setCompletedTxHash(null);
    setMintStep("ready");
  }, [storageKey]);

  const handleWalletCreated = useCallback(() => {
    setWalletJustCreated(true);
    window.location.reload();
  }, []);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4 shadow-lg shadow-black/5">
      <div className="flex items-center gap-2 pb-2 border-b border-border/30">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <p className="font-bold text-sm">Claim your participation record</p>
      </div>

      {/* Loading */}
      {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet) || walletJustCreated) && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      )}

      {/* Not signed in */}
      {isLoaded && !isSignedIn && !walletJustCreated && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Sign up free — no card, no approval needed.</p>
          <SignUpButton mode="modal" forceRedirectUrl="/mint">
            <Button size="lg" className="w-full h-12 font-bold gap-2 rounded-xl">
              <Sparkles className="h-4 w-4" />
              Join free — claim my spot
            </Button>
          </SignUpButton>
          <SignInButton mode="modal" forceRedirectUrl="/mint">
            <Button size="lg" variant="ghost" className="w-full text-sm text-muted-foreground">
              Already have an account — sign in
            </Button>
          </SignInButton>
        </div>
      )}

      {/* Wallet setup */}
      {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && !walletJustCreated && (
        <WalletSetup email={user?.primaryEmailAddress?.emailAddress} onDone={handleWalletCreated} />
      )}

      {/* Mint states */}
      {isLoaded && !isLoadingWallet && isSignedIn && hasWallet && !walletJustCreated && (
        <div className="space-y-3">
          {mintStep === "ready" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Account active — ready to claim</span>
              </div>
              <Button
                size="lg"
                className="w-full h-12 font-bold gap-2"
                onClick={() => setMintStep("enter-pin")}
                disabled={!MINT_CONTRACT}
              >
                <Sparkles className="h-4 w-4" />
                {MINT_CONTRACT ? "Claim my spot" : "Airdrop not started yet"}
              </Button>
            </>
          )}

          {mintStep === "enter-pin" && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-sm">Confirm with your PIN</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter the PIN you created when signing up.</p>
              </div>
              <PinInput
                value={mintPin}
                onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && mintPin.length >= 6) handleClaim(); }}
                placeholder="Your security PIN"
                error={mintPinError}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="lg" className="flex-1 h-11 font-bold" onClick={handleClaim} disabled={mintPin.length < 6}>
                  Confirm
                </Button>
                <Button size="lg" variant="outline" className="h-11" onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {mintStep === "minting" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Registering your participation…</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mintStatusMsg || "Please wait…"}</p>
                </div>
              </div>
              <div className="space-y-1.5 pl-9">
                {[
                  { label: "Preparing your record",  done: status !== "idle" },
                  { label: "Submitting",             done: status === "confirming" || status === "confirmed" },
                  { label: "Confirmed",              done: status === "confirmed" },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    {done ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                    <span className={done ? "text-foreground" : ""}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mintStep === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-300">You&apos;re in!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your participation is confirmed.</p>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" asChild className="flex-1">
                  <Link href="/create/asset">Publish content</Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <Link href="/marketplace">Explore the app</Link>
                </Button>
              </div>
              <button className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center" onClick={handleResetMintGate}>
                Didn&apos;t receive your record? Try again
              </button>
            </div>
          )}

          {mintStep === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Could not complete</p>
                  {(mintError || txError) && <p className="text-xs text-muted-foreground mt-0.5">{mintError || txError}</p>}
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MintContent() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/30 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <MedialaneLogo />
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal" forceRedirectUrl="/mint">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">Sign in</Button>
          </SignInButton>
        )}
      </header>

      <div className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          {/* ── Hero ── */}
          <section className="py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Left: badge + title + claim */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Creator&apos;s Airdrop — Launch Campaign</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  Join the{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Creator&apos;s Airdrop
                  </span>
                </h1>
                <GenesisMint />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Medialane is a platform for creators — publish your work, build an audience, and earn. Everyone who joins during the launch campaign gets a stake in the creator fund.
                </p>
                <div className="flex items-center gap-4">
                  {["Free to join", "No card needed", "Instant"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: image (sticky on desktop) */}
              <div className="lg:sticky lg:top-24">
                <EventCard />
              </div>

            </div>
          </section>

          {/* ── What you get ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Benefits</p>
              <h2 className="text-2xl sm:text-3xl font-black">What you get</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: FileCheck,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  title: "Permanent participation record",
                  desc: "A record tied to your account forever. Can't be taken away.",
                },
                {
                  icon: Coins,
                  color: "text-yellow-500",
                  bg: "bg-yellow-500/10",
                  title: "Share of the creator fund",
                  desc: "When milestones are hit, revenue gets distributed back to participants.",
                },
                {
                  icon: Users,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                  title: "Full platform access",
                  desc: "Publish, sell, collect, and collaborate with creators on day one.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Participation tiers ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">How it works</p>
              <h2 className="text-2xl sm:text-3xl font-black">Sign up. That&apos;s it.</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Creating an account is all you need to be eligible. Do more — earn more.
              </p>
            </div>

            {/* Base tier — prominent */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-lg">Register</p>
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Minimum — you&apos;re in</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Sign up and claim your record. That&apos;s the only requirement to participate in the airdrop.
                  </p>
                </div>
              </div>
            </div>

            {/* Bonus tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <PenLine className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">Bonus</span>
                </div>
                <div>
                  <p className="font-bold">Create content</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Publish original work — photos, music, art, or writing. Creators get a larger share of each distribution.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">Biggest bonus</span>
                </div>
                <div>
                  <p className="font-bold">Trade &amp; collect</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Buy, sell, and collaborate with other creators. Active participants receive the highest share.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Distribution phases ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribution</p>
              <h2 className="text-2xl sm:text-3xl font-black">Creator fund phases</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                When the community hits a milestone, platform revenue gets distributed to all participants.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Phase 1</p>
                  <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">5,000 members</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  First distribution. All eligible participants get a proportional share based on their activity.
                </p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Phase 2</p>
                  <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">10,000 members</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Second distribution, including all revenue since Phase 1. Activity scores recalculated from launch.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both phases are planned for the first year of the platform. Milestones are targets, not guarantees — timing depends on growth.
              </p>
            </div>
          </section>

          {/* ── Eligibility + Disclaimer ── */}
          <section className="py-10 border-t border-border/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Eligibility</p>
                  <h2 className="text-2xl font-black">Who qualifies</h2>
                </div>
                <div className="space-y-2.5 text-sm">
                  {[
                    { ok: true,  text: "Anyone who creates a free account." },
                    { ok: true,  text: "Creators who publish original content get a higher share." },
                    { ok: true,  text: "Active participants who trade or collaborate get the most." },
                    { ok: false, text: "Automated tools and duplicate accounts are disqualified." },
                    { ok: false, text: "Artificially inflated activity is disqualified." },
                  ].map(({ ok, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                        {ok
                          ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          : <XCircle className="h-3 w-3 text-destructive" />}
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-2xl font-black">Disclaimer</h2>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.</p>
                  <p>Participation does not guarantee any financial return. Fund distributions, if any occur, may take the form of platform credits, digital assets, or other community resources.</p>
                  <p>The participation record is a digital record of community membership. It has no inherent monetary value and is not a financial instrument.</p>
                  <p>
                    By participating you agree to the{" "}
                    <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Campaign Terms</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</Link>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Bottom CTA (only for logged-out) ── */}
          {isLoaded && !isSignedIn && (
            <section className="py-10 border-t border-border/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Ready to join?</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Free, instant, no card required.</p>
                </div>
                <SignUpButton mode="modal" forceRedirectUrl="/mint">
                  <Button size="lg" className="gap-2 shrink-0 font-bold">
                    <Sparkles className="h-4 w-4" />
                    Claim my spot
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignUpButton>
              </div>
            </section>
          )}

          <div className="pb-12" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-5 pt-4">
          Free to join · No purchase required ·{" "}
          <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            Campaign terms
          </Link>
        </p>
        <div className="px-5 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
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

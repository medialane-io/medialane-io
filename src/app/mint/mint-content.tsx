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
  ShieldCheck,
  KeyRound,
  AlertCircle,
  FileCheck,
  Coins,
  Users,
  Palette,
  Globe,
  Music,
  ImageIcon,
  Shield,
  Info,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, MINT_CONTRACT, MINT_NFT_URI, MINT_NFT_IMAGE_URL } from "@/lib/constants";

// ─── Genesis NFT image ────────────────────────────────────────────────────────

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = MINT_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl shadow-black/10 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-7 w-7 text-primary/40" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Medialane Airdrop 2026</p>
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
import { completeOnboarding } from "@/app/onboarding/_actions";

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
        <p className="font-bold">Protect your account</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {step === "pin"
            ? "Create a 6-digit PIN to confirm your participation."
            : "Add Face ID, fingerprint, or a PIN."}
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
            Create PIN instead
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
      <p className="text-xs text-muted-foreground text-center">Your PIN or passkey is never shared or stored by us.</p>
    </div>
  );
}

// ─── Claim flow (Genesis Mint) ────────────────────────────────────────────────

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
    <div className="rounded-2xl border border-border/50 bg-card/50 p-5 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-border/30">
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
          <p className="text-sm text-muted-foreground">Create a free account to claim your spot.</p>
          <SignUpButton mode="modal" forceRedirectUrl="/mint">
            <Button size="lg" className="w-full h-12 font-bold gap-2 rounded-xl">
              <Sparkles className="h-4 w-4" />
              Join with Google — it&apos;s free
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
                className="w-full h-12 font-bold gap-2 disabled:opacity-50"
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
                  { label: "Preparing your record",   done: status !== "idle" },
                  { label: "Submitting",              done: status === "confirming" || status === "confirmed" },
                  { label: "Confirmed",               done: status === "confirmed" },
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

          {/* ── Hero: 2-col on desktop ── */}
          <section className="py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Left: image + text */}
              <div className="space-y-6">
                <div className="space-y-4">
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
                  <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                    Medialane is a platform for creators — publish your work, build an audience, and earn. Everyone who joins during the launch campaign gets a stake in the creator fund.
                  </p>
                </div>
                <EventCard />
              </div>

              {/* Right: claim component (sticky on desktop) */}
              <div className="lg:sticky lg:top-24">
                <GenesisMint />
              </div>
            </div>
          </section>

          {/* ── What is Medialane ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Platform</p>
              <h2 className="text-2xl sm:text-3xl font-black">What is Medialane</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Medialane is a creator platform where you publish, share, and monetize your work. Unlike traditional platforms, there are no middlemen taking a cut — the platform revenue goes back to the community.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Camera,  label: "Photos & videos" },
                { icon: Music,   label: "Music" },
                { icon: Palette, label: "Digital art" },
                { icon: Globe,   label: "Documents & posts" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 px-4 py-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── What you get ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Benefits</p>
              <h2 className="text-2xl sm:text-3xl font-black">What you receive</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: FileCheck,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  title: "A permanent participation record",
                  desc: "When you claim, a record of your participation is issued. It stays with your account permanently and cannot be taken away.",
                },
                {
                  icon: Coins,
                  color: "text-yellow-500",
                  bg: "bg-yellow-500/10",
                  title: "Eligibility for creator fund payouts",
                  desc: "Participants are eligible for distributions from the creator fund when milestones are reached. The more you create and engage, the larger your share.",
                },
                {
                  icon: Users,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                  title: "Full platform access",
                  desc: "Publish content, build a profile, connect with other creators, and access the full Medialane marketplace from day one.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30">
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

          {/* ── How participation works ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rules</p>
              <h2 className="text-2xl sm:text-3xl font-black">How participation works</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Participation is free and open to everyone. Signing up and claiming your record is the minimum to be eligible. Creators who publish original content and engage with the community receive a higher share of each distribution.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { step: "1", title: "Create your account", desc: "Sign up with Google. No approval, no ID, no credit card required." },
                { step: "2", title: "Protect it", desc: "Set a 6-digit PIN or use Face ID / fingerprint. This secures your account and confirms every action." },
                { step: "3", title: "Claim your spot", desc: "Tap the claim button. Your participation record is issued and your eligibility is locked in." },
                { step: "4", title: "Create and engage", desc: "Publish content, interact with other creators, and collect — the more you contribute, the larger your share." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 items-start p-4 rounded-2xl border border-border/40 bg-card/30">
                  <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-primary">{step}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Distribution phases ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribution</p>
              <h2 className="text-2xl sm:text-3xl font-black">Creator fund phases</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                The creator fund distributes platform revenue to participants. Distributions are milestone-based — they happen when the community reaches the thresholds below. All distributions are subject to a community vote.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Phase 1</p>
                  <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">5,000 members</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  First distribution from the creator fund. All eligible participants receive a proportional share based on their activity.
                </p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Phase 2</p>
                  <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">10,000 members</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Second distribution, including all revenue accumulated since Phase 1. Contribution scores are recalculated from all activity since launch.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Phases 1 and 2 are the distributions for the first year of the platform. These milestones are targets, not guarantees — timing depends on platform growth and community vote.
              </p>
            </div>
          </section>

          {/* ── Eligibility + Disclaimer side by side on desktop ── */}
          <section className="py-10 border-t border-border/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

              {/* Eligibility */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Eligibility</p>
                  <h2 className="text-2xl font-black">Who qualifies</h2>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { ok: true,  text: "Anyone who creates a free account and claims their record." },
                    { ok: true,  text: "Accounts that publish original content receive a higher share." },
                    { ok: true,  text: "Active participants who trade or collaborate receive the highest share." },
                    { ok: false, text: "Accounts using automated tools or duplicate registrations are disqualified." },
                    { ok: false, text: "Accounts found to be artificially inflating scores are disqualified." },
                  ].map(({ ok, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                        {ok ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-2xl font-black">Disclaimer</h2>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.
                  </p>
                  <p>
                    Participation does not guarantee any financial return. Fund distributions, if any occur, are made at the sole discretion of Medialane community governance and may take the form of platform credits, digital assets, or other community resources as determined by vote.
                  </p>
                  <p>
                    The participation record is a digital record of membership in the Medialane community. It has no inherent monetary value and is not a financial instrument.
                  </p>
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

          {/* ── Bottom repeat claim ── */}
          {isLoaded && !isSignedIn && (
            <section className="py-10 border-t border-border/30 space-y-4 max-w-lg">
              <p className="font-bold text-lg">Ready to join?</p>
              <GenesisMint />
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

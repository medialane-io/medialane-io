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
  Users,
  ImageIcon,
  Gift,
  Coins,
  ShieldCheck,
  KeyRound,
  AlertCircle,
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
            alt="Medialane airdrop NFT"
            className="w-full aspect-square object-cover"
            onError={() => setErrored(true)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Benefits ────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Coins,  label: "Prize pool",         sub: "Airdrop rewards for early creators" },
  { icon: Camera, label: "Publish & earn",      sub: "Photos, videos, music and more"     },
  { icon: Gift,   label: "Free access",         sub: "No approval, card, or gas fees"     },
  { icon: Users,  label: "Sign in with Google", sub: "Free signup in seconds"             },
];

function BenefitsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BENEFITS.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/15 p-3 hover:bg-muted/25 transition-colors"
        >
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inline wallet setup ──────────────────────────────────────────────────────

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
    if (!walletKey) throw new Error("Failed to create wallet. Please try again.");
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
          <p className="text-sm text-muted-foreground mt-1">Getting everything ready for you.</p>
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
            : "Complete your setup by choosing a passkey or a numeric PIN."}
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
        Your passkey or PIN secures your account and is never shared.
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
    setMintStatusMsg("Preparing your NFT…");

    try {
      if (!walletAddress) throw new Error("Account not found. Please try again.");
      if (!MINT_CONTRACT) throw new Error("Airdrop has not started yet.");

      let tokenUri = MINT_NFT_URI
        ? MINT_NFT_URI.startsWith("ipfs://") || MINT_NFT_URI.startsWith("ar://")
          ? MINT_NFT_URI
          : `ipfs://${MINT_NFT_URI}`
        : "";
      if (!tokenUri) {
        setMintStatusMsg("Registering NFT…");
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

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 flex items-center border-b border-border/30">
        <MedialaneLogo />
      </header>

      {/* Content */}
      <div className="flex-1 container mx-auto px-5 py-10 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Panel — first on mobile, right on desktop */}
          <div className="space-y-6 order-1 lg:order-2">

            {/* Loading skeleton */}
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
                    Prize{" "}
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      Airdrop
                    </span>
                  </h1>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    Win prizes by creating your{" "}
                    <strong className="text-foreground font-semibold">free account</strong>. Publish your creative work on Starknet — no gas fees required.
                  </p>
                </div>

                <BenefitsGrid />

                <div className="space-y-3 pt-2">
                  <SignUpButton mode="modal" forceRedirectUrl="/mint">
                    <Button
                      size="lg"
                      className="w-full rounded-2xl py-7 text-base font-bold gap-2.5 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                    >
                      <Sparkles className="h-5 w-5" />
                      Join with Google — it's free
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal" forceRedirectUrl="/mint">
                    <Button size="lg" variant="ghost" className="w-full rounded-xl text-sm text-muted-foreground hover:text-foreground">
                      Already have an account — sign in
                    </Button>
                  </SignInButton>
                </div>

                <p className="text-xs text-center text-muted-foreground/70">
                  Free · No approval or gas fees · Instant access
                </p>
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
                        Prize{" "}
                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                          Airdrop
                        </span>
                      </h1>
                    </div>
                    <BenefitsGrid />
                    <div className="space-y-2 pt-1">
                      <Button
                        size="lg"
                        className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                        onClick={() => setMintStep("enter-pin")}
                        disabled={!MINT_CONTRACT}
                      >
                        <Sparkles className="h-4 w-4" />
                        {MINT_CONTRACT ? "Claim my participation NFT" : "Airdrop not started yet"}
                        {MINT_CONTRACT && <ArrowRight className="h-4 w-4 ml-auto" />}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        This NFT is your passport to the prize draw!
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
                      <span className="text-muted-foreground">NFT</span>
                      <span className="font-medium">Exclusive</span>
                      <span className="text-muted-foreground">Cost</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
                      <span className="text-muted-foreground">Gas fees</span>
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
                        { label: "Preparing your NFT",           done: status !== "idle" },
                        { label: "Submitting to the network",    done: status === "confirming" || status === "confirmed" },
                        { label: "Confirmed on-chain!",          done: status === "confirmed" },
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
                      <p className="text-sm text-muted-foreground mt-2">Your participation in the airdrop is confirmed.</p>
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
                          <span>Eligible for the prize airdrop</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                          <Camera className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Publish content and earn rewards</span>
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
                    <BenefitsGrid />
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Image — second on mobile, left on desktop */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="w-full max-w-sm">
              <EventCard />
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-border/40 flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <a href="https://docs.medialane.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">About</a>
        <span>© {new Date().getFullYear()} Medialane</span>
      </footer>
    </div>
  );
}

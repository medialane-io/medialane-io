"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser, useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { byteArray, CallData } from "starknet";
import { useCreateWallet, Chain } from "@chipi-stack/nextjs";
import {
  Sparkles,
  Zap,
  Shield,
  ExternalLink,
  CheckCircle2,
  Loader2,
  XCircle,
  RefreshCw,
  LayoutGrid,
  Gift,
  Droplets,
  Star,
  ArrowRight,
  Eye,
  EyeOff,
  Wallet,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import {
  EXPLORER_URL,
  MINT_CONTRACT,
  GENESIS_NFT_URI,
  GENESIS_NFT_IMAGE_URL,
} from "@/lib/constants";
import { LaunchCountdown } from "./launch-countdown";

// ─── Genesis NFT card ────────────────────────────────────────────────────────

function GenesisNftCard({ minted = false }: { minted?: boolean }) {
  return (
    <div className="genesis-card-tilt cursor-pointer select-none animate-float">
      <div className="relative w-72 sm:w-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0118] via-[#1a0540] to-[#080818]" />
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-primary/25 blur-3xl animate-blob" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-purple-500/20 blur-3xl animate-blob-slow" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="genesis-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#genesis-grid)" />
        </svg>

        <div className="relative z-10 flex flex-col p-5 aspect-[3/4]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Medialane</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-white/15 text-white/40 bg-white/5 px-2 py-0.5 font-mono">
              Genesis #001
            </Badge>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {GENESIS_NFT_IMAGE_URL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={GENESIS_NFT_IMAGE_URL} alt="Genesis NFT" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <div className="relative flex items-center justify-center w-full h-full">
                <div className="absolute w-36 h-36 rounded-full border border-primary/25 animate-spin-slow">
                  {[0, 90, 180, 270].map((deg) => (
                    <div
                      key={deg}
                      className="absolute w-1.5 h-1.5 rounded-full bg-primary/60 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        top: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
                        left: `${50 + 47 * Math.cos((deg * Math.PI) / 180)}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute w-24 h-24 rounded-full border border-purple-400/20 animate-spin-slow-reverse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 via-purple-600/20 to-pink-500/10 border border-primary/40 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary animate-sparkle" />
                </div>
                {[
                  { top: "14%", left: "16%", size: 8 },
                  { top: "18%", left: "76%", size: 6 },
                  { top: "72%", left: "14%", size: 6 },
                  { top: "76%", left: "78%", size: 8 },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white/25 animate-pulse"
                    style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: `${i * 0.4}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 mt-4">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/35 uppercase tracking-widest mb-0.5">Collection</p>
                <p className="text-sm font-bold text-white leading-tight">Medialane Genesis</p>
                {minted && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">Minted</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/35 uppercase tracking-widest mb-0.5">Network</p>
                <p className="text-xs font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Starknet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Perks ────────────────────────────────────────────────────────────────────

const PERKS = [
  { icon: Gift, label: "Free to mint", sub: "Zero protocol fees" },
  { icon: Zap, label: "Gas-free", sub: "Sponsored by Medialane" },
  { icon: Droplets, label: "Airdrop eligible", sub: "Future ML token distribution" },
  { icon: Shield, label: "On-chain IP", sub: "Immutable ownership via ZK proofs" },
];

function PerksGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PERKS.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 hover:border-primary/30 transition-colors"
        >
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PIN input ────────────────────────────────────────────────────────────────

function PinInput({
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder = "Enter 6–12 digit PIN",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 12);
            onChange(v);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border/60 bg-muted/30 px-4 py-3 pr-12 text-lg tracking-widest font-mono placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          autoComplete="off"
          autoFocus
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

export function LaunchMint() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const { createWalletAsync } = useCreateWallet();
  const { executeTransaction, status, statusMessage, error: txError, reset } = useChipiTransaction();

  // Wallet creation
  const [walletPin, setWalletPin] = useState("");
  const [walletPinVisible, setWalletPinVisible] = useState(false);
  const [walletPinError, setWalletPinError] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletCreateError, setWalletCreateError] = useState<string | null>(null);

  // Mint flow
  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintPin, setMintPin] = useState("");
  const [mintPinVisible, setMintPinVisible] = useState(false);
  const [mintPinError, setMintPinError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  const userId = user?.id;

  // Restore minted state from localStorage
  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`ml_genesis_${userId}`);
    if (stored) {
      setCompletedTxHash(stored);
      setMintStep("success");
    }
  }, [userId]);

  const hasWallet = !!(user?.publicMetadata?.publicKey || user?.unsafeMetadata?.publicKey);
  const recipientAddress = (
    user?.publicMetadata?.publicKey ?? user?.unsafeMetadata?.publicKey
  ) as string | undefined;

  // ── Validate PIN ──────────────────────────────────────────────────────────

  const validatePin = (pin: string): string | null => {
    if (!pin) return "PIN is required";
    if (!/^\d+$/.test(pin)) return "Digits only";
    if (pin.length < 6) return "Minimum 6 digits";
    return null;
  };

  // ── Create wallet ─────────────────────────────────────────────────────────

  const handleCreateWallet = useCallback(async () => {
    const err = validatePin(walletPin);
    if (err) { setWalletPinError(err); return; }
    setWalletPinError(null);
    setIsCreatingWallet(true);
    setWalletCreateError(null);

    try {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      });
      if (!token) throw new Error("Auth token missing. Please sign in again.");

      const response = await createWalletAsync({
        params: {
          encryptKey: walletPin,
          externalUserId: user!.id as any,
          chain: "STARKNET" as Chain,
        },
        bearerToken: token,
      });

      // SDK v11 returns { wallet: {...} }, v13 returns the wallet directly
      const wallet = (response as any).wallet || response;
      if (!wallet?.publicKey) {
        throw new Error("Wallet creation returned invalid data. Please try again.");
      }

      await user!.update({
        unsafeMetadata: {
          ...user!.unsafeMetadata,
          publicKey: wallet.publicKey,
          encryptedPrivateKey: wallet.encryptedPrivateKey,
          walletCreated: true,
        },
      });

      await user!.reload();
      // hasWallet will now be true → component re-renders to show mint button
    } catch (err: any) {
      setWalletCreateError(err?.message || "Wallet creation failed. Please try again.");
    } finally {
      setIsCreatingWallet(false);
    }
  }, [walletPin, getToken, createWalletAsync, user]);

  // ── Mint ──────────────────────────────────────────────────────────────────

  const handleMint = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparing your NFT…");

    try {
      if (!recipientAddress) throw new Error("Wallet address not found.");
      if (!MINT_CONTRACT) throw new Error("Mint contract not configured.");

      // Resolve token URI
      let tokenUri = GENESIS_NFT_URI;
      if (!tokenUri) {
        setMintStatusMsg("Uploading NFT metadata…");
        const form = new FormData();
        form.append("name", "Medialane Genesis");
        form.append(
          "description",
          "The official launch NFT of Medialane — the creator launchpad for programmable IP on Starknet. Holders are eligible for future Medialane airdrops."
        );
        const res = await fetch("/api/pinata", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error("Metadata upload failed: " + data.error);
        tokenUri = data.uri;
      }

      setMintStatusMsg("Submitting transaction…");
      const encodedUri = byteArray.byteArrayFromString(tokenUri);
      const calldata = CallData.compile([recipientAddress, encodedUri]);

      const result = await executeTransaction({
        pin: mintPin,
        contractAddress: MINT_CONTRACT,
        calls: [{ contractAddress: MINT_CONTRACT, entrypoint: "mint_item", calldata }],
      });

      if (result.status === "confirmed") {
        setMintStep("success");
        setCompletedTxHash(result.txHash);
        if (userId) localStorage.setItem(`ml_genesis_${userId}`, result.txHash);
      } else {
        throw new Error(result.revertReason || "Transaction reverted on-chain.");
      }
    } catch (err: any) {
      setMintStep("error");
      setMintError(err?.message || "Mint failed. Please try again.");
    }
  }, [mintPin, recipientAddress, userId, executeTransaction]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setMintStep("ready");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isSuccess = mintStep === "success";

  return (
    <div className="min-h-screen relative flex items-center">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 h-2/3 w-2/3 rounded-full bg-primary/[0.08] blur-[120px]" />
        <div className="absolute -bottom-1/3 -right-1/4 h-2/3 w-2/3 rounded-full bg-purple-600/[0.08] blur-[120px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="launch-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#launch-dots)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-20 relative max-w-5xl">
        {/* Launch badge */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary">Pre-launch mint event · Starknet Mainnet</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: NFT card */}
          <div className="flex justify-center">
            <GenesisNftCard minted={isSuccess} />
          </div>

          {/* Right: interactive panel */}
          <div>
            {/* ── Loading ── */}
            {!isLoaded && (
              <div className="space-y-6">
                <div className="h-10 w-48 rounded-lg bg-muted/40 animate-pulse" />
                <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
              </div>
            )}

            {/* ── Not signed in ── */}
            {isLoaded && !isSignedIn && (
              <div className="space-y-7">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Genesis Collection
                    </span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                    Claim your{" "}
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Genesis NFT
                    </span>
                  </h1>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                    Be among the first to mark the launch of Medialane on Starknet. This free,
                    exclusive NFT is your proof of early support — and your ticket to future airdrops.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Full app launches in
                  </p>
                  <LaunchCountdown />
                  <p className="text-xs text-muted-foreground">March 14, 2026 · Starknet Mainnet</p>
                </div>

                <PerksGrid />

                <div className="space-y-2.5 pt-1">
                  <SignUpButton mode="modal">
                    <Button
                      size="lg"
                      className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                    >
                      <Sparkles className="h-4 w-4" />
                      Create free account
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button size="lg" variant="outline" className="w-full rounded-xl h-12 text-base font-medium">
                      Sign in
                    </Button>
                  </SignInButton>
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    No seed phrases · Gas-free · One per wallet
                  </p>
                </div>
              </div>
            )}

            {/* ── Signed in, no wallet: onboarding ── */}
            {isLoaded && isSignedIn && !hasWallet && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      Signed in as {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                    Create your{" "}
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Starknet wallet
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Set a PIN to secure your invisible wallet. No seed phrases, no gas fees — just a
                    number you'll remember.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Choose a wallet PIN</p>
                      <p className="text-xs text-muted-foreground">6–12 digits · Numbers only</p>
                    </div>
                  </div>

                  <PinInput
                    value={walletPin}
                    onChange={(v) => { setWalletPin(v); setWalletPinError(null); }}
                    visible={walletPinVisible}
                    onToggleVisible={() => setWalletPinVisible((x) => !x)}
                    placeholder="e.g. 123456"
                    error={walletPinError}
                  />

                  {walletCreateError && (
                    <p className="text-xs text-destructive font-medium flex items-start gap-1">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {walletCreateError}
                    </p>
                  )}

                  <Button
                    size="lg"
                    className="w-full rounded-xl h-11 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                    onClick={handleCreateWallet}
                    disabled={isCreatingWallet || walletPin.length < 6}
                  >
                    {isCreatingWallet ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating wallet…
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        Create wallet &amp; continue
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    ⚠️ Your PIN cannot be recovered. Store it somewhere safe.
                  </p>
                </div>
              </div>
            )}

            {/* ── Has wallet: mint flow ── */}
            {isLoaded && isSignedIn && hasWallet && (
              <div className="space-y-7">
                {/* Header — shown on all sub-steps */}
                {mintStep !== "success" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Genesis Collection
                      </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                      Claim your{" "}
                      <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Genesis NFT
                      </span>
                    </h1>
                  </div>
                )}

                {/* ── Ready ── */}
                {mintStep === "ready" && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Full app launches in
                      </p>
                      <LaunchCountdown />
                      <p className="text-xs text-muted-foreground">March 14, 2026 · Starknet Mainnet</p>
                    </div>
                    <PerksGrid />
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                        onClick={() => setMintStep("enter-pin")}
                        disabled={!MINT_CONTRACT}
                      >
                        <Sparkles className="h-4 w-4" />
                        {MINT_CONTRACT ? "Claim Genesis NFT — Free" : "Mint opening soon"}
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Limited edition · One per wallet · Gas fees sponsored
                      </p>
                    </div>
                  </>
                )}

                {/* ── Enter PIN ── */}
                {mintStep === "enter-pin" && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                      <div>
                        <p className="font-semibold mb-1">Confirm with your wallet PIN</p>
                        <p className="text-sm text-muted-foreground">
                          Enter the PIN you set when creating your wallet. This authorises the free mint.
                        </p>
                      </div>

                      {/* Transaction summary */}
                      <div className="rounded-lg bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">NFT</span>
                        <span className="font-medium">Medialane Genesis</span>
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-medium text-emerald-400">Free</span>
                        <span className="text-muted-foreground">Gas</span>
                        <span className="font-medium text-emerald-400">Sponsored</span>
                        <span className="text-muted-foreground">Network</span>
                        <span className="font-medium">Starknet</span>
                      </div>

                      <PinInput
                        value={mintPin}
                        onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                        visible={mintPinVisible}
                        onToggleVisible={() => setMintPinVisible((x) => !x)}
                        placeholder="Your wallet PIN"
                        error={mintPinError}
                      />

                      <div className="flex gap-2">
                        <Button
                          size="lg"
                          className="flex-1 rounded-xl h-11 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                          onClick={handleMint}
                          disabled={mintPin.length < 6}
                        >
                          <Sparkles className="h-4 w-4" />
                          Mint now
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
                  </div>
                )}

                {/* ── Minting ── */}
                {mintStep === "minting" && (
                  <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Minting your Genesis NFT…</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {mintStatusMsg || statusMessage || "Please wait…"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {[
                        { label: "Upload metadata", done: status !== "idle" },
                        { label: "Submit transaction", done: status === "confirming" || status === "confirmed" },
                        { label: "Confirm on Starknet", done: status === "confirmed" },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                          )}
                          <span className={done ? "text-foreground" : ""}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Success ── */}
                {mintStep === "success" && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                          Genesis Collection
                        </span>
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                        You&apos;re{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          in!
                        </span>
                      </h1>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-300 text-lg">Genesis NFT claimed!</p>
                          <p className="text-sm text-muted-foreground">
                            You&apos;re part of the Medialane genesis community.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Droplets className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Airdrop eligible — you&apos;ll receive future ML token distributions</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Ownership recorded on Starknet mainnet — immutable forever</span>
                        </div>
                      </div>

                      {completedTxHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${completedTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <span className="font-mono">
                            {completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}
                          </span>
                          <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Full platform launches in
                      </p>
                      <LaunchCountdown />
                    </div>
                  </div>
                )}

                {/* ── Error ── */}
                {mintStep === "error" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Mint failed</p>
                          {(mintError || txError) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {mintError || txError}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try again
                      </Button>
                    </div>
                    <PerksGrid />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

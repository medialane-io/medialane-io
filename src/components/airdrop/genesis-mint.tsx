"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useSessionKey } from "@/hooks/use-session-key";
import { usePasskeyAuth, usePasskeyStatus } from "@chipi-stack/chipi-passkey/hooks";
import { serializeByteArray } from "@/lib/cairo-calldata";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { looksLikeEncryptionFailure } from "@/lib/chipi/looks-like-encryption-failure";
import { WalletSetupChoiceDialog } from "@/components/chipi/wallet-setup-choice-dialog";
import { EXPLORER_URL, MINT_CONTRACT, MINT_NFT_URI, MINT_NFT_IMAGE_URL } from "@/lib/constants";

// ─── Featured airdrop image ────────────────────────────────────────────────────

export function AirdropEventCard() {
  const [errored, setErrored] = useState(false);
  const src = MINT_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl shadow-black/10 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 flex flex-col items-center justify-center gap-3">
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

// ─── Genesis Mint ─────────────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

export function GenesisMint() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { executeTransaction, status, error: txError, reset } = useChipiTransaction();
  const { resolvedTheme } = useTheme();

  const { status: { hasPasskey, isSupported: passkeySupported } } = usePasskeyStatus();
  const { authenticate, encryptKey } = usePasskeyAuth();

  const [authMethod, setAuthMethod] = useState<"pin" | "passkey">("pin");
  const [encryptionMismatch, setEncryptionMismatch] = useState<"pin" | "passkey" | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const autoOpenedSetupRef = useRef(false);

  useEffect(() => {
    if (passkeySupported && hasPasskey) setAuthMethod("passkey");
  }, [passkeySupported, hasPasskey]);

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintPin, setMintPin] = useState("");
  const [mintPinError, setMintPinError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  const userId = user?.id;
  const storageKey = userId ? `ml_mint_${userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) { setCompletedTxHash(stored); setMintStep("success"); }
  }, [storageKey]);

  // `addressOverride` is supplied by the setup-dialog auto-progress path —
  // useSessionKey() lags one render behind the wallet creation, so reading
  // walletAddress from closure would race and we'd throw "Account not
  // found" right after a successful wallet setup.
  const executeMint = useCallback(async (key: string, addressOverride?: string) => {
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparing your record…");

    try {
      const address = addressOverride ?? walletAddress;
      if (!address) throw new Error("Account not found. Please try again.");
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
      const calldata = [address, ...serializeByteArray(tokenUri)];

      const result = await executeTransaction({
        pin: key,
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
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMintStep("error");
      setMintError(msg);
      if (looksLikeEncryptionFailure(msg)) {
        setEncryptionMismatch(authMethod === "pin" ? "passkey" : "pin");
      }
    }
  }, [walletAddress, storageKey, executeTransaction, authMethod]);

  const handleClaim = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setEncryptionMismatch(null);
    await executeMint(mintPin);
  }, [mintPin, executeMint]);

  const handleClaimWithPasskey = useCallback(async () => {
    setMintError(null);
    setEncryptionMismatch(null);
    try {
      const key = encryptKey ?? await authenticate();
      if (!key) throw new Error("Passkey authentication failed. Please try again.");
      await executeMint(key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMintStep("error");
      setMintError(msg);
      if (looksLikeEncryptionFailure(msg)) setEncryptionMismatch("pin");
    }
  }, [encryptKey, authenticate, executeMint]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setEncryptionMismatch(null);
    setMintStep("ready");
  };

  const handleSwitchMethod = (target: "pin" | "passkey") => {
    setAuthMethod(target);
    setEncryptionMismatch(null);
    setMintError(null);
    setMintPin("");
    setMintPinError(null);
    setMintStep("enter-pin");
  };

  const handleResetMintGate = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setCompletedTxHash(null);
    setMintStep("ready");
  }, [storageKey]);

  // Auto-open the wallet setup dialog as soon as a freshly-signed-up user
  // lands with no wallet — saves an extra "Claim my spot" click on the
  // onboarding path. autoOpenedSetupRef makes this fire once: if the
  // user dismisses the dialog, they get the CTA back instead of being
  // looped back into it.
  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn &&
      !isLoadingWallet &&
      !hasWallet &&
      !setupOpen &&
      !autoOpenedSetupRef.current &&
      mintStep === "ready"
    ) {
      autoOpenedSetupRef.current = true;
      setSetupOpen(true);
    }
  }, [isLoaded, isSignedIn, isLoadingWallet, hasWallet, setupOpen, mintStep]);

  const handleMintCta = () => {
    if (!hasWallet) {
      setSetupOpen(true);
      return;
    }
    // Returning passkey users: tap CTA → Face ID immediately. PIN users
    // still need to type, so we drop into the enter-pin UI.
    if (authMethod === "passkey" && passkeySupported) {
      handleClaimWithPasskey();
      return;
    }
    setMintStep("enter-pin");
  };

  // The setup dialog hands back the encryption key + the new wallet
  // address — reuse both to fire the mint immediately. We pass the
  // address explicitly because useSessionKey() is one render behind
  // the wallet creation that just happened inside the dialog.
  const handleSetupDone = (encryptKey: string, newWalletAddress: string) => {
    setSetupOpen(false);
    executeMint(encryptKey, newWalletAddress);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!isLoaded || (isLoaded && isSignedIn && isLoadingWallet)) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex justify-center sm:justify-start">
        <SignUp
          routing="hash"
          signInUrl="/mint"
          forceRedirectUrl="/mint"
          appearance={{
            baseTheme: resolvedTheme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-none border border-border/40 bg-card/30 rounded-2xl",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4 shadow-lg shadow-black/5">
      {mintStep === "ready" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {hasWallet ? "Account active — mint your passport" : "You're all set. Claim your spot."}
            </span>
          </div>
          <div className="btn-border-animated p-[1px] rounded-2xl">
            <Button
              size="lg"
              className="w-full h-12 font-bold gap-2 bg-transparent text-white rounded-[15px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              onClick={handleMintCta}
              disabled={!MINT_CONTRACT}
            >
              <Sparkles className="h-4 w-4" />
              {MINT_CONTRACT ? "Claim my spot" : "Airdrop not started yet"}
            </Button>
          </div>
        </div>
      )}

      {mintStep === "enter-pin" && (
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm">Mint your genesis NFT</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {authMethod === "passkey" ? "Confirm with your passkey." : "Enter your security PIN."}
            </p>
          </div>
          {authMethod === "passkey" ? (
            <div className="flex gap-2">
              <Button size="lg" className="flex-1 h-11 font-bold gap-2" onClick={handleClaimWithPasskey}>
                <ShieldCheck className="h-4 w-4" />
                Confirm with Passkey
              </Button>
              <Button size="lg" variant="outline" className="h-11" onClick={() => setMintStep("ready")}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
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
                  Confirm with PIN
                </Button>
                <Button size="lg" variant="outline" className="h-11" onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}>
                  Cancel
                </Button>
              </div>
            </>
          )}
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
              { label: "Preparing your record", done: status !== "idle" },
              { label: "Submitting", done: status === "confirming" || status === "confirmed" },
              { label: "Confirmed", done: status === "confirmed" },
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
              <Link href="/create/asset">Create</Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link href="/marketplace">Explore</Link>
            </Button>
          </div>
          <button className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center" onClick={handleResetMintGate}>
            Didn&apos;t mint your passport? Try again
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
          {encryptionMismatch && (encryptionMismatch === "pin" || passkeySupported) && (
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive/90">
                {encryptionMismatch === "passkey"
                  ? "Looks like your account uses passkey. Try with Face ID / Touch ID."
                  : "Looks like your account uses a PIN. Try with your security code."}
              </p>
              <Button size="sm" className="gap-2" onClick={() => handleSwitchMethod(encryptionMismatch)}>
                {encryptionMismatch === "passkey"
                  ? (<><ShieldCheck className="h-3.5 w-3.5" /> Use Passkey</>)
                  : "Use PIN"}
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

      <WalletSetupChoiceDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSuccess={handleSetupDone}
        locale="en"
      />
    </div>
  );
}

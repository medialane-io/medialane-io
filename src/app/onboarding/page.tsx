"use client";

import { useState, useCallback, Suspense } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useChipiWallet, useGetWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
import { byteArray, CallData } from "starknet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { completeOnboarding } from "./_actions";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { LAUNCH_MINT_CONTRACT, GENESIS_NFT_URI } from "@/lib/constants";

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const { session } = useClerk();
  const searchParams = useSearchParams();
  // Onboarding always ends at /welcome — ignore any redirect_url for the mint flow
  void searchParams;

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet, isCreating } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: false,
  });

  const { fetchWallet } = useGetWallet();
  const { executeTransaction } = useChipiTransaction();

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"pin" | "minting" | "done">("pin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isCreating || isSubmitting;

  // ── Shared wallet creation + mint ─────────────────────────────────────────

  const createWalletWithKey = async (encryptKey: string) => {
    const wallet = await createWallet({ encryptKey });
    const walletKey = wallet.normalizedPublicKey ?? wallet.publicKey;
    if (!walletKey) {
      throw new Error("Wallet creation returned invalid data");
    }

    const result = await completeOnboarding({ publicKey: walletKey });
    if (result.error) throw new Error(result.error);

    await user?.reload();
    await session?.touch();

    // ── Genesis mint (non-blocking) ──────────────────────────────────────
    if (LAUNCH_MINT_CONTRACT && GENESIS_NFT_URI && userId) {
      setStep("minting");
      try {
        // createWallet() response may omit encryptedPrivateKey — fetch to ensure we have it
        let encryptedPrivateKey = wallet.encryptedPrivateKey;
        if (!encryptedPrivateKey) {
          const fetched = await fetchWallet({
            params: { externalUserId: userId },
            getBearerToken,
          });
          encryptedPrivateKey = fetched?.encryptedPrivateKey ?? "";
        }

        if (!encryptedPrivateKey) {
          throw new Error("Could not retrieve wallet credentials for mint");
        }

        const encodedUri = byteArray.byteArrayFromString(GENESIS_NFT_URI);
        const calldata = CallData.compile([walletKey, encodedUri]);
        const mintResult = await executeTransaction({
          pin: encryptKey,
          contractAddress: LAUNCH_MINT_CONTRACT,
          wallet: {
            publicKey: wallet.publicKey,
            encryptedPrivateKey,
          },
          calls: [
            {
              contractAddress: LAUNCH_MINT_CONTRACT,
              entrypoint: "mint_item",
              calldata,
            },
          ],
        });
        if (mintResult.status === "confirmed") {
          localStorage.setItem(`ml_genesis_${userId}`, mintResult.txHash);
        }
      } catch {
        // Non-fatal — LaunchMint on /welcome handles retry
      }
    }

    sessionStorage.setItem("ml_fresh_onboarding", "1");
    setStep("done");
    setTimeout(() => { window.location.href = "/welcome"; }, 1500);
  };

  // ── Passkey flow ──────────────────────────────────────────────────────────

  const handlePasskeySetup = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const userName =
        user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "user";
      const { encryptKey } = await createWalletPasskey(user?.id ?? "", userName);
      await createWalletWithKey(encryptKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Passkey setup failed";
      setError(msg);
      setShowPinFallback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── PIN flow ──────────────────────────────────────────────────────────────

  const handlePinCreate = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setIsSubmitting(true);
    setError(null);
    try {
      await createWalletWithKey(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to secure your account. Please try again.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Minting step ──────────────────────────────────────────────────────────

  if (step === "minting") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <CardTitle>Sending your welcome gift…</CardTitle>
            <CardDescription>Minting your Genesis NFT on Starknet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pb-6">
            {["Upload metadata", "Submit transaction", "Confirm on Starknet"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs text-muted-foreground justify-center"
              >
                <div className="h-3 w-3 rounded-full border border-muted-foreground/30 animate-pulse shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Done state ────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <CardTitle>You&apos;re all set!</CardTitle>
            <CardDescription>Taking you to your welcome page…</CardDescription>
          </CardHeader>
          <div className="flex justify-center pb-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </Card>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <CardTitle>Securing your account…</CardTitle>
            <CardDescription>This takes just a second.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const usePasskeyUI = passkeySupported && !showPinFallback;

  // ── PIN / Passkey UI ──────────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Secure your account</CardTitle>
          <CardDescription>
            {usePasskeyUI
              ? "Use Face ID, Touch ID, or your device unlock to protect your account. Fast and effortless."
              : "Create a 6-digit security PIN. You'll use it to authorize transactions — we never store it."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {usePasskeyUI ? (
            <div className="w-full space-y-3">
              <Button className="w-full gap-2" size="lg" onClick={handlePasskeySetup}>
                <KeyRound className="h-4 w-4" />
                Secure with passkey
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-sm"
                onClick={() => { setShowPinFallback(true); setError(null); }}
              >
                Use a security PIN instead
              </Button>
            </div>
          ) : (
            <>
              <PinInput
                value={pin}
                onChange={(v) => { setPin(v); setPinError(null); }}
                error={pinError}
                autoFocus
              />
              <div className="flex w-full gap-2">
                <Button
                  className="flex-1"
                  disabled={pin.length < 6}
                  onClick={handlePinCreate}
                >
                  Secure my account
                </Button>
              </div>
              {passkeySupported && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                  onClick={() => { setShowPinFallback(false); setError(null); setPin(""); setStep("pin"); }}
                >
                  Use passkey instead
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

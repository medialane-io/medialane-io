"use client";

import { useState, useCallback, Suspense } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey, WalletType, WalletData } from "@chipi-stack/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { completeOnboarding } from "./_actions";

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
  const raw = searchParams.get("redirect_url") || "/portfolio";
  const redirectUrl =
    raw.startsWith("http") &&
    !raw.startsWith(process.env.NEXT_PUBLIC_APP_URL || "https://medialane.io")
      ? "/portfolio"
      : raw;

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet, isCreating } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: false,
  });

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmPinError, setConfirmPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"pin" | "confirm" | "done">("pin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isCreating || isSubmitting;

  // ── Shared wallet creation ────────────────────────────────────────────────

  const createWalletWithKey = async (encryptKey: string) => {
    const wallet = await createWallet({ encryptKey });
    // ChipiPay API may return the address as `walletPublicKey` or `publicKey`
    
    const walletKey = wallet.normalizedPublicKey ?? wallet.publicKey;
    if (!walletKey) {
      throw new Error("Wallet creation returned invalid data");
    }

    const result = await completeOnboarding({
      publicKey: walletKey,
    });

    if (result.error) throw new Error(result.error);

    await user?.reload();
    await session?.touch();

    setStep("done");
    // Use full page navigation so the browser fetches a fresh Clerk JWT before
    // the middleware runs — router.push reuses the cached token and the middleware
    // would see stale claims (walletCreated still false) and redirect back here.
    setTimeout(() => { window.location.href = redirectUrl; }, 1500);
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

  const handlePinNext = () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setStep("confirm");
  };

  const handlePinCreate = async () => {
    if (pin !== confirmPin) {
      setConfirmPinError("PINs do not match. Please try again.");
      return;
    }
    setConfirmPinError(null);
    setIsSubmitting(true);
    setError(null);
    try {
      await createWalletWithKey(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet. Please try again.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <CardTitle>Wallet ready!</CardTitle>
            <CardDescription>Taking you to your portfolio…</CardDescription>
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
            <CardTitle>Creating your wallet…</CardTitle>
            <CardDescription>Securing your account. This takes just a second.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const usePasskeyUI = passkeySupported && !showPinFallback;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Create your wallet</CardTitle>
          <CardDescription>
            {usePasskeyUI
              ? "Your invisible Starknet wallet is protected by a passkey — works with Face ID, Touch ID, or your device PIN."
              : step === "confirm"
              ? "Re-enter your PIN to confirm."
              : "Choose a 6–12 digit PIN to protect your wallet. Store it safely — we never store it."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Passkey-first UI ── */}
          {usePasskeyUI ? (
            <div className="w-full space-y-3">
              <Button className="w-full gap-2" size="lg" onClick={handlePasskeySetup}>
                <KeyRound className="h-4 w-4" />
                Continue with passkey
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-sm"
                onClick={() => { setShowPinFallback(true); setError(null); }}
              >
                Use a PIN instead
              </Button>
            </div>
          ) : (
            /* ── PIN UI ── */
            <>
              <PinInput
                value={step === "confirm" ? confirmPin : pin}
                onChange={step === "confirm"
                  ? (v) => { setConfirmPin(v); setConfirmPinError(null); }
                  : (v) => { setPin(v); setPinError(null); }
                }
                error={step === "confirm" ? confirmPinError : pinError}
                autoFocus
              />

              <div className="flex w-full gap-2">
                {step === "confirm" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setStep("pin"); setConfirmPin(""); setConfirmPinError(null); setError(null); }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1"
                  disabled={step === "pin" ? pin.length < 6 : confirmPin.length < 6}
                  onClick={step === "pin" ? handlePinNext : handlePinCreate}
                >
                  {step === "confirm" ? "Create wallet" : "Next"}
                </Button>
              </div>

              {passkeySupported && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                  onClick={() => { setShowPinFallback(false); setError(null); setPin(""); setConfirmPin(""); setStep("pin"); }}
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

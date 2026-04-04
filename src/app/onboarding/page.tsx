"use client";

import { useState, useCallback, Suspense } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
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
  const fromBr = searchParams.get("from") === "br";

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
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"pin" | "done">("pin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isCreating || isSubmitting;

  // ── Wallet creation ───────────────────────────────────────────────────────

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

    sessionStorage.setItem("ml_fresh_onboarding", "1");
    setStep("done");
    setTimeout(() => { window.location.href = fromBr ? "/br/mint" : "/welcome"; }, 1500);
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

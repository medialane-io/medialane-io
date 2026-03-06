"use client";

import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useChipiWallet } from "@chipi-stack/nextjs";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { completeOnboarding } from "./_actions";

export default function OnboardingPage() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const { session } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/portfolio";

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet, isCreating } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: false,
  });

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"pin" | "confirm" | "done" | "error">("pin");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      setStep("pin");
      setPin("");
      setConfirmPin("");
      return;
    }

    setError(null);

    try {
      const wallet = await createWallet({ encryptKey: pin });
      if (!wallet?.publicKey || !wallet?.encryptedPrivateKey) {
        throw new Error("Wallet creation returned invalid data");
      }

      const result = await completeOnboarding({
        publicKey: wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
      });

      if (result.error) throw new Error(result.error);

      // Reload user so Clerk metadata is fresh, then touch session so middleware JWT updates
      await user?.reload();
      await session?.touch();

      setStep("done");

      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create wallet. Please try again.");
      setStep("error");
    }
  };

  const isLoading = isCreating || step === "done";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {step === "done" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Wallet className="h-6 w-6 text-primary" />
              )}
            </div>
          </div>
          <CardTitle>
            {step === "done" ? "Wallet ready!" : "Create your wallet"}
          </CardTitle>
          <CardDescription>
            {step === "done"
              ? "Your invisible Starknet wallet is set up. Redirecting…"
              : step === "confirm"
              ? "Re-enter your PIN to confirm."
              : "Set a 4-digit PIN to protect your gasless Starknet wallet. Store it safely — we never store it."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {isLoading && step !== "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Creating your wallet…</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-muted-foreground">Taking you to your portfolio…</p>
            </div>
          )}

          {!isLoading && step !== "done" && (
            <>
              {error && (
                <Alert variant="destructive" className="w-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <InputOTP
                maxLength={4}
                value={step === "confirm" ? confirmPin : pin}
                onChange={step === "confirm" ? setConfirmPin : setPin}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="off"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>

              <div className="flex w-full gap-2 mt-2">
                {step === "confirm" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setStep("pin"); setConfirmPin(""); setError(null); }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1"
                  disabled={step === "pin" ? pin.length !== 4 : confirmPin.length !== 4}
                  onClick={step === "pin" ? () => setStep("confirm") : handleCreate}
                >
                  {step === "confirm" ? "Create wallet" : "Next"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { completeWalletDeployment } from "@/lib/wallet/complete-deployment";
import { getMedialaneClient } from "@/lib/medialane-client";
import { fireConfetti } from "@/lib/confetti";

type Step = "creating-passkey" | "deploying" | "signing-in" | "done" | "error";

function safeRelative(path: string | null | undefined, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export default function WalletOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <WalletOnboardingForm />
    </Suspense>
  );
}

function WalletOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRelative(searchParams.get("redirect_url"), "/airdrop");
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const runOnboarding = async () => {
    setError(null);
    try {
      const { siwsToken } = await completeWalletDeployment(setStep);

      const pendingAccountToken = sessionStorage.getItem("ml_pending_account_token");
      if (pendingAccountToken) sessionStorage.removeItem("ml_pending_account_token");
      await getMedialaneClient().api.upsertMyWallet(siwsToken, {
        walletType: "MEDIAWALLET",
        appSource: "MEDIALANE_IO",
        chain: "STARKNET",
        ...(pendingAccountToken ? { accountToken: pendingAccountToken } : {}),
      });

      fireConfetti();
      setStep("done");
      setTimeout(() => router.push(redirectTo), 1600);
    } catch {

      setError("Something went wrong setting up your account. Please try again.");
      setStep("error");
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runOnboarding();

  }, []);

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
            <CardDescription>Your account is ready.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isWorking = step === null || step === "creating-passkey" || step === "deploying" || step === "signing-in";

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
          <CardDescription>Use your passkey, Face ID, or Touch ID to create your unique access.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isWorking && (
            <div className="flex w-full items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {(step === null || step === "creating-passkey") && "Creating passkey…"}
              {step === "deploying" && "Setting up your wallet…"}
              {step === "signing-in" && "Signing in…"}
            </div>
          )}
          {step === "error" && (
            <div className="btn-border-animated w-full p-[1px] rounded-lg">
              <Button
                className="w-full gap-2 bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
                size="lg"
                onClick={runOnboarding}
              >
                Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

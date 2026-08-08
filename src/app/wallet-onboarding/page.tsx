"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { completeWalletDeployment } from "@/lib/wallet/complete-deployment";
import { getMedialaneClient } from "@/lib/medialane-client";

type Step = "creating-passkey" | "deploying" | "signing-in" | "done" | "error";

/** Same-origin relative path guard — prevents open redirects via redirect_url. */
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
  const redirectTo = safeRelative(searchParams.get("redirect_url"), "/welcome");
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const runOnboarding = async () => {
    setError(null);
    try {
      const { siwsToken } = await completeWalletDeployment(setStep);
      await getMedialaneClient().api.upsertMyWallet(siwsToken, {
        walletType: "MEDIAWALLET",
        appSource: "MEDIALANE_IO",
        chain: "STARKNET",
      });
      setStep("done");
    } catch {
      // Never surface raw backend/SDK error text here — it can contain
      // technical language ("wallet", "Starknet", "deploy") this flow is
      // deliberately designed to keep invisible to non-crypto users. One
      // plain message, always; "Try again" safely resumes from wherever it
      // stopped (runOnboarding reuses the existing local key if present).
      setError("Something went wrong setting up your wallet. Please try again.");
      setStep("error");
    }
  };

  // Auto-start on arrival — no confirm click. A hard one-shot guard (ref, not
  // state) prevents the double-fire that broke this before (2026-08-06,
  // commit 07b30af): React can run this effect more than once (StrictMode,
  // fast refresh), and each run must never be allowed to call
  // navigator.credentials.create() again once one is already in flight —
  // that's what stacked overlapping native dialogs last time. If the
  // browser has no live user-activation to satisfy WebAuthn (e.g. this URL
  // opened with no prior gesture at all), createOwnerKey() throws
  // PasskeyCancelledError, caught below, landing on "error" with a real
  // click to retry — the only path a click is ever required on this page.
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
            <CardDescription>Your wallet is ready.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push(redirectTo)}>
              Continue
            </Button>
          </CardContent>
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
          <CardTitle>Set up your wallet</CardTitle>
          <CardDescription>Passkey, Face ID, Touch ID.</CardDescription>
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

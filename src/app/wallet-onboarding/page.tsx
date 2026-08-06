"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { createOwnerKey, signWith, type SealedOwner } from "@/lib/wallet/passkey";
import { saveSealedOwner } from "@/lib/wallet/store";
import { deployWalletViaRelay } from "@/lib/wallet/deploy-relay";
import { requestSiwsToken } from "@medialane/sdk/starknet";
import { typedData as starknetTypedData } from "starknet";

type Step = "start" | "creating-passkey" | "deploying" | "signing-in" | "done" | "error";

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
  const [step, setStep] = useState<Step>("start");
  const [error, setError] = useState<string | null>(null);

  const runOnboarding = async () => {
    setError(null);
    try {
      setStep("creating-passkey");
      const sealed: SealedOwner = await createOwnerKey();
      saveSealedOwner(sealed);

      setStep("deploying");
      // Deploy MUST complete before SIWS — SIWS verify rejects counterfactual
      // (not-yet-deployed) accounts. See the design spec's Global Constraints.
      await deployWalletViaRelay(sealed.ownerPubKey);

      setStep("signing-in");
      await requestSiwsToken({
        backendUrl: "/api/proxy",
        walletAddress: sealed.address,
        signer: {
          signMessage: (td) =>
            signWith(sealed, starknetTypedData.getMessageHash(td, sealed.address)),
        },
      });

      // Guardian setup is intentionally NOT run here yet — the non-custodial
      // guardian co-signer service this depends on is separate, unbuilt
      // infrastructure (design spec §8, "do not imply recovery before it
      // lands"). Do not add a "your account is recoverable" claim to this
      // flow's copy until that service exists and is wired in.

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("error");
    }
  };

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
          <CardContent>
            <Button className="w-full" onClick={() => router.push(redirectTo)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isWorking = step === "creating-passkey" || step === "deploying" || step === "signing-in";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Passkey, Face ID, Touch ID.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full gap-2" size="lg" onClick={runOnboarding} disabled={isWorking}>
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {step === "creating-passkey" && "Creating passkey…"}
            {step === "deploying" && "Setting up your account…"}
            {step === "signing-in" && "Signing in…"}
            {(step === "start" || step === "error") && "Get started"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

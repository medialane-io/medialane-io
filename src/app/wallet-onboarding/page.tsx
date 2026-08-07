"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { completeWalletDeployment } from "@/lib/wallet/complete-deployment";
import { getMedialaneClient } from "@/lib/medialane-client";

type Step = "email" | "checking-email" | "registering" | "code" | "verifying-code" | "creating-passkey" | "deploying" | "signing-in" | "done" | "error";

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
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const continueWithEmail = async () => {
    setError(null);
    setStep("checking-email");
    try {
      const exists = await getMedialaneClient().api.checkEmailExists(email);
      if (exists) {
        // Returning user — this becomes a login attempt, not a dead end.
        await requestLoginCode();
        return;
      }
      await registerNewAccount();
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("email");
    }
  };

  const registerNewAccount = async () => {
    setStep("registering");
    try {
      const res = await fetch("/api/proxy/v1/auth/email/register-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("register-account failed");
      const data = await res.json() as { accountToken: string };
      sessionStorage.setItem("ml_pending_account_token", data.accountToken);
      void runOnboarding();
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("email");
    }
  };

  const requestLoginCode = async () => {
    try {
      const res = await fetch("/api/proxy/v1/auth/email/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("request-code failed");
      setStep("code");
    } catch {
      setError("Couldn't send the code. Please try again.");
      setStep("email");
    }
  };

  const verifyLoginCode = async () => {
    setError(null);
    setStep("verifying-code");
    try {
      const res = await fetch("/api/proxy/v1/auth/email/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Incorrect code");
      const { accountToken } = data as { accountToken?: string };
      if (accountToken) {
        // Walletless account — resume straight into wallet onboarding.
        sessionStorage.setItem("ml_pending_account_token", accountToken);
        void runOnboarding();
      } else {
        // This account already has a wallet — the code only proved email
        // ownership, it can never grant access to that wallet (design
        // spec §6). Nothing more to do here on this device.
        setStep("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code. Please try again.");
      setStep("code");
    }
  };

  const runOnboarding = async () => {
    setError(null);
    try {
      const { siwsToken } = await completeWalletDeployment(setStep);

      // Attach the wallet to the account created at the email step
      // directly, right here — not deferred to AccountSyncOnLogin firing
      // on some later page load. That deferred pattern is exactly what
      // made today's earlier bugs invisible until it was too late (design
      // spec §1). AccountSyncOnLogin still exists for other entry points;
      // this completion no longer depends on it.
      const pendingAccountToken = sessionStorage.getItem("ml_pending_account_token");
      if (pendingAccountToken) sessionStorage.removeItem("ml_pending_account_token");
      await getMedialaneClient().api.upsertMyWallet(siwsToken, {
        walletType: "MEDIAWALLET",
        appSource: "MEDIALANE_IO",
        chain: "STARKNET",
        ...(pendingAccountToken ? { accountToken: pendingAccountToken } : {}),
      });

      // Guardian setup is intentionally NOT run here yet — the non-custodial
      // guardian co-signer service this depends on is separate, unbuilt
      // infrastructure (design spec §8, "do not imply recovery before it
      // lands"). Do not add a "your account is recoverable" claim to this
      // flow's copy until that service exists and is wired in.

      setStep("done");
    } catch {
      // Never surface raw backend/SDK error text here — it can contain
      // technical language ("wallet", "Starknet", "deploy") this flow is
      // deliberately designed to keep invisible to non-crypto users. One
      // plain message, always; "Try again" safely resumes from wherever it
      // stopped (runOnboarding reuses the existing local key if present).
      setError("Something went wrong setting up your account. Please try again.");
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

  if (step === "email" || step === "checking-email" || step === "registering") {
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
            <CardDescription>Enter your email to get started.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === "checking-email" || step === "registering"}
              className="w-full"
            />
            <div className="btn-border-animated w-full p-[1px] rounded-lg">
              <Button
                className="w-full gap-2 bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
                size="lg"
                onClick={continueWithEmail}
                disabled={step === "checking-email" || step === "registering" || !email}
              >
                {step === "checking-email" || step === "registering" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "code" || step === "verifying-code") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>Enter the 6-digit code we sent to {email}.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={step === "verifying-code"}
              className="w-full text-center tracking-[0.5em]"
            />
            <div className="btn-border-animated w-full p-[1px] rounded-lg">
              <Button
                className="w-full gap-2 bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
                size="lg"
                onClick={verifyLoginCode}
                disabled={step === "verifying-code" || code.length !== 6}
              >
                {step === "verifying-code" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify
              </Button>
            </div>
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
          {isWorking ? (
            <div className="flex w-full items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {step === "creating-passkey" && "Creating passkey…"}
              {step === "deploying" && "Setting up your account…"}
              {step === "signing-in" && "Signing in…"}
            </div>
          ) : (
            <div className="btn-border-animated w-full p-[1px] rounded-lg">
              <Button
                className="w-full gap-2 bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
                size="lg"
                onClick={runOnboarding}
              >
                {step === "error" ? "Try again" : "Get started"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

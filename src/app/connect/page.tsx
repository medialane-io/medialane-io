"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { getMedialaneClient } from "@/lib/medialane-client";
import { JourneyPanel } from "@/components/connect/journey-panel";
import { ValuePropCarousel } from "@/components/connect/value-prop-carousel";

type Step = "email" | "checking-email" | "registering" | "code" | "verifying-code" | "has-wallet";

/** Same-origin relative path guard — prevents open redirects via redirect_url. */
function safeRelative(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectForm />
    </Suspense>
  );
}

/**
 * Account entry point — process 1 (register, unverified email) and process 3
 * (email-registered users get a login code). Deliberately knows nothing
 * about wallets: on success it hands off to /wallet-onboarding (process 2),
 * which owns passkey creation + AVNU-sponsored deploy entirely on its own.
 * Named /connect, not /sign-up, because we don't yet know whether this
 * visitor has an account — the email step is what determines that.
 */
function ConnectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRelative(searchParams.get("redirect_url"));
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const goToWalletOnboarding = (accountToken: string) => {
    sessionStorage.setItem("ml_pending_account_token", accountToken);
    router.push(`/wallet-onboarding${redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : ""}`);
  };

  const continueWithEmail = async () => {
    setError(null);
    setStep("checking-email");
    try {
      const exists = await getMedialaneClient().api.checkEmailExists(email);
      if (exists) {
        await requestLoginCode();
      } else {
        await registerNewAccount();
      }
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
      goToWalletOnboarding(data.accountToken);
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
        // Walletless account — hand off straight to wallet deployment.
        goToWalletOnboarding(accountToken);
      } else {
        // This account already has a wallet — the code only proved email
        // ownership, it can never grant access to that wallet (design
        // spec §6). That wallet's own device/passkey is the only way in.
        setStep("has-wallet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code. Please try again.");
      setStep("code");
    }
  };

  if (step === "has-wallet") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <CardTitle>This account already has a wallet</CardTitle>
            <CardDescription>
              Open Medialane on the device where you set it up, and it will sign you in automatically with your passkey.
            </CardDescription>
          </CardHeader>
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Card className="w-full">
          <CardHeader className="text-center gap-4">
            <JourneyPanel />
            <div>
              <CardTitle>Start your creator journey</CardTitle>
              <CardDescription>Enter your email to begin.</CardDescription>
            </div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && email) void continueWithEmail();
              }}
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
        <ValuePropCarousel />
      </div>
    </div>
  );
}

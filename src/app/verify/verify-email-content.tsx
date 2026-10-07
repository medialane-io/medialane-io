"use client";

import { EmailCodeEntry, describeError } from "@medialane/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEmailCode } from "@/hooks/use-email-code";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveAccountEmail } from "@/lib/wallet/account-wallet";

type Step = "loading" | "add-email" | "code" | "verified";

export default function VerifyEmailContent() {
  const router = useRouter();
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();

  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailCode = useEmailCode(email);

  useEffect(() => {
    if (!walletAddress) return;
    (async () => {
      const token = getValidToken() ?? (await signIn());
      if (!token) return;
      const result = await getMedialaneClient().api.getMyWallet(token);
      if (result?.email && !result.emailDeadline) {
        setEmail(result.email);
        setStep("verified");
      } else if (result?.email) {
        setEmail(result.email);
        setStep("code");
        void emailCode.send(result.email);
      } else {
        setStep("add-email");
      }
    })();
    
  }, [walletAddress]);

  async function handleAddEmail() {
    const value = emailInput.trim();
    if (!value) return;
    setError(null);
    try {
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");
      const result = await getMedialaneClient().api.changeMyEmail(value, token);
      saveAccountEmail(value);
      setEmail(result.email);
      setStep("code");
      void emailCode.send(result.email);
    } catch (err) {
      setError(describeError(err, "Failed to save email").message);
    }
  }

  const handleVerify = async (code?: string) => {
    if (await emailCode.verify({ code })) setStep("verified");
  };

  if (!hasWallet || step === "loading") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {hasWallet && step === "loading" ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Mail className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
            <CardTitle>{hasWallet ? "Loading…" : "Sign in first"}</CardTitle>
            {!hasWallet && <CardDescription>You need an account before you can verify an email.</CardDescription>}
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === "verified") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <CardTitle>You&apos;re all set</CardTitle>
            <CardDescription>Your email is confirmed. Your account is fully unrestricted.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="btn-border-animated w-full rounded-lg p-[1px]">
              <Button
                className="w-full rounded-[7px] bg-transparent text-white transition-all hover:bg-transparent hover:brightness-110 active:scale-[0.98]"
                size="lg"
                onClick={() => router.back()}
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "add-email") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Add your email</CardTitle>
            <CardDescription>We&apos;ll send a 6-digit code to confirm it&apos;s yours.</CardDescription>
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
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && emailInput.trim() && void handleAddEmail()}
              autoFocus
              className="w-full"
            />
            <div className="btn-border-animated w-full rounded-lg p-[1px]">
              <Button
                className="w-full rounded-[7px] bg-transparent text-white transition-all hover:bg-transparent hover:brightness-110 active:scale-[0.98]"
                size="lg"
                onClick={handleAddEmail}
                disabled={!emailInput.trim()}
              >
                Send code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>Enter the 6-digit code we sent to {email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailCodeEntry emailCode={emailCode} onVerify={(code) => void handleVerify(code)} />
        </CardContent>
      </Card>
    </div>
  );
}

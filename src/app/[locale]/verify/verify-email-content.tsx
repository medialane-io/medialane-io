"use client";

import { EmailCodeEntry, describeError, ActionButton, IconTile } from "@medialane/ui";
import { useState } from "react";
import { useRouter } from "@medialane/ui/router";
import { Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@medialane/ui/utils/use-session";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@medialane/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@medialane/ui/card";
import { Input } from "@medialane/ui/input";
import { useEmailCode } from "@/hooks/use-email-code";
import { useWhenChanged } from "@/hooks/use-when-changed";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { useT } from "@medialane/ui/i18n";

type Step = "loading" | "add-email" | "code" | "verified";

export default function VerifyEmailContent() {
  const t = useT();
  const router = useRouter();
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { session } = useSession();

  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailCode = useEmailCode(email);

  useWhenChanged(walletAddress, () => {
    if (!walletAddress) return;
    (async () => {
      const result = session;
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
  });

  async function handleAddEmail() {
    const value = emailInput.trim();
    if (!value) return;
    setError(null);
    try {
      const result = await getMedialaneClient().api.account.changeMyEmail(value);
      setEmail(result.email);
      setStep("code");
      void emailCode.send(result.email);
    } catch (err) {
      setError(describeError(err).message);
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
            <CardTitle>{hasWallet ? t("Loading…") : t("Sign in first")}</CardTitle>
            {!hasWallet && <CardDescription>{t("You need an account before you can verify an email.")}</CardDescription>}
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
            <CardTitle>{t("You're all set")}</CardTitle>
            <CardDescription>{t("Your email is confirmed. Your account is fully unrestricted.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionButton solid onClick={() => router.back()} className="w-full">
              {t("Done")}
            </ActionButton>
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
              <IconTile>
                <Mail />
              </IconTile>
            </div>
            <CardTitle>{t("Add your email")}</CardTitle>
            <CardDescription>{t("We'll send a 6-digit code to confirm it's yours.")}</CardDescription>
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
              placeholder={t("you@example.com")}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && emailInput.trim() && void handleAddEmail()}
              autoFocus
              className="w-full"
            />
            <ActionButton solid onClick={handleAddEmail} disabled={!emailInput.trim()} className="w-full">
              {t("Send code")}
            </ActionButton>
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
            <IconTile>
              <ShieldCheck />
            </IconTile>
          </div>
          <CardTitle>{t("Verify your email")}</CardTitle>
          <CardDescription>{t("Enter the 6-digit code we sent to {email}.", { email: email ?? "" })}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailCodeEntry emailCode={emailCode} onVerify={(code) => void handleVerify(code)} />
        </CardContent>
      </Card>
    </div>
  );
}

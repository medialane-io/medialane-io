"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getMedialaneClient } from "@/lib/medialane-client";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { adoptAccountWallet, saveAccountEmail } from "@/lib/wallet/account-wallet";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-required";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { fireConfetti } from "@/lib/confetti";
import { MedialaneApiError } from "@medialane/sdk";
import { mediaWallet } from "@/lib/wallet/client";

export type OnboardingStep =
  | "email"
  | "checking-email"
  | "registering"
  | "code"
  | "verifying-code"
  | "add-email"
  | "creating-passkey"
  | "deploying"
  | "signing-in"
  | "done";

export const RESEND_COOLDOWN_SECONDS = 60;

const WALLET_STEPS: OnboardingStep[] = ["creating-passkey", "deploying", "signing-in"];

export function isWalletStep(step: OnboardingStep): boolean {
  return WALLET_STEPS.includes(step);
}

export function walletStepLabel(step: OnboardingStep): string {
  if (step === "deploying") return "Setting up your wallet…";
  if (step === "signing-in") return "Signing in…";
  return "Creating passkey…";
}

const BRAVE_UNSUPPORTED = "Brave can't create passkeys yet. Open medialane.io in Safari or Chrome to join.";
const BROWSER_UNSUPPORTED = "This browser can't create passkeys yet. Open medialane.io in Safari or Chrome to join.";
const GENERIC_FAILURE = "We couldn't finish setting up your account. Please try again.";

export interface WalletFailureNotice {
  message: string;
  canRetry: boolean;
}

export function passkeysUnavailableMessage(): string {
  return BRAVE_UNSUPPORTED;
}

export function describeWalletFailure(err: unknown): WalletFailureNotice {
  const raw = err instanceof Error ? err.message : "";
  if (/brave/i.test(raw)) return { message: BRAVE_UNSUPPORTED, canRetry: false };
  if (/PRF/.test(raw)) return { message: BROWSER_UNSUPPORTED, canRetry: false };
  return { message: GENERIC_FAILURE, canRetry: true };
}

export function browserLacksPasskeys(): boolean {
  return typeof navigator !== "undefined" && "brave" in navigator;
}

export interface OnboardingFlowProps {
  start?: "email" | "wallet";
  onDone?: () => void;
  autoStartWallet?: boolean;
}

export function OnboardingFlow({ start = "email", onDone, autoStartWallet = true }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>(start === "wallet" ? "creating-passkey" : "email");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [canRetry, setCanRetry] = useState(true);
  const [addEmailInput, setAddEmailInput] = useState("");
  const [addEmailSaving, setAddEmailSaving] = useState(false);
  const accountExistedRef = useRef(false);
  const walletStartedRef = useRef(false);

  const { hasWallet } = useWalletNativeSession();
  const emailStatus = useEmailVerificationStatus();
  const { getValidToken, signIn } = useSiwsToken();
  const [mounted, setMounted] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUnsupported(browserLacksPasskeys());
  }, []);

  useEffect(() => {
    if (resendCooldown === 0) return;
    const id = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const finish = useCallback(() => {
    setStep("done");
    onDone?.();
  }, [onDone]);

  const runWalletSetup = useCallback(async () => {
    setError(null);
    setCanRetry(true);
    setStep("creating-passkey");
    try {
      const { siwsToken } = await mediaWallet.completeDeployment((s) => setStep(s as OnboardingStep));
      await getMedialaneClient().api.upsertMyWallet(siwsToken, {
        walletType: "MEDIAWALLET",
        appSource: "MEDIALANE_IO",
        chain: "STARKNET",
      });
      fireConfetti();
      finish();
    } catch (err) {
      if (err instanceof MedialaneApiError && err.message === "ACCOUNT_LINK_REQUIRED") {
        setStep("email");
        return;
      }
      console.error("wallet setup failed", err);
      const notice = describeWalletFailure(err);
      setError(notice.message);
      setCanRetry(notice.canRetry);
      setStep("creating-passkey");
    }
  }, [finish]);

  useEffect(() => {
    if (start !== "wallet" || !autoStartWallet || walletStartedRef.current) return;
    walletStartedRef.current = true;
    void runWalletSetup();
  }, [start, autoStartWallet, runWalletSetup]);

  useEffect(() => {
    if (!mounted || !hasWallet || emailStatus === null) return;
    if (emailStatus.email) {
      finish();
      return;
    }
    setStep("add-email");
  }, [mounted, hasWallet, emailStatus, finish]);

  const requestLoginCode = async () => {
    try {
      const res = await fetch("/api/proxy/v1/auth/email/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("request-code failed");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("code");
    } catch {
      setError("Couldn't send the code. Please try again.");
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
      if (res.status === 409) {
        accountExistedRef.current = true;
        await requestLoginCode();
        return;
      }
      if (!res.ok) throw new Error("register-account failed");
      saveAccountEmail(email);
      await runWalletSetup();
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("email");
    }
  };

  const continueWithEmail = async () => {
    setError(null);
    setStep("checking-email");
    try {
      const exists = await getMedialaneClient().api.checkEmailExists(email);
      accountExistedRef.current = exists;
      if (exists) await requestLoginCode();
      else await registerNewAccount();
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("email");
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/v1/auth/email/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Couldn't resend the code. Please try again.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(friendlyErrorMessage(err, "Couldn't resend the code. Please try again."));
    } finally {
      setResending(false);
    }
  };

  const verifyLoginCode = async (codeOverride?: string) => {
    const codeToVerify = codeOverride ?? code;
    setError(null);
    setStep("verifying-code");
    try {
      const res = await fetch("/api/proxy/v1/auth/email/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Incorrect code");
      saveAccountEmail(email);
      if (accountExistedRef.current && (await adoptAccountWallet())) {
        finish();
        return;
      }
      await runWalletSetup();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Incorrect code. Please try again."));
      setStep("code");
    }
  };

  const submitAddEmail = async () => {
    const value = addEmailInput.trim();
    if (!value) return;
    setAddEmailSaving(true);
    setError(null);
    try {
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");
      await getMedialaneClient().api.changeMyEmail(value, token);
      saveAccountEmail(value);
      finish();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Couldn't save your email. Please try again."));
    } finally {
      setAddEmailSaving(false);
    }
  };

  const errorBanner = error ? (
    <Alert variant="destructive" className="w-full">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;

  if (step === "done") {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-emerald-500">
        <CheckCircle2 className="h-4 w-4" />
        You&apos;re all set.
      </div>
    );
  }

  if (isWalletStep(step)) {
    return (
      <div className="w-full space-y-3">
        {errorBanner}
        {error ? (
          canRetry ? (
            <Button onClick={() => void runWalletSetup()} size="lg" className="w-full">
              Try again
            </Button>
          ) : null
        ) : (
          <div className="flex w-full items-center gap-2 py-2.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {walletStepLabel(step)}
          </div>
        )}
        {error ? null : (
          <p className="text-xs text-muted-foreground">
            Use your passkey, Face ID or Touch ID to secure your account.
          </p>
        )}
      </div>
    );
  }

  if (step === "add-email") {
    return (
      <div className="w-full space-y-3">
        {errorBanner}
        <Input
          type="email"
          placeholder="you@example.com"
          value={addEmailInput}
          onChange={(e) => setAddEmailInput(e.target.value)}
          disabled={addEmailSaving}
          className="w-full h-12"
          onKeyDown={(e) => {
            if (e.key === "Enter" && addEmailInput) void submitAddEmail();
          }}
        />
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => void submitAddEmail()}
          disabled={addEmailSaving || !addEmailInput}
        >
          {addEmailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
        <p className="text-xs text-muted-foreground">
          Used for account notices and signing back in.
        </p>
      </div>
    );
  }

  if (step === "code" || step === "verifying-code") {
    return (
      <div className="w-full space-y-3">
        {errorBanner}
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent to <span className="text-foreground">{email}</span>.
        </p>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => setCode(value.replace(/\D/g, ""))}
          onComplete={(value) => void verifyLoginCode(value)}
          disabled={step === "verifying-code"}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg font-semibold" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => void verifyLoginCode()}
          disabled={step === "verifying-code" || code.length !== 6}
        >
          {step === "verifying-code" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Verify
        </Button>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam, or{" "}
          {resendCooldown > 0 ? (
            <span>resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={() => void resendCode()}
              disabled={resending}
              className="underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            >
              {resending ? "resending…" : "resend the code"}
            </button>
          )}
          .
        </p>
      </div>
    );
  }

  const busy = step === "checking-email" || step === "registering";

  if (unsupported) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{passkeysUnavailableMessage()}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-3">
      {errorBanner}
      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
        className="w-full h-12"
        onKeyDown={(e) => {
          if (e.key === "Enter" && email) void continueWithEmail();
        }}
      />
      <Button size="lg" className="w-full gap-2" onClick={() => void continueWithEmail()} disabled={busy || !email}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continue
      </Button>
    </div>
  );
}

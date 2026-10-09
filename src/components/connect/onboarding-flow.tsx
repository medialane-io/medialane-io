"use client";

import { EmailCodeEntry, RESEND_COOLDOWN_SECONDS, describeError, describeWalletFailure, detectPasskeySupport, isPasskeyCancelled } from "@medialane/ui";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getMedialaneClient } from "@/lib/medialane-client";
import { saveAccountAddress, saveAccountEmail } from "@/lib/wallet/account-wallet";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-required";
import { useEmailCode } from "@/hooks/use-email-code";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { fireConfetti } from "@/lib/confetti";
import { MedialaneApiError } from "@medialane/sdk";
import { mediaWallet } from "@/lib/wallet/client";
import { adoptSessionWallet, claimSessionWallet } from "@medialane/sdk/starknet";
import { createOwnerKey } from "@/lib/wallet/passkey";
import { removeDevice } from "@/lib/wallet/devices";
import { loadSealedOwner, saveSealedOwner, notifyWalletChange } from "@/lib/wallet/store";
import { afterCodeVerified, afterEmailCheck, afterRegister } from "@/lib/onboarding/decisions";
import { flowReducer, initialFlow, retryTarget, type OnboardingStep } from "@/lib/onboarding/flow";

export type { OnboardingStep };
export { RESEND_COOLDOWN_SECONDS };

const WALLET_STEPS: OnboardingStep[] = ["creating-passkey", "deploying", "signing-in"];

export function isWalletStep(step: OnboardingStep): boolean {
  return WALLET_STEPS.includes(step);
}

export function walletStepLabel(step: OnboardingStep): string {
  if (step === "deploying") return "Setting up your wallet…";
  if (step === "signing-in") return "Signing in…";
  return "Creating passkey…";
}

export { describeWalletFailure, type WalletFailureNotice } from "@medialane/ui";

export interface OnboardingFlowProps {
  start?: "email" | "wallet";
  onDone?: (result: { celebrated: boolean }) => void;
  autoStartWallet?: boolean;
}

export function OnboardingFlow({ start = "email", onDone, autoStartWallet = true }: OnboardingFlowProps) {
  const [flow, dispatch] = useReducer(flowReducer, start, initialFlow);
  const [email, setEmail] = useState("");
  const [addEmailInput, setAddEmailInput] = useState("");
  const [addEmailSaving, setAddEmailSaving] = useState(false);
  const emailCode = useEmailCode(email);
  const walletStartedRef = useRef(false);

  const { hasWallet } = useWalletNativeSession();
  const emailStatus = useEmailVerificationStatus();
  const { getValidToken, signIn } = useSiwsToken();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const finish = useCallback(
    (celebrated = false) => {
      if (celebrated) fireConfetti();
      dispatch({ type: "finished" });
      onDone?.({ celebrated });
    },
    [onDone],
  );

  const failWallet = useCallback(async (err: unknown) => {
    const notice = describeWalletFailure(err, isPasskeyCancelled(err) ? await detectPasskeySupport() : "unknown");
    dispatch({ type: "wallet-failed", message: notice.message, canRetry: notice.canRetry });
  }, []);

  const runWalletSetup = useCallback(async () => {
    dispatch({ type: "wallet-setup-started" });
    try {
      const { siwsToken } = await mediaWallet.completeDeployment((s) =>
        dispatch({ type: "wallet-progress", step: s as "creating-passkey" | "deploying" | "signing-in" }),
      );
      await getMedialaneClient().api.upsertMyWallet(siwsToken, {
        walletType: "MEDIAWALLET",
        chain: "STARKNET",
      });
      finish(true);
    } catch (err) {
      if (err instanceof MedialaneApiError && err.message === "ACCOUNT_LINK_REQUIRED") {
        dispatch({ type: "link-required" });
        return;
      }
      console.error("wallet setup failed", err);
      await failWallet(err);
    }
  }, [finish, failWallet]);

  const runKeySetup = useCallback(
    async (walletAddress: string) => {
      dispatch({ type: "key-setup-started", address: walletAddress });
      try {
        await claimSessionWallet(getMedialaneClient().api, walletAddress, {
          createOwnerKey,
          loadOwner: loadSealedOwner,
          saveOwner: (sealed) => {
            saveSealedOwner(sealed);
            notifyWalletChange();
          },
          removeOwner: removeDevice,
        });
        dispatch({ type: "key-setup-finished" });
        finish(true);
      } catch (err) {
        console.error("wallet key setup failed", err);
        await failWallet(err);
      }
    },
    [finish, failWallet],
  );

  const retryWallet = () => {
    const target = retryTarget(flow);
    void (target.type === "key-setup" ? runKeySetup(target.walletAddress) : runWalletSetup());
  };

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
    dispatch({ type: "needs-email" });
  }, [mounted, hasWallet, emailStatus, finish]);

  const requestLoginCode = async () => {
    if (await emailCode.send(email)) dispatch({ type: "code-sent" });
    else dispatch({ type: "email-step-failed", message: "Couldn't send the code. Please try again." });
  };

  const registerNewAccount = async () => {
    dispatch({ type: "registering" });
    try {
      let outcome: "created" | "already-exists" = "created";
      try {
        await getMedialaneClient().api.registerEmailAccount(email);
      } catch (err) {
        if (err instanceof MedialaneApiError && err.status === 409) outcome = "already-exists";
        else throw err;
      }
      if (afterRegister(outcome) === "send-code") {
        dispatch({ type: "account-found", exists: true });
        await requestLoginCode();
        return;
      }
      saveAccountEmail(email);
      await runWalletSetup();
    } catch {
      dispatch({ type: "email-step-failed", message: "Something went wrong. Please try again." });
    }
  };

  const continueWithEmail = async () => {
    dispatch({ type: "email-submitted" });
    try {
      const { exists } = await getMedialaneClient().api.checkEmail(email);
      dispatch({ type: "account-found", exists });
      if (afterEmailCheck(exists) === "send-code") await requestLoginCode();
      else await registerNewAccount();
    } catch {
      dispatch({ type: "email-step-failed", message: "Something went wrong. Please try again." });
    }
  };

  const verifyLoginCode = async (codeOverride?: string) => {
    dispatch({ type: "code-submitted" });
    if (!(await emailCode.verify({ code: codeOverride }))) {
      dispatch({ type: "code-failed", message: null });
      return;
    }
    try {
      saveAccountEmail(email);
      const wallet = flow.accountExisted ? await adoptSessionWallet(getMedialaneClient().api, saveAccountAddress) : null;
      const next = afterCodeVerified(wallet, loadSealedOwner()?.address ?? null);
      if (next.type === "link-device") {
        dispatch({ type: "device-not-linked" });
        return;
      }
      if (next.type === "key-setup") {
        await runKeySetup(next.walletAddress);
        return;
      }
      if (next.type === "finish") {
        finish();
        return;
      }
      await runWalletSetup();
    } catch (err) {
      emailCode.fail(describeError(err, "Something went wrong. Please try again.").message);
      dispatch({ type: "code-failed", message: null });
    }
  };

  const submitAddEmail = async () => {
    const value = addEmailInput.trim();
    if (!value) return;
    setAddEmailSaving(true);
    dispatch({ type: "add-email-submitted" });
    try {
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");
      await getMedialaneClient().api.changeMyEmail(value, token);
      saveAccountEmail(value);
      finish();
    } catch (err) {
      dispatch({ type: "add-email-failed", message: describeError(err, "Couldn't save your email. Please try again.").message });
    } finally {
      setAddEmailSaving(false);
    }
  };

  const { step, error, canRetry } = flow;

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
          <p className="text-xs text-muted-foreground">
            Your account is saved. You can finish setting up anytime by signing in with your email, here or on another
            device.
          </p>
        ) : null}
        {error ? (
          canRetry ? (
            <Button onClick={retryWallet} size="lg" className="w-full">
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

  if (step === "link-device") {
    return (
      <div className="w-full space-y-3">
        <Alert className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your email is confirmed. Approve this browser from the device you used to sign up, and you&apos;re in.
          </AlertDescription>
        </Alert>
        <Button asChild size="lg" className="w-full">
          <Link href="/link-device">Approve this browser</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/recover">Lost your device? Recover your account</Link>
        </Button>
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
        <EmailCodeEntry emailCode={emailCode} onVerify={(code) => void verifyLoginCode(code)} />
      </div>
    );
  }

  const busy = step === "checking-email" || step === "registering";

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

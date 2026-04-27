"use client";

import { useState } from "react";
import { toast } from "sonner";
import { validatePin } from "@/components/ui/pin-input";

interface UseMarketplaceActionFlowOptions<TValues> {
  isSignedIn: boolean | undefined;
  hasWallet: boolean;
  hasActiveSession: boolean;
  setupSession: (pinOrDerivedKey: string) => Promise<unknown>;
  maybeClearSessionForAmountCap?: (amount: number) => Promise<boolean>;
  authenticate: () => Promise<string | null | undefined>;
  encryptKey?: string | null;
  sessionRefreshTitle?: string;
  sessionRefreshDescription?: string;
  executeAction: (values: TValues, pinOrDerivedKey: string) => Promise<unknown>;
}

export function useMarketplaceActionFlow<TValues>({
  isSignedIn,
  hasWallet,
  hasActiveSession,
  setupSession,
  maybeClearSessionForAmountCap,
  authenticate,
  encryptKey,
  sessionRefreshTitle,
  sessionRefreshDescription,
  executeAction,
}: UseMarketplaceActionFlowOptions<TValues>) {
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<TValues | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "pin">("form");
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const [isActivatingSession, setIsActivatingSession] = useState(false);

  const beginAction = async (values: TValues, amountForSessionCap: number) => {
    if (!isSignedIn) return false;
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return false;
    }
    const cleared = maybeClearSessionForAmountCap
      ? await maybeClearSessionForAmountCap(amountForSessionCap)
      : false;
    if (cleared && sessionRefreshTitle && sessionRefreshDescription) {
      toast.info(sessionRefreshTitle, {
        description: sessionRefreshDescription,
      });
    }
    setStep("pin");
    return true;
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) {
      setPinError(err);
      return;
    }
    setPinError(null);
    if (!pendingValues) return;

    if (!hasActiveSession) {
      setIsActivatingSession(true);
      try {
        await setupSession(pin);
      } catch (err: unknown) {
        setPinError(err instanceof Error ? err.message : "Session setup failed. Please try again.");
        return;
      } finally {
        setIsActivatingSession(false);
      }
    }

    await executeAction(pendingValues, pin);
    setPin("");
    setStep("form");
  };

  const handleUsePasskey = async () => {
    setPinError(null);
    setIsAuthenticatingPasskey(true);
    try {
      if (!pendingValues) return;
      const derived = encryptKey ?? (await authenticate());
      if (!derived) throw new Error("Passkey authentication failed.");
      if (!hasActiveSession) await setupSession(derived);
      await executeAction(pendingValues, derived);
      setPin("");
      setStep("form");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Passkey authentication failed";
      toast.error("Passkey authentication failed", { description: msg });
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const resetActionFlow = () => {
    setPendingValues(null);
    setPin("");
    setPinError(null);
    setStep("form");
  };

  return {
    walletSetupOpen,
    setWalletSetupOpen,
    pendingValues,
    setPendingValues,
    pin,
    setPin,
    pinError,
    setPinError,
    step,
    setStep,
    isAuthenticatingPasskey,
    isActivatingSession,
    beginAction,
    handlePin,
    handleUsePasskey,
    resetActionFlow,
  };
}

"use client";

import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useChipiWallet } from "@chipi-stack/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { completeOnboarding } from "@/app/onboarding/_actions";

interface WalletSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WalletSetupDialog({ open, onOpenChange, onSuccess }: WalletSetupDialogProps) {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const { session } = useClerk();

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet, isCreating } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: false,
  });

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmPinError, setConfirmPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"pin" | "confirm" | "done" | "error">("pin");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setStep("confirm");
  };

  const handleCreate = async () => {
    if (pin !== confirmPin) {
      setConfirmPinError("PINs do not match. Please try again.");
      return;
    }
    setConfirmPinError(null);
    setIsSubmitting(true);
    setError(null);

    try {
      const wallet = await createWallet({ encryptKey: pin });
      if (!wallet?.publicKey) {
        throw new Error("Wallet creation returned invalid data");
      }

      const result = await completeOnboarding({
        publicKey: wallet.publicKey,
      });
      if (result.error) throw new Error(result.error);

      await user?.reload();
      await session?.touch();

      setStep("done");
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create wallet. Please try again.");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setPinError(null);
    setConfirmPinError(null);
    setStep("pin");
    setError(null);
    onOpenChange(false);
  };

  const isLoading = isCreating || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Create your wallet</DialogTitle>
          <DialogDescription className="text-center">
            {step === "confirm"
              ? "Re-enter your PIN to confirm."
              : "Choose a 6–12 digit PIN to protect your gasless Starknet wallet."}
          </DialogDescription>
        </DialogHeader>

        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-center font-semibold">Wallet created!</p>
            <p className="text-center text-sm text-muted-foreground">
              Your invisible wallet is ready. Your PIN unlocks every transaction.
            </p>
            <Button className="w-full mt-2" onClick={handleClose}>Get started</Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating your wallet…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <PinInput
              value={step === "confirm" ? confirmPin : pin}
              onChange={step === "confirm"
                ? (v) => { setConfirmPin(v); setConfirmPinError(null); }
                : (v) => { setPin(v); setPinError(null); }
              }
              error={step === "confirm" ? confirmPinError : pinError}
              placeholder={step === "confirm" ? "Re-enter PIN" : "Enter 6–12 digit PIN"}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              {step === "confirm"
                ? "Make sure it matches your first entry."
                : "Remember this PIN — it signs every transaction. We never store it."}
            </p>
          </div>
        )}

        {step !== "done" && !isLoading && (
          <DialogFooter>
            {step === "confirm" && (
              <Button variant="outline" onClick={() => { setStep("pin"); setConfirmPin(""); setConfirmPinError(null); }}>
                Back
              </Button>
            )}
            <Button
              disabled={step === "pin" ? pin.length < 6 : confirmPin.length < 6}
              onClick={step === "pin" ? handleNext : handleCreate}
            >
              {step === "confirm" ? "Create wallet" : "Next"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

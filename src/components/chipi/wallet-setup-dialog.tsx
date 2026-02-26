"use client";

import { useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useChipiWallet } from "@chipi-stack/nextjs";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

interface WalletSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WalletSetupDialog({ open, onOpenChange, onSuccess }: WalletSetupDialogProps) {
  const { userId, getToken } = useAuth();
  const { user } = useUser();

  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );

  // useChipiWallet.createWallet handles externalUserId + bearer token internally
  const { createWallet, isCreating } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: false, // don't auto-fetch on mount — this dialog is only shown pre-wallet
  });

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"pin" | "confirm" | "creating" | "done" | "error">("pin");
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (step === "pin" && pin.length === 4) {
      setStep("confirm");
    }
  };

  const handleCreate = async () => {
    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      setStep("pin");
      setPin("");
      setConfirmPin("");
      return;
    }

    setStep("creating");
    setError(null);

    try {
      const wallet = await createWallet({ encryptKey: pin });
      if (!wallet?.publicKey || !wallet?.encryptedPrivateKey) {
        throw new Error("Wallet creation returned invalid data");
      }

      // Persist wallet keys in Clerk unsafeMetadata for backward compatibility
      await user?.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          publicKey: wallet.publicKey,
          encryptedPrivateKey: wallet.encryptedPrivateKey,
        },
      });

      setStep("done");
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Failed to create wallet. Please try again.");
      setStep("error");
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setStep("pin");
    setError(null);
    onOpenChange(false);
  };

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
            Set a 4-digit PIN to protect your gasless Starknet wallet.
          </DialogDescription>
        </DialogHeader>

        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-center font-semibold">Wallet created!</p>
            <p className="text-center text-sm text-muted-foreground">
              Your invisible wallet is ready. No seed phrases — your PIN unlocks every transaction.
            </p>
            <Button className="w-full mt-2" onClick={handleClose}>Get started</Button>
          </div>
        ) : step === "creating" || isCreating ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating your wallet…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Label className="self-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {step === "confirm" ? "Confirm PIN" : "Choose PIN"}
            </Label>
            {step === "pin" ? (
              <InputOTP maxLength={4} value={pin} onChange={setPin} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" autoComplete="off">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            ) : (
              <InputOTP maxLength={4} value={confirmPin} onChange={setConfirmPin} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" autoComplete="off">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {step === "confirm"
                ? "Re-enter your PIN to confirm."
                : "Remember this PIN — it signs every transaction. We never store it."}
            </p>
          </div>
        )}

        {step !== "done" && step !== "creating" && !isCreating && (
          <DialogFooter>
            {step === "confirm" && (
              <Button variant="outline" onClick={() => { setStep("pin"); setConfirmPin(""); }}>
                Back
              </Button>
            )}
            <Button
              disabled={step === "pin" ? pin.length !== 4 : confirmPin.length !== 4}
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

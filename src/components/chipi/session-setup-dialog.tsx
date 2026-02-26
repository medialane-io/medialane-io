"use client";

/**
 * SessionSetupDialog — one-time session key registration.
 *
 * Shows when a user is about to sign a marketplace operation but has no active
 * session key. User enters PIN once → session key is created + registered on-chain.
 * Subsequent signing operations use the session key (valid for 6 hours).
 */

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

interface SessionSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with PIN when user confirms — caller should call setupSession(pin) */
  onSetup: (pin: string) => Promise<void>;
  /** Whether the parent is processing the session registration */
  isProcessing?: boolean;
}

export function SessionSetupDialog({
  open,
  onOpenChange,
  onSetup,
  isProcessing = false,
}: SessionSetupDialogProps) {
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"pin" | "done" | "error">("pin");
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    if (pin.length !== 4) return;
    setError(null);
    try {
      await onSetup(pin);
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Session setup failed. Please try again.");
      setStep("error");
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPin("");
      setStep("pin");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Activate session key</DialogTitle>
          <DialogDescription className="text-center">
            Enter your PIN once to enable fast signing for the next 6 hours.
            No more PIN prompts per transaction.
          </DialogDescription>
        </DialogHeader>

        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-center font-semibold">Session active!</p>
            <p className="text-center text-sm text-muted-foreground">
              You can now sign marketplace operations for the next 6 hours.
            </p>
            <Button className="w-full mt-2" onClick={handleClose}>
              Continue
            </Button>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Registering session key on Starknet…
            </p>
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
              Enter PIN
            </Label>
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="off"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground text-center">
              This registers a time-limited session key on your Starknet account.
            </p>
          </div>
        )}

        {step === "pin" && !isProcessing && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button disabled={pin.length !== 4} onClick={handleSetup}>
              Activate
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

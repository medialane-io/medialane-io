"use client";

import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useChipiWallet, WalletData } from "@chipi-stack/nextjs";
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
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"pin" | "done" | "error">("pin");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setIsSubmitting(true);
    setError(null);

    try {
      const wallet = await createWallet({ encryptKey: pin });
      const walletKey = wallet.normalizedPublicKey ?? wallet.publicKey;
      if (!walletKey) {
        throw new Error("Wallet creation returned invalid data");
      }

      const result = await completeOnboarding({
        publicKey: walletKey,
      });
      if (result.error) throw new Error(result.error);

      await user?.reload();
      await session?.touch();

      setStep("done");
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to secure your account. Please try again.");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setPinError(null);
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
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Secure your account</DialogTitle>
          <DialogDescription className="text-center">
            Create a 6-digit security PIN to authorize your transactions.
          </DialogDescription>
        </DialogHeader>

        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-center font-semibold">Account secured!</p>
            <p className="text-center text-sm text-muted-foreground">
              Your account is protected. Your PIN authorizes every transaction.
            </p>
            <Button className="w-full mt-2" onClick={handleClose}>Get started</Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Securing your account…</p>
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
              value={pin}
              onChange={(v) => { setPin(v); setPinError(null); }}
              error={pinError}
              placeholder="Enter 6–12 digit PIN"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Remember this PIN — it authorizes your transactions. We never store it.
            </p>
          </div>
        )}

        {step !== "done" && !isLoading && (
          <DialogFooter>
            <Button
              disabled={pin.length < 6}
              onClick={handleCreate}
            >
              Secure my account
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

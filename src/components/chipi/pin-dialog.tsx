"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PinInput, validatePin } from "@/components/ui/pin-input";

// Kept for backward-compatibility with wallet transfer handlers that pass usedPasskey.
export type PinDialogSubmitOptions = { usedPasskey?: boolean };

interface PinDialogProps {
  open: boolean;
  onSubmit: (pin: string, options?: PinDialogSubmitOptions) => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
  /** @deprecated No-op. Passkey switching is managed in the wallet settings, not here. */
  allowPasskey?: boolean;
}

export function PinDialog({
  open,
  onSubmit,
  onCancel,
  title = "Enter your PIN",
  description = "Your wallet is protected — enter your PIN to continue.",
}: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const err = validatePin(pin);
    if (err) { setError(err); return; }
    onSubmit(pin, { usedPasskey: false });
    setPin("");
    setError(null);
  };

  const handleCancel = () => {
    setPin("");
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setError(null); }}
            error={error}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button disabled={pin.length < 6} onClick={handleSubmit}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

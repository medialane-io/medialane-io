"use client";

import { useState } from "react";
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

interface PinDialogProps {
  open: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function PinDialog({
  open,
  onSubmit,
  onCancel,
  title = "Enter your PIN",
  description = "Your wallet is protected — enter your PIN to continue.",
}: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (pin.length !== 4) return;
    setIsSubmitting(true);
    onSubmit(pin);
    setPin("");
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Label className="self-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PIN (4 digits)
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={pin.length !== 4 || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Verifying…" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

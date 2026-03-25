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
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";

export type PinDialogSubmitOptions = { usedPasskey?: boolean };

interface PinDialogProps {
  open: boolean;
  onSubmit: (pin: string, options?: PinDialogSubmitOptions) => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
  allowPasskey?: boolean;
}

export function PinDialog({
  open,
  onSubmit,
  onCancel,
  title = "Enter your PIN",
  description = "Your wallet is protected — enter your PIN to continue.",
  allowPasskey = true,
}: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const { authenticate, encryptKey } = usePasskeyAuth();

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );

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

  const handleUsePasskey = async () => {
    setIsAuthenticatingPasskey(true);
    setError(null);
    try {
      if (encryptKey) {
        await onSubmit(encryptKey, { usedPasskey: true });
        setPin("");
        setError(null);
        return;
      }
      const derived = await authenticate();
      if (!derived) throw new Error("Passkey authentication failed.");
      await onSubmit(derived, { usedPasskey: true });
      setPin("");
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Passkey authentication failed";
      setError(msg);
    } finally {
      setIsAuthenticatingPasskey(false);
    }
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
        {allowPasskey && passkeySupported && (
          <div className="py-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isAuthenticatingPasskey}
              onClick={handleUsePasskey}
            >
              {isAuthenticatingPasskey ? "Authenticating passkey…" : "Use passkey instead"}
            </Button>
          </div>
        )}
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

"use client";

import { EmailCodeEntry } from "@medialane/ui";
import { useEffect, useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@medialane/ui/dialog";
import { useEmailCode } from "@/hooks/use-email-code";

interface EmailVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified: () => Promise<void> | void;
  skipInitialSend?: boolean;
}

export function EmailVerifyDialog({ open, onOpenChange, email, onVerified, skipInitialSend }: EmailVerifyDialogProps) {
  const emailCode = useEmailCode(email);
  const [verified, setVerified] = useState(false);
  const { send, markReady, setCode } = emailCode;

  useEffect(() => {
    if (!open) return;
    setVerified(false);
    setCode("");
    if (skipInitialSend) markReady();
    else void send();
  }, [open]);

  const verify = async (code?: string) => {
    const ok = await emailCode.verify({ code, after: onVerified });
    if (!ok) return;
    setVerified(true);
    setTimeout(() => onOpenChange(false), 1200);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => emailCode.state.status !== "verifying" && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {verified ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Mail className="h-6 w-6 text-primary" />}
          </div>
          <DialogTitle>{verified ? "You're all set" : "Verify your email"}</DialogTitle>
          <DialogDescription>
            {verified
              ? "Your email is confirmed. Your account is fully unrestricted."
              : `Enter the 6-digit code we sent to ${email}.`}
          </DialogDescription>
        </DialogHeader>
        {verified ? null : <EmailCodeEntry emailCode={emailCode} onVerify={(code) => void verify(code)} />}
      </DialogContent>
    </Dialog>
  );
}

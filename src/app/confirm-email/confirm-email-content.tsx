"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@medialane/ui/card";
import { getMedialaneClient } from "@/lib/medialane-client";
import { confirmEmailOutcome, readConfirmToken } from "@/lib/confirm-email";

type Step = "confirming" | "confirmed" | "invalid";

const REDIRECT_DELAY_MS = 2000;

export default function ConfirmEmailContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("confirming");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = readConfirmToken(window.location.search, window.location.hash);
    if (!token) {
      setStep("invalid");
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    void confirmEmailOutcome(() => getMedialaneClient().api.confirmEmail(token)).then(setStep);
  }, []);

  useEffect(() => {
    if (step !== "confirmed") return;
    const timer = setTimeout(() => router.push("/"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step, router]);

  const view = {
    confirming: { icon: <Loader2 className="h-6 w-6 animate-spin text-primary" />, title: "Confirming your email…", body: "" },
    confirmed: { icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />, title: "You're all set", body: "Your email is confirmed. Taking you to Medialane…" },
    invalid: { icon: <MailWarning className="h-6 w-6 text-primary" />, title: "This link has expired", body: "Please sign up again to get a new one." },
  }[step];

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">{view.icon}</div>
          </div>
          <CardTitle>{view.title}</CardTitle>
          {view.body ? <CardDescription>{view.body}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          {step === "confirmed" ? (
            <Button size="lg" className="w-full" onClick={() => router.push("/")}>
              Go to Medialane
            </Button>
          ) : null}
          {step === "invalid" ? (
            <Button size="lg" className="w-full" onClick={() => router.push("/connect")}>
              Sign up again
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

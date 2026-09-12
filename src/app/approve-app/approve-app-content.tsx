"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { parseApprovalRequest, buildReturnUrl, type ApprovalRequest } from "@medialane/sdk/starknet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { loadSealedOwner } from "@/lib/wallet/store";
import { addDevice, isOwnerOf } from "@/lib/wallet/devices";
import { friendlyErrorMessage } from "@/lib/friendly-error";

type Step = "ready" | "approving" | "error";

export function ApproveAppContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { address, hasWallet } = useWalletNativeSession();
  const [step, setStep] = useState<Step>("ready");
  const [error, setError] = useState<string | null>(null);

  const request = useMemo<ApprovalRequest | null>(() => {
    try {
      return parseApprovalRequest(params);
    } catch {
      return null;
    }
  }, [params]);

  if (!request) {
    return (
      <Shell title="That request is not valid">
        <p className="text-sm text-muted-foreground">
          The link is missing something, or it points somewhere outside Medialane. Go back to the app
          that sent you and start again.
        </p>
      </Shell>
    );
  }

  if (!hasWallet || !address) {
    return (
      <Shell title={`Approve ${request.appName}`}>
        <p className="text-sm text-muted-foreground">
          Sign in here first, then open the link again and we will finish it.
        </p>
        <Button className="mt-4 w-full" onClick={() => router.push("/connect")}>
          Sign in
        </Button>
      </Shell>
    );
  }

  const approve = async () => {
    const sealed = loadSealedOwner();
    if (!sealed) {
      setError("This device cannot sign for your wallet.");
      setStep("error");
      return;
    }

    setStep("approving");
    setError(null);
    try {
      const already = await isOwnerOf(address, request.publicKey);
      if (!already) await addDevice(sealed, request.publicKey);
      window.location.href = buildReturnUrl(request.returnUrl, "approved");
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not approve that app."));
      setStep("error");
    }
  };

  const decline = () => {
    window.location.href = buildReturnUrl(request.returnUrl, "declined");
  };

  return (
    <Shell title={`Approve ${request.appName}`}>
      <p className="text-sm text-muted-foreground">
        {request.appName} is asking to use this wallet. It will be able to sign for your account, and
        you can remove it later in Settings.
      </p>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-5 space-y-2">
        <Button className="w-full" onClick={approve} disabled={step === "approving"}>
          {step === "approving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={decline} disabled={step === "approving"}>
          Not now
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </span>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="sr-only">Approve an app to use your wallet</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}

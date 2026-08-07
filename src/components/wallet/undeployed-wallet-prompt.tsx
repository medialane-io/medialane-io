"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

const DISMISS_KEY = "ml_undeployed_wallet_dismissed";

/**
 * Global safety net for a local wallet that exists but never finished
 * deploying (e.g. a stranded key from an interrupted setup). Without this,
 * any hook that opportunistically calls signIn() would otherwise fail
 * silently against a wallet that can never sign in — see
 * account_not_deployed in use-siws-token.ts. Points the user at
 * /wallet-onboarding, which re-verifies by email and resumes/attaches the
 * stranded key correctly — the one path that doesn't require proving a
 * wallet that, by definition, can't sign anything yet.
 */
export function UndeployedWalletPrompt() {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const open = hasWallet && isDeployed === false && !dismissed;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center items-center">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle>Finish setting up your wallet</DialogTitle>
          <DialogDescription>
            Your wallet hasn&apos;t finished deploying on Starknet yet, so some actions won&apos;t work
            until that&apos;s done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => router.push(`/wallet-onboarding?redirect_url=${encodeURIComponent(pathname)}`)}
          >
            Continue setup
          </Button>
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { mediaWallet } from "@/lib/wallet/client";
import { resolveOnboardingRedirect } from "@/lib/wallet/onboarding-gate";

export function OnboardingGate() {
  const { status } = useWalletNativeSession();
  const router = useRouter();
  const pathname = usePathname();
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    const target = resolveOnboardingRedirect({ pathname, status, isDeploying: mediaWallet.isDeploying() });
    if (!target || lastRedirect.current === target) return;
    lastRedirect.current = target;
    router.push(target);
  }, [status, pathname, router]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { mediaWallet } from "@/lib/wallet/client";
import { resolveOnboardingRedirect } from "@/lib/wallet/onboarding-gate";

export function OnboardingGate() {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const { session, isLoading } = useSession();
  const accountWithoutWallet = !isLoading && session !== null && !session.walletAddress;
  const router = useRouter();
  const pathname = usePathname();
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    const target = resolveOnboardingRedirect({
      pathname,
      hasWallet,
      isDeployed,
      isDeploying: mediaWallet.isDeploying(),
      accountWithoutWallet,
    });
    if (!target || lastRedirect.current === target) return;
    lastRedirect.current = target;
    router.push(target);
  }, [hasWallet, isDeployed, accountWithoutWallet, pathname, router]);

  return null;
}

"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCard } from "@/components/connect/account-card";
import { OnboardingFlow } from "@/components/connect/onboarding-flow";
import { useSession } from "@medialane/ui/utils/use-session";
import { useRedirectWhenDone } from "@/hooks/use-redirect-when-done";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { connectHref } from "@/lib/connect-href";
import { safeRelativePath } from "@/lib/safe-redirect";

export default function OnboardingPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading } = useSession();
  const { hasWallet } = useWalletNativeSession();
  const redirectTo = safeRelativePath(searchParams.get("redirect_url")) ?? "/airdrop";
  const onDone = useRedirectWhenDone(redirectTo);

  const needsSignIn = !isLoading && (!session || (!!session.walletAddress && !hasWallet));

  useEffect(() => {
    if (needsSignIn) router.replace(connectHref(redirectTo));
  }, [needsSignIn, router, redirectTo]);

  if (isLoading || needsSignIn || !session) return null;

  return (
    <AccountCard title="Secure your account" description="Finish setting up your account.">
      <OnboardingFlow start="wallet" onDone={onDone} />
    </AccountCard>
  );
}

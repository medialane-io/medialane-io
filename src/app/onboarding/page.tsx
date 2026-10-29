"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@medialane/ui/card";
import { ShieldCheck } from "lucide-react";
import { OnboardingFlow } from "@/components/connect/onboarding-flow";
import { useSession } from "@/hooks/use-session";
import { connectHref } from "@/lib/connect-href";
import { safeRelativePath } from "@/lib/safe-redirect";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading } = useSession();
  const redirectTo = safeRelativePath(searchParams.get("redirect_url")) ?? "/airdrop";

  useEffect(() => {
    if (!isLoading && !session) router.replace(connectHref(redirectTo));
  }, [isLoading, session, router, redirectTo]);

  if (isLoading || !session) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Secure your account</CardTitle>
          <CardDescription>Use your passkey, Face ID, or Touch ID to create your unique access.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingFlow start="wallet" onDone={() => setTimeout(() => router.push(redirectTo), 1600)} />
        </CardContent>
      </Card>
    </div>
  );
}

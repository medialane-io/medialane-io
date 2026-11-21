"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "@medialane/ui/router";
import { AccountCard } from "@/components/connect/account-card";
import { ValuePropCarousel } from "@/components/connect/value-prop-carousel";
import { OnboardingFlow, type OnboardingStep } from "@/components/connect/onboarding-flow";
import { useRedirectWhenDone } from "@/hooks/use-redirect-when-done";
import { safeRelativePath } from "@/lib/safe-redirect";
import { msg, useT } from "@medialane/ui/i18n";

const TITLE = msg("Connect with your email");

export default function ConnectPage() {
  const t = useT();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Suspense fallback={<AccountCard title={t(TITLE)} />}>
          <ConnectContent />
        </Suspense>
      </div>
    </div>
  );
}

function ConnectContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const onDone = useRedirectWhenDone(safeRelativePath(searchParams.get("redirect_url")) ?? "/");
  const [step, setStep] = useState<OnboardingStep>("email");
  const restoring = step === "restore-key";

  return (
    <>
      <AccountCard title={restoring ? undefined : t(TITLE)}>
        <OnboardingFlow onStepChange={setStep} onDone={onDone} />
      </AccountCard>
      {restoring ? null : <ValuePropCarousel />}
    </>
  );
}

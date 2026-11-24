"use client";

import { LAUNCHPAD_ROUTE_OVERRIDES, LAUNCHPAD_SERVICE_DEFINITIONS, LaunchpadServiceCard, PageContainer, PageHeader } from "@medialane/ui";
import { claimDefinitions, claimOverrides } from "@/lib/claims";
import { useT } from "@medialane/ui/i18n";

const CARDS = claimDefinitions(LAUNCHPAD_SERVICE_DEFINITIONS);
const OVERRIDES = claimOverrides(LAUNCHPAD_ROUTE_OVERRIDES);

export function ClaimPageClient() {
  const t = useT();
  return (
    <PageContainer className="space-y-8">
      <PageHeader title={t("Claims")} subtitle={t("Claim what's yours on Medialane.")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {CARDS.map((def, index) => (
          <LaunchpadServiceCard key={def.key} def={def} override={OVERRIDES[def.key]} index={index} />
        ))}
      </div>
    </PageContainer>
  );
}

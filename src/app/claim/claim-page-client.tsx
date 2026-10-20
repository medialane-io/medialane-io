"use client";

import { LAUNCHPAD_ROUTE_OVERRIDES, LAUNCHPAD_SERVICE_DEFINITIONS, LaunchpadServiceCard } from "@medialane/ui";
import { FadeIn } from "@medialane/ui/motion-primitives";
import { claimDefinitions, claimOverrides } from "@/lib/claims";

const CARDS = claimDefinitions(LAUNCHPAD_SERVICE_DEFINITIONS);
const OVERRIDES = claimOverrides(LAUNCHPAD_ROUTE_OVERRIDES);

export function ClaimPageClient() {
  return (
    <div className="relative pb-20">
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 space-y-6">
        <FadeIn>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">Claims</h1>
          <p className="mt-2 text-muted-foreground">
            Reserve your username, bring in a collection or a coin, or join the airdrop.
          </p>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {CARDS.map((def, index) => (
            <LaunchpadServiceCard key={def.key} def={def} override={OVERRIDES[def.key]} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

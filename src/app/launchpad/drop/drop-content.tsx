"use client";

import { Package } from "lucide-react";
import { DropFeatures, DropListing, ServiceHeader } from "@medialane/ui";
import { FadeIn } from "@/components/ui/motion-primitives";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { getMedialaneClient } from "@/lib/medialane-client";

export function DropContent() {
  return (
    <div className="pb-16 space-y-10">

      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              plain
              icon={<Package className="h-4 w-4 text-white" />}
              title="Drops"
              subtitle="Timed releases with a fixed supply. Browse live drops to collect, or launch your own."
            />
          </div>
        </FadeIn>
      </section>

      <section className="px-4 max-w-5xl mx-auto">
        <FadeIn>
          <DropFeatures />
        </FadeIn>
      </section>

      <section className="px-4 max-w-5xl mx-auto">
        <DropListing getClient={getMedialaneClient} />
      </section>

    </div>
  );
}

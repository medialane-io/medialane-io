"use client";

import { Package, Timer, Users, Layers } from "lucide-react";
import { DropListing } from "@medialane/ui";
import { FadeIn } from "@/components/ui/motion-primitives";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { getMedialaneClient } from "@/lib/medialane-client";

const DROP_FEATURES = [
  {
    icon: Layers,
    title: "Edition or collection",
    desc: "One artwork in numbered copies, or many unique items.",
  },
  {
    icon: Timer,
    title: "Your sale window",
    desc: "Open now or on a date, close whenever you choose — or never.",
  },
  {
    icon: Users,
    title: "Everyone or a list",
    desc: "Open to all, or only the wallets you invite with claim links.",
  },
  {
    icon: Package,
    title: "Collectors own them",
    desc: "Each token is theirs to keep, sell or trade anywhere.",
  },
];

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DROP_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <Icon className="h-5 w-5 text-brand-orange" />
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section className="px-4 max-w-5xl mx-auto">
        <DropListing getClient={getMedialaneClient} />
      </section>

    </div>
  );
}

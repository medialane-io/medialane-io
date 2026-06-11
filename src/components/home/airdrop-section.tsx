"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Rocket } from "lucide-react";
import { ScrollSection } from "@/components/shared/scroll-section";
import { LAUNCHPAD_SERVICE_DEFINITIONS, SERVICE_HUES } from "@medialane/ui";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** Homepage launchpad strip — cards derive from the shared launchpad service
 *  definitions (@medialane/ui): creator language, one blurb, one example, one
 *  vivid verb pill. No tech chips, no long descriptions. */

interface StripCard {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  blurb: string;
  example?: string;
  cta: string;
  hue: { text: string; solid: string; border: string; pill: string };
}

const DEF_BY_KEY = Object.fromEntries(LAUNCHPAD_SERVICE_DEFINITIONS.map((d) => [d.key, d]));

// Launchpad services shown on the homepage, with io hrefs
const STRIP_SERVICES: { key: string; href: string }[] = [
  { key: "mint-ip-asset", href: "/create/asset" },
  { key: "create-collection", href: "/create/collection" },
  { key: "ip-collection-1155", href: "/launchpad/nfteditions/create" },
  { key: "mint-editions", href: "/launchpad/nfteditions" },
  { key: "collection-drop", href: "/launchpad/drop/create" },
  { key: "pop-protocol", href: "/launchpad/pop/create" },
];

const MARKETPLACE_HUE = {
  text: "text-indigo-600 dark:text-indigo-400",
  solid: "bg-indigo-500",
  border: "border-indigo-500/25",
  pill: "bg-gradient-to-r from-indigo-500 to-blue-600",
};

const CARDS: StripCard[] = [
  ...STRIP_SERVICES.flatMap(({ key, href }) => {
    const def = DEF_BY_KEY[key];
    if (!def) return [];
    return [{
      key,
      href,
      icon: def.icon,
      title: def.title,
      blurb: def.blurb,
      example: def.example,
      cta: def.cta,
      hue: SERVICE_HUES[key] ?? MARKETPLACE_HUE,
    }];
  }),
  {
    key: "marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
    title: "Marketplace",
    blurb: "Discover and trade works from creators — gasless, instantly settled.",
    example: "Buy an art print, make an offer on a music track",
    cta: "Browse",
    hue: MARKETPLACE_HUE,
  },
];

function ServiceCard({ card }: { card: StripCard }) {
  const { icon: Icon, title, blurb, example, cta, hue, href } = card;
  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-2xl border bg-card overflow-hidden flex flex-col h-full min-h-[280px]",
        "transition-transform active:scale-[0.99]",
        hue.border,
      )}
    >
      {/* Ghosted watermark icon (launchpad card language) */}
      <div aria-hidden className="absolute -right-7 -bottom-9 opacity-[0.04] select-none pointer-events-none">
        <Icon className="h-36 w-36" />
      </div>

      <div className="relative flex flex-col flex-1 p-6 gap-3.5">
        <div className="relative w-fit">
          <div aria-hidden className={cn("absolute -inset-3 rounded-full blur-2xl opacity-30", hue.solid)} />
          <Icon className={cn("relative h-8 w-8", hue.text)} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-black tracking-tight leading-snug">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
          {example && (
            <p className="text-xs text-muted-foreground/70 italic leading-relaxed">e.g. {example}</p>
          )}
        </div>

        <div className="mt-auto pt-1 flex justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-full",
              "text-sm font-semibold text-white shadow-lg shadow-black/25",
              hue.pill,
            )}
          >
            {cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function AirdropSection() {
  return (
    <ScrollSection
      icon={<Rocket className="h-3.5 w-3.5 text-white" />}
      iconBg="bg-gradient-to-br from-primary to-blue-600 shadow-md shadow-primary/20"
      title="Launchpad"
      href="/launchpad"
      linkLabel="Explore"
    >
      {CARDS.map((card) => (
        <div key={card.key} className="w-64 sm:w-72 snap-start shrink-0 flex">
          <ServiceCard card={card} />
        </div>
      ))}
    </ScrollSection>
  );
}

"use client";

import Link from "next/link";
import {
  Paintbrush,
  ShoppingBag,
  Bot,
  Award,
  Package,
  Layers,
  ArrowRight,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Paintbrush,
    label: "Mint IP Assets",
    description: "Publish music, art, video and creative works as NFTs with programmable licensing — zero fees.",
    accent: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/15",
    href: "/create/asset",
    tag: "Live",
  },
  {
    icon: ShoppingBag,
    label: "Marketplace",
    description: "Buy, sell, and make offers on IP assets. Gasless trading settled atomically on Starknet.",
    accent: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/15",
    href: "/marketplace",
    tag: "Live",
  },
  {
    icon: Layers,
    label: "Collections",
    description: "Deploy smart contract collections, set royalties, and manage your IP portfolio onchain.",
    accent: "from-sky-500 to-blue-600",
    shadow: "shadow-sky-500/15",
    href: "/create/collection",
    tag: "Live",
  },
  {
    icon: Award,
    label: "POP Protocol",
    description: "Issue on-chain proof-of-participation credentials for events, communities, and milestones.",
    accent: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/15",
    href: "/launchpad/pop",
    tag: "Live",
  },
  {
    icon: Package,
    label: "Collection Drop",
    description: "Launch time-limited NFT drop events with allowlists, schedules, and onchain settlement.",
    accent: "from-orange-400 to-rose-500",
    shadow: "shadow-orange-500/15",
    href: "/launchpad/drop",
    tag: "Live",
  },
  {
    icon: Bot,
    label: "AI Agent Ready",
    description: "Autonomous agents can participate onchain — list, buy, license, and remix IP autonomously.",
    accent: "from-pink-500 to-fuchsia-600",
    shadow: "shadow-pink-500/15",
    href: "/launchpad",
    tag: "Beta",
  },
] as const;

function FeatureCard({ feature }: { feature: typeof FEATURES[number] }) {
  const { icon: Icon, label, description, accent, shadow, href, tag } = feature;
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 hover:border-border/80 hover:bg-muted/30 transition-all duration-200 h-full"
    >
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg shrink-0 ${accent} ${shadow}`}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
          {tag}
        </span>
      </div>
      <div className="flex-1 space-y-1.5">
        <p className="font-bold text-sm text-foreground group-hover:text-foreground/90 transition-colors leading-snug">
          {label}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
    </Link>
  );
}

export function AirdropSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Creator Launchpad</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/launchpad" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            All services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory pb-2" style={{ width: "max-content" }}>
          {FEATURES.map((f) => (
            <div key={f.label} className="w-56 sm:w-64 snap-start shrink-0">
              <FeatureCard feature={f} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

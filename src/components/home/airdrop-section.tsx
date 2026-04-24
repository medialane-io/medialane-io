"use client";

import Link from "next/link";
import {
  Paintbrush, ShoppingBag, Award, Package, Layers,
  ArrowRight, Rocket, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Paintbrush,
    label: "Mint IP Assets",
    subtitle: "Publish any creative work on Starknet",
    color: BRAND.purple.text,
    href: "/create/asset",
  },
  {
    icon: ShoppingBag,
    label: "Marketplace",
    subtitle: "Gasless trading, settled atomically",
    color: BRAND.blue.text,
    href: "/marketplace",
  },
  {
    icon: Layers,
    label: "Collections",
    subtitle: "Deploy your branded IP catalog",
    color: BRAND.blue.text,
    href: "/create/collection",
  },
  {
    icon: Award,
    label: "POP Protocol",
    subtitle: "Soulbound event credentials",
    color: BRAND.orange.text,
    href: "/launchpad/pop",
  },
  {
    icon: Package,
    label: "Collection Drop",
    subtitle: "Limited-edition NFT releases",
    color: BRAND.orange.text,
    href: "/launchpad/drop",
  },
  {
    icon: BookOpen,
    label: "Learn",
    subtitle: "Creator education & guides",
    color: BRAND.purple.text,
    href: "/learn",
  },
] as const;

function ServiceCard({ feature }: { feature: typeof FEATURES[number] }) {
  const { icon: Icon, label, subtitle, color, href } = feature;
  return (
    <Link href={href} className="group block">
      <div className={cn(
        "rounded-2xl border border-border/40 bg-card p-5",
        "flex flex-col gap-4 h-full",
        "transition-all duration-200",
        "hover:border-border/70 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20",
      )}>
        <Icon className={cn("h-8 w-8 transition-transform duration-200 group-hover:scale-110", color)} />
        <div className="flex-1 space-y-1">
          <p className="font-bold text-sm leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}

export function AirdropSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md shadow-primary/20">
            <Rocket className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Creator Launchpad</h2>
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
            <div key={f.label} className="w-44 sm:w-52 snap-start shrink-0">
              <ServiceCard feature={f} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

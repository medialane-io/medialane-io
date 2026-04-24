"use client";

import Link from "next/link";
import {
  Paintbrush, ShoppingBag, Award, Package, Layers,
  ArrowRight, Rocket, BookOpen, FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Paintbrush,
    label: "Mint IP Assets",
    subtitle: "Zero fees, permanent record on Starknet",
    accent: "from-violet-500 to-purple-600",
    href: "/create/asset",
  },
  {
    icon: ShoppingBag,
    label: "Marketplace",
    subtitle: "Gasless trading, settled atomically",
    accent: "from-blue-500 to-cyan-500",
    href: "/marketplace",
  },
  {
    icon: Layers,
    label: "Collections",
    subtitle: "Deploy your branded IP catalog",
    accent: "from-sky-500 to-blue-600",
    href: "/create/collection",
  },
  {
    icon: Award,
    label: "POP Protocol",
    subtitle: "Soulbound event credentials",
    accent: "from-emerald-400 to-teal-500",
    href: "/launchpad/pop",
  },
  {
    icon: Package,
    label: "Collection Drop",
    subtitle: "Limited-edition NFT releases",
    accent: "from-orange-400 to-rose-500",
    href: "/launchpad/drop",
  },
  {
    icon: BookOpen,
    label: "Learn",
    subtitle: "Creator education & guides",
    accent: "from-violet-500 to-indigo-600",
    href: "/learn",
  },
  {
    icon: FileCode2,
    label: "Developer Docs",
    subtitle: "API, contracts & protocol reference",
    accent: "from-slate-600 to-blue-700",
    href: "/docs",
  },
] as const;

function ServiceCard({ feature }: { feature: typeof FEATURES[number] }) {
  const { icon: Icon, label, subtitle, accent, href } = feature;
  return (
    <Link href={href} className="group block">
      <div className="card-base overflow-hidden">
        <div className={`relative aspect-[3/4] w-full bg-gradient-to-br ${accent}`}>
          {/* Radial highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_25%,rgba(255,255,255,0.14),transparent_60%)]" />

          {/* Large decorative icon (background) */}
          <div className="absolute -bottom-6 -right-6 opacity-[0.12] pointer-events-none">
            <Icon className="h-36 w-36 text-white" />
          </div>

          {/* Card layout */}
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            {/* Top: small icon */}
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 group-hover:bg-white/18 transition-colors duration-300">
              <Icon className="h-5.5 w-5.5 text-white" />
            </div>

            {/* Bottom: title + subtitle */}
            <div>
              <p className="text-lg font-black text-white leading-tight tracking-tight">{label}</p>
              <p className="text-xs text-white/65 mt-1.5 leading-relaxed">{subtitle}</p>
            </div>
          </div>
        </div>
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
            <div key={f.label} className="w-56 sm:w-64 snap-start shrink-0">
              <ServiceCard feature={f} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

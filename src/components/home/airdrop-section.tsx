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
  BookOpen,
  FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Paintbrush,
    label: "Mint IP Assets",
    accent: "from-violet-500 to-purple-600",
    href: "/create/asset",
    tag: "Live",
  },
  {
    icon: ShoppingBag,
    label: "Marketplace",
    accent: "from-blue-500 to-cyan-500",
    href: "/marketplace",
    tag: "Live",
  },
  {
    icon: Layers,
    label: "Collections",
    accent: "from-sky-500 to-blue-600",
    href: "/create/collection",
    tag: "Live",
  },
  {
    icon: Award,
    label: "POP Protocol",
    accent: "from-emerald-400 to-teal-500",
    href: "/launchpad/pop",
    tag: "Live",
  },
  {
    icon: Package,
    label: "Collection Drop",
    accent: "from-orange-400 to-rose-500",
    href: "/launchpad/drop",
    tag: "Live",
  },
  {
    icon: Bot,
    label: "AI Agent Ready",
    accent: "from-pink-500 to-fuchsia-600",
    href: "/launchpad",
    tag: "Beta",
  },
  {
    icon: BookOpen,
    label: "Learn",
    accent: "from-violet-500 to-indigo-600",
    href: "/learn",
    tag: "Guide",
  },
  {
    icon: FileCode2,
    label: "Developer Docs",
    accent: "from-slate-600 to-blue-700",
    href: "/docs",
    tag: "Dev",
  },
] as const;

function ServiceCard({ feature }: { feature: typeof FEATURES[number] }) {
  const { icon: Icon, label, accent, href, tag } = feature;
  return (
    <Link href={href} className="group block">
      <div className="card-base overflow-hidden">
        <div className={`relative aspect-[3/4] w-full bg-gradient-to-br ${accent}`}>
          {/* Radial highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_25%,rgba(255,255,255,0.14),transparent_60%)]" />

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 group-hover:bg-white/15 transition-colors duration-300">
              <Icon className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Tag */}
          <div className="absolute top-3 right-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-full">
              {tag}
            </span>
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

          {/* Label */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <p className="font-bold text-sm text-white leading-snug">{label}</p>
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
              <ServiceCard feature={f} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

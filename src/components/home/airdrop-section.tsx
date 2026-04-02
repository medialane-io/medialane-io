"use client";

import Link from "next/link";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Paintbrush,
  ShoppingBag,
  Bot,
  Award,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Paintbrush,
    label: "Mint IP Assets",
    description: "Publish music, art, video and any creative work as an NFT with programmable licensing — zero fees.",
    accent: "from-violet-500 to-purple-600",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
    href: "/create/asset",
  },
  {
    icon: ShoppingBag,
    label: "Marketplace",
    description: "Buy, sell, and make offers on IP assets. Gasless trading settled atomically on Starknet.",
    accent: "from-blue-500 to-cyan-500",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
    href: "/marketplace",
  },
  {
    icon: Layers,
    label: "Collections",
    description: "Deploy smart contract collections, set royalties, and manage your IP portfolio onchain.",
    accent: "from-sky-500 to-blue-600",
    border: "border-sky-500/20",
    glow: "shadow-sky-500/10",
    href: "/create/collection",
  },
  {
    icon: Award,
    label: "POP Protocol",
    description: "Issue on-chain proof-of-participation credentials for events, communities, and milestones.",
    accent: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    href: "/launchpad/pop",
  },
  {
    icon: Package,
    label: "Collection Drop",
    description: "Launch time-limited NFT drop events with allowlists, schedules, and onchain settlement.",
    accent: "from-orange-400 to-rose-500",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/10",
    href: "/launchpad/drop",
  },
  {
    icon: Bot,
    label: "AI Agent Ready",
    description: "Autonomous agents can participate onchain — list, buy, license, and remix IP autonomously.",
    accent: "from-pink-500 to-fuchsia-600",
    border: "border-pink-500/20",
    glow: "shadow-pink-500/10",
    href: "/launchpad",
  },
] as const;

function FeatureCard({ feature }: { feature: typeof FEATURES[number] }) {
  const { icon: Icon, label, description, accent, border, glow, href } = feature;
  return (
    <Link
      href={href}
      className={cn(
        "group relative rounded-2xl border p-5 backdrop-blur-sm bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 flex flex-col gap-4 shadow-lg",
        border,
        glow
      )}
    >
      <div className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
        accent
      )}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="space-y-1.5">
        <p className="font-bold text-sm text-white/90 group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-white/40 leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all mt-auto" />
    </Link>
  );
}

export function AirdropSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Cinematic dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0010] via-[#06000e] to-[#000814]" />

      {/* Aurora atmosphere */}
      <div className="aurora-purple absolute w-[80%] max-w-[600px] h-[60%] max-h-[600px] -top-1/4 -left-1/4" style={{ opacity: 0.22 }} />
      <div className="aurora-blue absolute w-[60%] max-w-[450px] h-[50%] max-h-[450px] top-0 -right-1/4" style={{ opacity: 0.15 }} />
      <div className="aurora-rose absolute w-[50%] max-w-[350px] h-[40%] max-h-[350px] bottom-0 left-1/3" style={{ opacity: 0.10 }} />

      {/* Edge glow lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Headline */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">Creator Launchpad</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.08] tracking-tight text-white">
            Everything you need to{" "}
            <span className="gradient-text">build, launch & earn</span>
          </h2>
          <p className="text-base text-white/50 leading-relaxed">
            Permissionless smart contracts for creators. Mint, license, trade, and deploy capital — all onchain with full sovereignty.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-8">
          {[
            { value: "Zero Fees", label: "on launch" },
            { value: "Gas-free", label: "transactions" },
            { value: "Atomic", label: "onchain settlement" },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-base font-black text-white leading-none">{value}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.label} feature={f} />
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90">
            <Link href="/marketplace">
              <ShoppingBag className="h-4 w-4" />
              Explore Marketplace
            </Link>
          </Button>
          {isSignedIn ? (
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30">
              <Link href="/launchpad">
                <Sparkles className="h-4 w-4" />
                Open Launchpad
              </Link>
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30">
                <Sparkles className="h-4 w-4" />
                Start Creating
              </Button>
            </SignInButton>
          )}
        </div>

      </div>
    </section>
  );
}

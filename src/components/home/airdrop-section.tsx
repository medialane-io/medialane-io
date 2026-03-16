"use client";

import Link from "next/link";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Paintbrush,
  ShoppingBag,
  Bot,
  Building2,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PARTICIPANT_TYPES = [
  {
    icon: Paintbrush,
    label: "Creators",
    description: "Create and trade creative works.",
    accent: "from-violet-500 to-purple-600",
    border: "border-violet-500/20",
    dot: "bg-violet-400",
  },
  {
    icon: ShoppingBag,
    label: "Collectors",
    description: "Build your collection and support creators worldwide.",
    accent: "from-blue-500 to-cyan-500",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    icon: Bot,
    label: "AI Agents",
    description: "Autonomous agents can participate on-chain.",
    accent: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  {
    icon: Building2,
    label: "Organizations",
    description: "Generate new monetization revenues.",
    accent: "from-orange-400 to-rose-500",
    border: "border-orange-500/20",
    dot: "bg-orange-400",
  },
] as const;

export function AirdropSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Cinematic dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0010] via-[#06000e] to-[#000814]" />

      {/* Aurora atmosphere — sizes in % so they scale with the section, never overflow */}
      <div className="aurora-purple absolute w-[80%] max-w-[600px] h-[60%] max-h-[600px] -top-1/4 -left-1/4" style={{ opacity: 0.22 }} />
      <div className="aurora-blue absolute w-[60%] max-w-[450px] h-[50%] max-h-[450px] top-0 -right-1/4" style={{ opacity: 0.15 }} />
      <div className="aurora-rose absolute w-[50%] max-w-[350px] h-[40%] max-h-[350px] bottom-0 left-1/3" style={{ opacity: 0.10 }} />

      {/* Edge glow lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Content — matches the max-w-7xl container rhythm used by other homepage sections */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:gap-16 items-center">

          {/* ── Left: Headline + participant cards ── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Medialane Airdrop
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight text-white">
                Built for{" "} <span className="gradient-text">Creators</span> &amp; <span className="gradient-text">Collectors</span>
              </h2>
              <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
                Mint, collect, and build on Medialane to earn your allocation.
              </p>
            </div>

            {/* Participant type cards — 2×2 grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PARTICIPANT_TYPES.map(({ icon: Icon, label, description, accent, border, dot }) => (
                <div
                  key={label}
                  className={cn(
                    "relative rounded-2xl border p-4 backdrop-blur-sm bg-white/[0.03] space-y-2.5 transition-all duration-300 hover:bg-white/[0.06]",
                    border
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    accent
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white/90">{label}</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">{description}</p>
                  </div>
                  <span className={cn("absolute top-3 right-3 h-1.5 w-1.5 rounded-full animate-pulse", dot)} />
                </div>
              ))}
            </div>

            {/* Stat strip */}
            <div className="flex items-center gap-8 pt-2">
              {[
                { value: "Free", label: "to mint" },
                { value: "Gas-free", label: "trading" },
                { value: "On-chain", label: "royalties" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-lg font-black text-white">{value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          



        </div>
      </div>
    </section>
  );
}

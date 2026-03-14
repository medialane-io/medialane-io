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
    description: "Mint your IP as NFTs and earn royalties on every sale.",
    accent: "from-violet-500 to-purple-600",
    border: "border-violet-500/20",
    dot: "bg-violet-400",
  },
  {
    icon: ShoppingBag,
    label: "Collectors",
    description: "Build your collection and support creators you believe in.",
    accent: "from-blue-500 to-cyan-500",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    icon: Bot,
    label: "AI Agents",
    description: "The first airdrop designed for autonomous agents on-chain.",
    accent: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  {
    icon: Building2,
    label: "Organizations",
    description: "Deploy collections and license content programmatically.",
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

      {/* Content — uses same padding as the rest of the page */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Headline + participant cards ── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Airdrop Campaign · H2 2026
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight text-white">
                The First Airdrop
                <br />
                Built for{" "}
                <span className="gradient-text">Creators</span>
                <br />
                &amp; Collectors.
              </h2>
              <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
                Mint, collect, and build on Medialane to earn your allocation.
                The earlier you participate, the greater your share.
              </p>
            </div>

            {/* Participant type cards — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
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

          {/* ── Right: CTA card ── */}
          <div className="lg:max-w-sm lg:ml-auto w-full">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none" />

              <div className="relative space-y-2">
                <p className="font-black text-2xl text-white leading-tight">
                  Start earning your
                  <br />
                  allocation today.
                </p>
                <p className="text-sm text-white/40 leading-relaxed">
                  Create an account, mint your first asset or collect something
                  you love. Every action on Medialane builds your airdrop score.
                </p>
              </div>

              {/* How-to steps */}
              <ol className="relative space-y-3">
                {[
                  { n: "01", text: "Sign up — free, takes 30 seconds" },
                  { n: "02", text: "Mint or collect an IP asset on Starknet" },
                  { n: "03", text: "Hold & trade — criteria revealed H2 2026" },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="text-xs font-black text-violet-400 tabular-nums mt-0.5 shrink-0">{n}</span>
                    <span className="text-sm text-white/60">{text}</span>
                  </li>
                ))}
              </ol>

              {/* CTAs */}
              <div className="relative space-y-2.5 pt-1">
                {isSignedIn ? (
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 text-white font-bold h-11 shadow-lg shadow-violet-500/25"
                  >
                    <Link href="/create/asset">
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first asset
                    </Link>
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 text-white font-bold h-11 shadow-lg shadow-violet-500/25">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create your free account
                    </Button>
                  </SignInButton>
                )}
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-white/50 hover:text-white hover:bg-white/5 h-10"
                >
                  <Link href="/collections">
                    Explore collections <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>

              <p className="relative text-[10px] text-center text-white/20">
                Free to mint · Gas sponsored · Airdrop criteria revealed H2 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Paintbrush,
  ShoppingBag,
  Bot,
  Building2,
  Zap,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PARTICIPANT_TYPES = [
  {
    icon: Paintbrush,
    label: "Creators",
    description: "Mint IP as NFTs, earn royalties on every sale.",
    accent: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/30",
    border: "border-violet-500/20",
    dot: "bg-violet-400",
  },
  {
    icon: ShoppingBag,
    label: "Collectors",
    description: "Discover rare digital IP and support creators.",
    accent: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/30",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    icon: Bot,
    label: "AI Agents",
    description: "The first airdrop designed for autonomous agents.",
    accent: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/30",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  {
    icon: Building2,
    label: "Organizations",
    description: "Deploy collections and license content on-chain.",
    accent: "from-orange-400 to-rose-500",
    glow: "shadow-orange-500/30",
    border: "border-orange-500/20",
    dot: "bg-orange-400",
  },
] as const;

const ROLES = ["creator", "collector", "agent", "organization", "other"] as const;

const ROLE_LABELS: Record<string, string> = {
  creator: "Creator",
  collector: "Collector",
  agent: "AI Agent",
  organization: "Organization",
  other: "Other",
};

export function AirdropSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("creator");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/airdrop/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      toast.success("You're in! We'll notify you before the airdrop reveals.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Cinematic dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0010] via-[#06000e] to-[#000814]" />

      {/* Aurora atmosphere */}
      <div className="aurora-purple absolute w-[700px] h-[700px] opacity-[0.18] -top-40 -left-32 dark:opacity-[0.28]" />
      <div className="aurora-blue absolute w-[500px] h-[500px] opacity-[0.12] top-20 right-0 dark:opacity-[0.20]" />
      <div className="aurora-rose absolute w-[400px] h-[400px] opacity-[0.08] bottom-0 left-1/3 dark:opacity-[0.14]" />

      {/* Top edge glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      {/* Bottom edge glow line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-10 max-w-none">
        {/* Two-column layout on lg+ */}
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
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white">
                The First Airdrop{" "}
                <br className="hidden sm:block" />
                Built for{" "}
                <span className="gradient-text">Creators</span>
                <br className="hidden sm:block" />
                &amp; Collectors.
              </h2>
              <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
                Mint, trade, and build on Medialane to earn your allocation.
                The earlier you participate, the greater your share.
              </p>
            </div>

            {/* Participant type cards — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {PARTICIPANT_TYPES.map(({ icon: Icon, label, description, accent, glow, border, dot }) => (
                <div
                  key={label}
                  className={cn(
                    "relative rounded-2xl border p-4 backdrop-blur-sm bg-white/[0.03] space-y-2.5 group transition-all duration-300 hover:bg-white/[0.06]",
                    border,
                    "hover:shadow-lg",
                    glow
                  )}
                >
                  {/* Icon with gradient */}
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                    accent
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white/90">{label}</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">{description}</p>
                  </div>
                  {/* Corner dot */}
                  <span className={cn("absolute top-3 right-3 h-1.5 w-1.5 rounded-full animate-pulse", dot)} />
                </div>
              ))}
            </div>

            {/* Micro stat strip */}
            <div className="flex items-center gap-6 pt-2">
              {[
                { value: "Free", label: "to mint" },
                { value: "Gas-free", label: "trading" },
                { value: "On-chain", label: "royalties" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-black text-white">{value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Registration card ── */}
          <div className="lg:max-w-sm lg:ml-auto w-full">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7 sm:p-8 shadow-2xl shadow-black/60">
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none" />

              {done ? (
                <div className="relative flex flex-col items-center gap-5 py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-xl text-white">You&apos;re in! 🎉</p>
                    <p className="text-sm text-white/50 leading-relaxed">
                      We&apos;ll notify you before airdrop criteria are revealed. Start
                      using Medialane now to maximise your allocation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                    <Zap className="h-3.5 w-3.5" />
                    The earlier you act, the higher your score
                  </div>
                </div>
              ) : (
                <div className="relative space-y-6">
                  <div className="space-y-1">
                    <p className="font-black text-xl text-white">Claim your spot</p>
                    <p className="text-sm text-white/40">
                      Be first to know when the airdrop goes live.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/40"
                    />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/40"
                    />

                    {/* Role chips */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">I am a…</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              role === r
                                ? "bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30"
                                : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                            )}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 text-white font-bold h-11 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.01]"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {loading ? "Registering…" : "Join the Airdrop"}
                    </Button>

                    <p className="text-[10px] text-center text-white/25">
                      No spam. Unsubscribe any time. Criteria revealed H2 2026.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
  Shield,
  FileCheck,
  Coins,
  Users,
  Camera,
  Music,
  Palette,
  Globe,
  UserCheck,
  PenLine,
  ShoppingCart,
} from "lucide-react";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { Button } from "@/components/ui/button";
import { GenesisMint } from "@/components/airdrop/genesis-mint";

export const metadata: Metadata = {
  title: "Creator's Airdrop — Medialane",
  description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
};

const PHASES = [
  {
    label: "Phase 1",
    milestone: "5,000 members",
    desc: "First distribution from the creator fund. All eligible participants receive a proportional share based on their activity.",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-400",
  },
  {
    label: "Phase 2",
    milestone: "10,000 members",
    desc: "Second distribution, including all revenue since Phase 1. Activity scores are recalculated from all activity since launch.",
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "bg-purple-500/10 text-purple-400",
  },
];

export default function AirdropPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/30 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <MedialaneLogo />
        <div className="flex items-center gap-2">
          <Link href="/marketplace" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
            Marketplace
          </Link>
          <Button asChild size="sm">
            <Link href="/mint">Join now</Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          {/* ── Hero ── */}
          <section className="py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Left: badge + title + description */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Creator&apos;s Airdrop — Launch Campaign</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  Creator&apos;s{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Airdrop
                  </span>
                </h1>
                <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Medialane distributes platform revenue back to the people who build and use it — creators, collectors, and active participants. What the platform earns goes to the community.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Camera,  label: "Photos & videos" },
                    { icon: Music,   label: "Music" },
                    { icon: Palette, label: "Digital art" },
                    { icon: Globe,   label: "Documents & posts" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/30 px-3 py-2.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: claim component (sticky on desktop) */}
              <div className="lg:sticky lg:top-24">
                <GenesisMint />
              </div>

            </div>
          </section>

          {/* ── What you get ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Benefits</p>
              <h2 className="text-2xl sm:text-3xl font-black">What you get</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileCheck, color: "text-blue-400",   bg: "bg-blue-500/10",   title: "Permanent participation record", desc: "A record tied to your account forever. Can't be taken away." },
                { icon: Coins,     color: "text-yellow-500", bg: "bg-yellow-500/10", title: "Share of the creator fund",      desc: "When milestones are hit, revenue gets distributed back to participants." },
                { icon: Users,     color: "text-purple-400", bg: "bg-purple-500/10", title: "Full platform access",           desc: "Publish, sell, collect, and collaborate with creators on day one." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Participation tiers ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">How it works</p>
              <h2 className="text-2xl sm:text-3xl font-black">Sign up. That&apos;s it.</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Creating an account is all you need to be eligible. Do more — earn more.
              </p>
            </div>

            {/* Base tier */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-lg">Register</p>
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Minimum — you&apos;re in</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Sign up and claim your record. That&apos;s the only requirement to participate in the airdrop.
                  </p>
                </div>
              </div>
            </div>

            {/* Bonus tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <PenLine className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">Bonus</span>
                </div>
                <div>
                  <p className="font-bold">Create content</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Publish original work — photos, music, art, or writing. Creators get a larger share of each distribution.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">Biggest bonus</span>
                </div>
                <div>
                  <p className="font-bold">Trade &amp; collect</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Buy, sell, and collaborate with other creators. Active participants receive the highest share.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Distribution phases ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribution</p>
              <h2 className="text-2xl sm:text-3xl font-black">Creator fund phases</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                When the community hits a milestone, platform revenue gets distributed to all participants.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PHASES.map(({ label, milestone, desc, color, badge }) => (
                <div key={label} className={`rounded-2xl border p-5 space-y-3 ${color}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-lg">{label}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>{milestone}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both phases are planned for the first year of the platform. Milestones are targets, not guarantees — timing depends on growth.
              </p>
            </div>
          </section>

          {/* ── Eligibility + Disclaimer ── */}
          <section className="py-10 border-t border-border/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Eligibility</p>
                  <h2 className="text-2xl font-black">Who qualifies</h2>
                </div>
                <div className="space-y-2.5 text-sm">
                  {[
                    { ok: true,  text: "Anyone who creates a free account." },
                    { ok: true,  text: "Creators who publish original content get a higher share." },
                    { ok: true,  text: "Active participants who trade or collaborate get the most." },
                    { ok: false, text: "Automated tools and duplicate accounts are disqualified." },
                    { ok: false, text: "Artificially inflated activity is disqualified." },
                  ].map(({ ok, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                        {ok ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-2xl font-black">Disclaimer</h2>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.</p>
                  <p>Participation does not guarantee any financial return. Fund distributions, if any occur, may take the form of platform credits, digital assets, or other community resources.</p>
                  <p>The participation record is a digital record of community membership. It has no inherent monetary value and is not a financial instrument.</p>
                  <p>
                    By participating you agree to the{" "}
                    <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Campaign Terms</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</Link>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pb-12" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-5 pt-4">
          Free to join · No purchase required ·{" "}
          <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">Campaign terms</Link>
        </p>
        <div className="px-5 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/campaign-terms" className="hover:text-foreground transition-colors">Campaign</Link>
          <a href="https://docs.medialane.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Docs</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}

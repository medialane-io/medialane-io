import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Shield,
  FileCheck,
  Coins,
  Star,
} from "lucide-react";
import { GenesisMint, AirdropEventCard } from "@/components/airdrop/genesis-mint";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creator's Airdrop — Medialane",
  description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
  alternates: canonical("/airdrop"),
  openGraph: {
    title: "Creator's Airdrop — Medialane",
    description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
    url: "/airdrop",
    type: "website",
  },
};

const REWARDS = [
  {
    icon: FileCheck,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    title: "First in line",
    desc: "You're automatically in the very first distribution — and every one after it.",
  },
  {
    icon: Coins,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
    title: "A real share of revenue",
    desc: "Every $1,000 Medialane earns gets split among participants, by your Score Board points.",
  },
  {
    icon: Star,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    title: "Founding member, forever",
    desc: "That badge never expires. You were here first.",
  },
];

const STEPS = [
  {
    n: "1",
    color: "bg-emerald-500/15 text-emerald-500",
    title: "Register",
    tag: "Minimum — you're in",
    tagColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    desc: "Sign up. That's the whole bar — no strings attached.",
  },
  {
    n: "2",
    color: "bg-brand-purple/15 text-brand-purple",
    title: "Create",
    tag: "Bonus",
    tagColor: "bg-brand-purple/15 text-brand-purple",
    desc: "Publish your work — photos, music, art, writing. Bigger share.",
  },
  {
    n: "3",
    color: "bg-brand-orange/15 text-brand-orange",
    title: "Trade",
    tag: "Biggest bonus",
    tagColor: "bg-brand-orange/15 text-brand-orange",
    desc: "Buy, sell, collect. Active traders get the biggest share.",
  },
];

export default function AirdropPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8">

      {/* ── Hero ── */}
      <section className="py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              <span className="text-xs font-semibold text-brand-orange">Creators Fund Campaign</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              Creator&apos;s <span className="text-brand-orange">Fund</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-md">
              Every dollar Medialane makes gets shared back with the people building here. Sign up and you&apos;re already in.
            </p>

            <GenesisMint />
          </div>

          <div className="space-y-4">
            <AirdropEventCard />
          </div>

        </div>
      </section>

      {/* ── What you get ── */}
      <section className="py-14 space-y-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black">What you actually get</h2>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            No fine print games — just three real perks, for joining now.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {REWARDS.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <p className="font-bold text-lg">{title}</p>
              <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-14 space-y-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-black">Sign up. That&apos;s it.</h2>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            Creating an account gets you in. Do more, and you earn more.
          </p>
        </div>

        <div className="relative pl-2">
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border/50" aria-hidden />
          <div className="space-y-8">
            {STEPS.map(({ n, color, title, tag, tagColor, desc }) => (
              <div key={title} className="relative flex items-start gap-5">
                <div className={`relative z-10 h-12 w-12 rounded-full ${color} flex items-center justify-center font-black text-lg shrink-0`}>
                  {n}
                </div>
                <div className="flex-1 pt-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-bold text-xl">{title}</p>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                  </div>
                  <p className="text-base text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the money moves ── */}
      <section className="py-14 space-y-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-black">How the money moves</h2>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            Simple math: what Medialane earns, you earn. See your exact share on the{" "}
            <Link href="/rewards" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
              Rewards
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="relative rounded-2xl border border-border/40 bg-card overflow-hidden p-6 space-y-2">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-brand-blue" />
            <p className="text-4xl font-black text-brand-blue">$1,000</p>
            <p className="font-bold">= one full distribution</p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every time the fund hits this mark, it goes out to everyone who&apos;s in. $10,000 earned means 10 rounds paid out.
            </p>
          </div>
          <div className="relative rounded-2xl border border-border/40 bg-card overflow-hidden p-6 space-y-2">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-brand-purple" />
            <p className="text-4xl font-black text-brand-purple">Your XP</p>
            <p className="font-bold">= your cut of every round</p>
            <p className="text-base text-muted-foreground leading-relaxed">
              The more you create, trade, and show up, the bigger your slice — every single round.
            </p>
          </div>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          Runs through July 2027 — every dollar earned during that window comes back to you. Don&apos;t take our word for it —{" "}
          <a
            href="https://medialane.org/creators-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors"
          >
            watch the fund live
          </a>
          .
          <span className="block tabular-nums text-sm text-muted-foreground/70 mt-1 break-all">0x064c51746dbcb7498cc6e4b8abfcacd60805c0762b0411bb0515c611b5ae8223</span>
        </p>
      </section>

      {/* ── The fine print ── */}
      <section className="py-14 pb-16 space-y-8">
        <h2 className="text-3xl sm:text-4xl font-black">The fine print</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-bold text-brand-blue">Who can join</p>
              <div className="space-y-2.5">
                {[
                  "Anyone who creates a free Medialane account.",
                  "No ID, no card, no approval required.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-destructive/80">What gets you removed</p>
              <div className="space-y-2.5">
                {[
                  "Automated bots or duplicate registrations.",
                  "Artificially inflating activity or scores.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <p className="font-bold text-lg">The legal stuff, in full</p>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              We have to spell this out because we&apos;re a real platform. Here&apos;s the whole deal, no shortcuts:
            </p>
            <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
              <p>Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.</p>
              <p>Participation does not guarantee any financial return. Fund distributions, if any occur, may take the form of platform credits, digital assets, or other community resources.</p>
              <p>The participation record is a digital record of community membership. It has no inherent monetary value and is not a financial instrument.</p>
              <p>
                By participating you agree to the{" "}
                <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Campaign Terms</a>
                {" "}and{" "}
                <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</a>.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  FileCheck,
  Coins,
  Users,
  ImageIcon,
  Shield,
  Info,
  PenLine,
  ShoppingCart,
  UserCheck,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { MINT_NFT_IMAGE_URL } from "@/lib/constants";
import { GenesisMint } from "@/components/airdrop/genesis-mint";

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = MINT_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative rounded-3xl overflow-hidden border border-border/40 shadow-2xl shadow-black/20 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Medialane Airdrop 2026</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Medialane Creator's Airdrop"
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

export function MintContent() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      <header className="px-6 py-4 flex items-center border-b border-border/30">
        <MedialaneLogo />
      </header>

      <div className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          {/* ── Hero ── */}
          <section className="py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Creator&apos;s Fund Campaign</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                  Join the{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Creator&apos;s Airdrop
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {["Free to join", "No card needed", "Instant"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/70" />
                      {t}
                    </div>
                  ))}
                </div>

                <GenesisMint />
              </div>

              <div className="lg:sticky lg:top-24">
                <EventCard />
              </div>

            </div>
          </section>

          {/* ── Learn more (collapsed) ── */}
          <details className="group border-t border-border/30">
            <summary className="flex items-center justify-center gap-2 py-6 cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden">
              Learn more about the campaign
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>

            <div className="pb-8 space-y-0">

              <section className="py-8 border-t border-border/30 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-black">Creator Fund</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: FileCheck, color: "text-blue-400",   bg: "bg-blue-500/10",   title: "Join for free",      desc: "Sign up in seconds — no card, no approval needed." },
                    { icon: Coins,     color: "text-yellow-500", bg: "bg-yellow-500/10", title: "Creator fund",       desc: "Fund distributions for all participants." },
                    { icon: Users,     color: "text-purple-400", bg: "bg-purple-500/10", title: "Boost your chances", desc: "Create, share, and collect!" },
                  ].map(({ icon: Icon, color, bg, title, desc }) => (
                    <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30">
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

              <section className="py-8 border-t border-border/30 space-y-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">How it works</p>
                  <h2 className="text-2xl sm:text-3xl font-black">Join in seconds.</h2>
                </div>

                <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <UserCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-lg">Create your account</p>
                        <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Minimum — you&apos;re in</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Sign in with Google or email, then set a PIN or passkey to protect your account.
                      </p>
                    </div>
                  </div>
                </div>

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
                        Publish original photos, music, art, or writing. Creators get a larger share.
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
                        Active participants receive the highest share.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-8 border-t border-border/30 space-y-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribution</p>
                  <h2 className="text-2xl sm:text-3xl font-black">Creator fund phases</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-lg">Phase 1</p>
                      <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">5,000 members</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      First distribution. All eligible participants get a proportional share based on their activity.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-lg">Phase 2</p>
                      <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">10,000 members</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Second distribution, including revenue since Phase 1.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Milestones are community targets, not guarantees.
                  </p>
                </div>
              </section>

              <section className="py-8 border-t border-border/30">
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
                            {ok
                              ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              : <XCircle className="h-3 w-3 text-destructive" />}
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
                      <p>Participation does not guarantee any financial return. Fund distributions, if any, may take the form of platform credits, digital assets, or other community resources.</p>
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
          </details>

          <div className="pb-12" />
        </div>
      </div>

      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-5 pt-4">
          Free to join · No purchase required ·{" "}
          <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            Campaign terms
          </a>
        </p>
        <div className="px-5 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
          <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
          <a href="https://docs.medialane.io/guidelines/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Campaign</a>
          <a href="https://docs.medialane.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">About</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}

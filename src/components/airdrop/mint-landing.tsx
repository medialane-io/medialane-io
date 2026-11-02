"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
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
import { MedialaneLogoFull as MedialaneLogo } from "@medialane/ui/brand-logo";

interface Card {
  title: string;
  body: string;
}

interface TaggedCard extends Card {
  tag: string;
}

export interface MintLandingCopy {
  image: { src: string; alt: string; fallback: string };
  badge?: string;
  headline: { lead: string; highlight: string };
  chips: string[];
  learnMore: string;
  fund: { title: string; cards: [Card, Card, Card] };
  how: { eyebrow: string; title: string; account: TaggedCard; create: TaggedCard; trade: TaggedCard };
  phases: { eyebrow: string; title: string; first: TaggedCard; second: TaggedCard; note: string };
  eligibility: { eyebrow: string; title: string; items: Array<{ ok: boolean; text: string }> };
  disclaimer: {
    title: string;
    paragraphs: string[];
    agree: { lead: string; campaignTerms: string; and: string; terms: string };
  };
  footer: {
    line: string;
    campaignTerms: string;
    links: { terms: string; privacy: string; campaign: string; about: string };
  };
}

const DOCS = "https://docs.medialane.io";
const FUND_STYLES = [
  { icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Coins, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
];

function EventCard({ image }: { image: MintLandingCopy["image"] }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative rounded-3xl overflow-hidden border border-border/40 shadow-2xl shadow-black/20 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">{image.fallback}</p>
        </div>
      ) : (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

const DocLink = ({ path, className, children }: { path: string; className: string; children: ReactNode }) => (
  <a href={`${DOCS}${path}`} target="_blank" rel="noopener noreferrer" className={className}>
    {children}
  </a>
);

export function MintLanding({ copy, mint }: { copy: MintLandingCopy; mint: ReactNode }) {
  const { how, phases, eligibility, disclaimer, footer } = copy;
  return (
    <div className="min-h-screen flex flex-col bg-background">

      <header className="px-6 py-4 flex items-center border-b border-border/30">
        <MedialaneLogo />
      </header>

      <div className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          <section className="py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              <div className="space-y-5">
                {copy.badge && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{copy.badge}</span>
                  </div>
                )}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                  {copy.headline.lead}{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {copy.headline.highlight}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {copy.chips.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/70" />
                      {t}
                    </div>
                  ))}
                </div>

                {mint}
              </div>

              <div className="lg:sticky lg:top-24">
                <EventCard image={copy.image} />
              </div>

            </div>
          </section>

          <details className="group border-t border-border/30">
            <summary className="flex items-center justify-center gap-2 py-6 cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden">
              {copy.learnMore}
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>

            <div className="pb-8 space-y-0">

              <section className="py-8 border-t border-border/30 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-black">{copy.fund.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {copy.fund.cards.map(({ title, body }, i) => {
                    const { icon: Icon, color, bg } = FUND_STYLES[i];
                    return (
                      <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30">
                        <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <div>
                          <p className="font-bold">{title}</p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="py-8 border-t border-border/30 space-y-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{how.eyebrow}</p>
                  <h2 className="text-2xl sm:text-3xl font-black">{how.title}</h2>
                </div>

                <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <UserCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-lg">{how.account.title}</p>
                        <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">{how.account.tag}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {how.account.body}
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
                      <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">{how.create.tag}</span>
                    </div>
                    <div>
                      <p className="font-bold">{how.create.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {how.create.body}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-orange-400" />
                      </div>
                      <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">{how.trade.tag}</span>
                    </div>
                    <div>
                      <p className="font-bold">{how.trade.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {how.trade.body}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-8 border-t border-border/30 space-y-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{phases.eyebrow}</p>
                  <h2 className="text-2xl sm:text-3xl font-black">{phases.title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-lg">{phases.first.title}</p>
                      <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">{phases.first.tag}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {phases.first.body}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-lg">{phases.second.title}</p>
                      <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">{phases.second.tag}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {phases.second.body}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {phases.note}
                  </p>
                </div>
              </section>

              <section className="py-8 border-t border-border/30">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{eligibility.eyebrow}</p>
                      <h2 className="text-2xl font-black">{eligibility.title}</h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      {eligibility.items.map(({ ok, text }) => (
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
                      <h2 className="text-2xl font-black">{disclaimer.title}</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                      {disclaimer.paragraphs.map((p) => <p key={p}>{p}</p>)}
                      <p>
                        {disclaimer.agree.lead}{" "}
                        <DocLink path="/guidelines/campaign-terms" className="underline underline-offset-2 hover:text-foreground transition-colors">{disclaimer.agree.campaignTerms}</DocLink>
                        {" "}{disclaimer.agree.and}{" "}
                        <DocLink path="/guidelines/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">{disclaimer.agree.terms}</DocLink>.
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
        <p className="text-2xs text-center text-muted-foreground/50 px-5 pt-4">
          {footer.line}{" "}
          <DocLink path="/guidelines/campaign-terms" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            {footer.campaignTerms}
          </DocLink>
        </p>
        <div className="px-5 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
          <DocLink path="/guidelines/terms" className="hover:text-foreground transition-colors">{footer.links.terms}</DocLink>
          <DocLink path="/guidelines/privacy" className="hover:text-foreground transition-colors">{footer.links.privacy}</DocLink>
          <DocLink path="/guidelines/campaign-terms" className="hover:text-foreground transition-colors">{footer.links.campaign}</DocLink>
          <DocLink path="/about" className="hover:text-foreground transition-colors">{footer.links.about}</DocLink>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}

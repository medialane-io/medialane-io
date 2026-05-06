"use client";

import { Lock, Unlock, Sparkles, Play, Music, Radio, FileText, Link2 } from "lucide-react";
import type { GatedContentState } from "@/hooks/use-gated-content";
import type { ApiCollectionProfile } from "@medialane/sdk";

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: Play,
  AUDIO: Music,
  STREAM: Radio,
  DOCUMENT: FileText,
  LINK: Link2,
};

interface GatedContentHeroProps {
  profile: ApiCollectionProfile | null;
  gatedState: GatedContentState;
  onViewExclusive: () => void;
}

export function GatedContentHero({ profile, gatedState, onViewExclusive }: GatedContentHeroProps) {
  if (!profile?.hasGatedContent) return null;

  const title = profile.gatedContentTitle ?? "Exclusive content for holders";

  if (gatedState.status === "unlocked") {
    const { content } = gatedState;
    const Icon = content.type ? (CONTENT_TYPE_ICONS[content.type] ?? Link2) : Link2;
    return (
      <div className="mx-4 sm:mx-6 mt-3">
        <button
          onClick={onViewExclusive}
          className="w-full flex items-center gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 px-5 py-4 transition-colors text-left group"
        >
          <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">
              ✓ You&apos;re a holder — unlocked
            </p>
            <p className="text-sm font-bold text-foreground leading-snug mt-1 truncate">
              {content.title ?? title}
            </p>
          </div>
          <Unlock className="h-4 w-4 text-emerald-500 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 sm:mx-6 mt-3">
      <div className="card-exclusive-wrapper btn-border-animated">
        <button
          onClick={onViewExclusive}
          className="w-full flex items-center gap-4 rounded-[calc(var(--radius)*1.25)] bg-card hover:bg-muted/60 px-5 py-4 transition-colors text-left group"
        >
          <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1"
              style={{
                background: "linear-gradient(90deg, #2563eb, #9333ea, #f43f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Holder exclusive
            </p>
            <p className="text-sm font-bold text-foreground leading-snug truncate">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Own a token from this collection to unlock</p>
          </div>
          <Sparkles className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
        </button>
      </div>
    </div>
  );
}

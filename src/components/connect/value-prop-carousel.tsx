"use client";

import { useState } from "react";
import {
  Award, Pencil, Trophy, ScanFace, Sparkles, KeyRound, Globe, Lock,
  ShieldCheck, Radio, Zap, Shuffle, Package, Gem, Fingerprint, Rocket,
  ShoppingBag, type LucideIcon,
} from "lucide-react";
import { msg, useT } from "@medialane/ui/i18n";

const VALUE_PROPS: { label: string; icon: LucideIcon }[] = [
  { label: msg("Own your NFTs"), icon: Award },
  { label: msg("Create freely"), icon: Pencil },
  { label: msg("Get rewarded"), icon: Trophy },
  { label: msg("Sign in with a glance"), icon: ScanFace },
  { label: msg("Free to mint"), icon: Sparkles },
  { label: msg("Self custody"), icon: KeyRound },
  { label: msg("Global markets"), icon: Globe },
  { label: msg("Immutable contracts"), icon: Lock },
  { label: msg("Worldwide protection"), icon: ShieldCheck },
  { label: msg("Censorship resistant"), icon: Radio },
  { label: msg("Sponsored transactions"), icon: Zap },
  { label: msg("Remix"), icon: Shuffle },
  { label: msg("Limited Edition NFTs"), icon: Package },
  { label: msg("Creator's Fund"), icon: Gem },
  { label: msg("Asset provenance"), icon: Fingerprint },
  { label: msg("Creator Launchpad"), icon: Rocket },
  { label: msg("NFT Marketplace"), icon: ShoppingBag },
];

function Track({ hidden }: { hidden?: boolean }) {
  const t = useT();
  return (
    <div
      className="flex shrink-0 gap-4"
      aria-hidden={hidden || undefined}
      data-testid={hidden ? undefined : "value-prop-track-primary"}
    >
      {VALUE_PROPS.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="flex aspect-[3/4] w-[200px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card/50 p-6 text-center"
        >
          <Icon className="h-7 w-7 text-primary" />
          <span className="text-sm font-medium text-foreground">{t(label)}</span>
        </div>
      ))}
    </div>
  );
}

export function ValuePropCarousel() {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="value-prop-fade overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="value-prop-track flex w-max gap-4" data-paused={paused}>
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}

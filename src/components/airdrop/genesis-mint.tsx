"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { OnboardingFlow } from "@/components/connect/onboarding-flow";
import { GenesisMintCard, type GenesisMintCopy } from "@/components/genesis-mint-card";

export function AirdropEventCard() {
  const [errored, setErrored] = useState(false);
  const src = "/genesis.jpg";
  return (
    <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-brand-blue via-brand-purple to-brand-orange shadow-2xl shadow-brand-purple/10">
      <div className="relative rounded-[26px] overflow-hidden aspect-square w-full bg-card">
        {errored ? (
          <div className="w-full h-full bg-gradient-to-br from-brand-blue/10 via-brand-purple/10 to-brand-orange/10 flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Medialane Airdrop</p>
          </div>
        ) : (

          <Image
            src={src}
            alt="Medialane Creator's Airdrop"
            fill
            className="object-cover"
            onError={() => setErrored(true)}
          />
        )}
      </div>
    </div>
  );
}

const COPY: GenesisMintCopy = {
  preparing: "Preparing your record…",
  submitting: "Confirming participation…",
  noAccount: "Account not found. Please try again.",
  notStarted: "Airdrop has not started yet.",
  ready: "Account active, mint your passport",
  claim: "Claim my spot",
  claimUnavailable: "Airdrop not started yet",
  working: "Registering your participation…",
  wait: "Please wait…",
  steps: ["Preparing your record", "Submitting", "Confirmed"],
  successTitle: "You're in!",
  successBody: "Your participation is confirmed.",
  create: "Create",
  explore: "Explore",
  again: "Didn't mint your passport? Try again",
  failedTitle: "Could not complete",
  retry: "Try again",
};

const SIGNED_OUT = (
  <div className="w-full max-w-sm space-y-2.5">
    <OnboardingFlow />
    <p className="text-xs text-muted-foreground">
      Takes about 10 seconds.
    </p>
  </div>
);

export function GenesisMint() {
  return <GenesisMintCard copy={COPY} storageKeyPrefix="ml_mint_" signedOut={SIGNED_OUT} />;
}

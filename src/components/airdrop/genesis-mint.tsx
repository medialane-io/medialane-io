"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { OnboardingFlow } from "@/components/connect/onboarding-flow";
import { GenesisMintCard, type GenesisMintCopy } from "@/components/genesis-mint-card";
import { useT, msg } from "@medialane/ui/i18n";

export function AirdropEventCard() {
  const t = useT();
  const [errored, setErrored] = useState(false);
  const src = "/genesis.jpg";
  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden aspect-square w-full bg-card">
        {errored ? (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{t("Medialane Airdrop")}</p>
          </div>
        ) : (

          <Image
            src={src}
            alt={t("Medialane Creator's Airdrop")}
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
  preparing: msg("Preparing your record…"),
  submitting: msg("Confirming participation…"),
  noAccount: msg("Account not found. Please try again."),
  notStarted: msg("Airdrop has not started yet."),
  ready: msg("Account active, mint your passport"),
  claim: msg("Claim my spot"),
  claimUnavailable: msg("Airdrop not started yet"),
  working: msg("Registering your participation…"),
  wait: msg("Please wait…"),
  steps: [msg("Preparing your record"), "Submitting", "Confirmed"],
  successTitle: msg("You're in!"),
  successBody: msg("Your participation is confirmed."),
  create: "Create",
  explore: "Explore",
  again: msg("Didn't mint your passport? Try again"),
  failedTitle: msg("Could not complete"),
  retry: msg("Try again"),
};

function SignedOut() {
  const t = useT();
  return (
    <div className="w-full max-w-sm space-y-2.5">
      <OnboardingFlow />
      <p className="text-xs text-muted-foreground">{t("Takes about 10 seconds.")}</p>
    </div>
  );
}

export function GenesisMint() {
  return <GenesisMintCard copy={COPY} signedOut={<SignedOut />} />;
}

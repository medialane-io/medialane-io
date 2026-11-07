"use client";

import { GenesisMint } from "@/components/airdrop/genesis-mint";
import { MintLanding, type MintLandingCopy } from "@medialane/ui";

const MINT_COPY: MintLandingCopy = {
  image: { src: "/genesis.jpg", alt: "Medialane Creator's Airdrop", fallback: "Medialane Airdrop 2026" },
  badge: "Creator's Fund Campaign",
  headline: { lead: "Join the", highlight: "Creator's Airdrop" },
  chips: ["Free to join", "Instant"],
  learnMore: "Learn more about the campaign",
  fund: {
    title: "Creator Fund",
    cards: [
      { title: "Join for free", body: "Sign up in seconds." },
      { title: "Creator fund", body: "Fund distributions for all participants." },
      { title: "Boost your chances", body: "Create, share, and collect!" },
    ],
  },
  how: {
    eyebrow: "How it works",
    title: "Join in seconds.",
    account: {
      title: "Create your account",
      tag: "Minimum — you're in",
      body: "Sign in with Google or email, then set a PIN or passkey to protect your account.",
    },
    create: {
      tag: "Bonus",
      title: "Create content",
      body: "Publish original photos, music, art, or writing. Creators get a larger share.",
    },
    trade: { tag: "Biggest bonus", title: "Trade & collect", body: "Active participants receive the highest share." },
  },
  phases: {
    eyebrow: "Distribution",
    title: "Creator fund phases",
    first: {
      title: "Phase 1",
      tag: "5,000 members",
      body: "First distribution. All eligible participants get a proportional share based on their activity.",
    },
    second: { title: "Phase 2", tag: "10,000 members", body: "Second distribution, including revenue since Phase 1." },
    note: "Milestones are community targets, not guarantees.",
  },
  eligibility: {
    eyebrow: "Eligibility",
    title: "Who qualifies",
    items: [
      { ok: true, text: "Anyone who creates a free account." },
      { ok: true, text: "Creators who publish original content get a higher share." },
      { ok: true, text: "Active participants who trade or collaborate get the most." },
      { ok: false, text: "Automated tools and duplicate accounts are disqualified." },
      { ok: false, text: "Artificially inflated activity is disqualified." },
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    paragraphs: [
      "Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.",
      "Participation does not guarantee any financial return. Fund distributions, if any, may take the form of platform credits, digital assets, or other community resources.",
    ],
    agree: { lead: "By participating you agree to the", campaignTerms: "Campaign Terms", and: "and", terms: "Terms of Service" },
  },
  footer: {
    line: "Free to join · No purchase required ·",
    campaignTerms: "Campaign terms",
    links: { terms: "Terms", privacy: "Privacy", campaign: "Campaign", about: "About" },
  },
};

export function MintContent() {
  return <MintLanding copy={MINT_COPY} mint={<GenesisMint />} />;
}

"use client";

import type { ComponentProps } from "react";
import {
  LayoutGrid, UserCircle, Link2, Share2, Sparkles, Coins, TrendingUp, AtSign, BadgeCheck,
  Gem, Scale, Gift, Users, ChevronRight, Lock, ShieldCheck, Wallet, KeyRound, ArrowLeftRight,
  Layers, Plus, Award, Ticket, FileCheck,
} from "lucide-react";
import { ClaimRail } from "@medialane/ui/claim-rail";
import { msg, useT } from "@medialane/ui/i18n";

type RailProps = ComponentProps<typeof ClaimRail>;

const ASIDES = {
  claimCollection: {
    included: [
      { icon: LayoutGrid, title: msg("Branded collection page"), desc: msg("Editable name and cover.") },
      { icon: UserCircle, title: msg("Linked to your profile"), desc: msg("Shown on your public profile.") },
      { icon: Link2, title: msg("One shareable URL"), desc: msg("Share your collection.") },
    ],
    steps: [msg("Paste the contract address"), msg("Ownership check on Starknet"), msg("Live on your profile")],
    trustLead: msg("Non-custodial."),
    trust: msg("Assets stay in the collection contract."),
  },
  claimCollectionName: {
    included: [
      { icon: Link2, title: msg("A clean collection URL"), desc: msg("Like medialane.io/collection/your-name.") },
      { icon: Share2, title: msg("Easy to share"), desc: msg("Made for sharing.") },
      { icon: LayoutGrid, title: msg("Points to your page"), desc: msg("Opens the collection page.") },
    ],
    steps: [msg("Pick a collection"), msg("Choose a name"), msg("Live after review")],
    trustIcon: Sparkles,
    trustLead: msg("Free to claim."),
    trust: msg("Each URL goes live after review."),
  },
  claimMemecoin: {
    included: [
      { icon: Coins, title: msg("Listed on the Coins page"), desc: msg("Where people find and trade coins.") },
      { icon: UserCircle, title: msg("On your profile"), desc: msg("Next to the rest of your work.") },
      { icon: TrendingUp, title: msg("Discoverable & tradable"), desc: msg("Open to every trader.") },
    ],
    steps: [msg("Paste the coin contract address"), msg("Ownership check on Starknet"), msg("Live once confirmed")],
    trustLead: msg("Non-custodial."),
    trust: msg("Claiming only links the coin to the account."),
  },
  claimUsername: {
    included: [
      { icon: AtSign, title: msg("Your own creator URL"), desc: msg("Like medialane.io/creator/yourname.") },
      { icon: UserCircle, title: msg("One public profile"), desc: msg("All work in one place.") },
      { icon: Sparkles, title: msg("Easy to find"), desc: msg("Fans find the real creator.") },
    ],
    steps: [msg("Pick a username"), msg("Availability check"), msg("Yours after DAO review")],
    trustIcon: BadgeCheck,
    trustLead: msg("Yours to keep."),
    trust: msg("The DAO reviews each username."),
  },
  asset: {
    included: [
      { icon: Gem, title: msg("A unique piece"), desc: msg("A one-of-a-kind asset.") },
      { icon: Scale, title: msg("Licensing you control"), desc: msg("Set how others use it.") },
      { icon: LayoutGrid, title: msg("On your profile"), desc: msg("Shown on your profile and collection.") },
    ],
    steps: [msg("Upload the work"), msg("Choose licensing terms"), msg("Mint for free")],
    trustIcon: Gift,
    trustLead: msg("Creator-owned."),
    trust: msg("Authorship is recorded permanently."),
  },
  club: {
    included: [
      { icon: Users, title: msg("Unlimited tiers"), desc: msg("Add tiers anytime.") },
      { icon: ChevronRight, title: msg("Full control"), desc: msg("Only the creator mints cards.") },
    ],
    steps: [msg("Create the club"), msg("Add membership tiers"), msg("Sell cards on the marketplace")],
    trustIcon: Users,
    trustLead: msg("Creator-owned."),
    trust: msg("Members trade their cards freely."),
  },
  coin: {
    included: [
      { icon: ShieldCheck, title: msg("Fixed supply forever"), desc: msg("Minting closes at creation.") },
      { icon: Wallet, title: msg("Purchased at market price"), desc: msg("Creator buy capped at 10%.") },
      { icon: KeyRound, title: msg("Ownership renounced"), desc: msg("Renounced automatically at launch.") },
      { icon: ArrowLeftRight, title: msg("You choose the pair"), desc: msg("Pick any supported token.") },
    ],
    steps: [msg("Design the coin"), msg("Set the economics"), msg("Launch")],
    trustIcon: Lock,
    trustLead: msg("Locked forever."),
    trust: msg("Liquidity is locked and fees stay collectible."),
  },
  collection: {
    included: [
      { icon: Layers, title: msg("Your own collection"), desc: msg("Owned by its creator.") },
      { icon: LayoutGrid, title: msg("A branded page"), desc: msg("Custom page and URL.") },
      { icon: Plus, title: msg("Mint your work into it"), desc: msg("Add pieces anytime.") },
    ],
    steps: [msg("Add a name and image"), msg("Publish for free"), msg("Start minting")],
    trustIcon: Gift,
    trustLead: msg("Creator-owned."),
    trust: msg("Publishing is free."),
  },
  editions: {
    included: [
      { icon: Layers, title: msg("Multi-edition collection"), desc: msg("Many editions per piece.") },
      { icon: LayoutGrid, title: msg("A branded page"), desc: msg("Custom page and URL.") },
      { icon: Plus, title: msg("Mint editions anytime"), desc: msg("Add editions anytime.") },
    ],
    steps: [msg("Add a name and image"), msg("Publish for free"), msg("Mint editions")],
    trustIcon: Gift,
    trustLead: msg("Creator-owned."),
    trust: msg("Publishing is free."),
  },
  pop: {
    included: [
      { icon: Award, title: msg("An immutable certificate"), desc: msg("A certificate of attendance.") },
      { icon: Ticket, title: msg("Theirs to keep"), desc: msg("A lasting record of being there.") },
      { icon: LayoutGrid, title: msg("A branded event page"), desc: msg("A page with a claim link.") },
    ],
    steps: [msg("Add event details"), msg("Publish for free"), msg("Share the link")],
    trustIcon: Gift,
    trustLead: msg("Creator-owned."),
    trust: msg("Publishing is free."),
  },
  tickets: {
    included: [
      { icon: Ticket, title: msg("Unlimited tickets"), desc: msg("Add tickets anytime.") },
      { icon: ChevronRight, title: msg("Full control"), desc: msg("Only the creator mints tickets.") },
    ],
    steps: [msg("Create the tickets collection"), msg("Add tickets"), msg("Send tickets to the audience")],
    trustIcon: Ticket,
    trustLead: msg("Permanent."),
    trust: msg("Holders keep their tickets."),
  },
  mintEdition: {
    included: [
      { icon: Sparkles, title: msg("A new piece"), desc: msg("A new artwork in the collection.") },
      { icon: Layers, title: msg("Any number of copies"), desc: msg("Choose the edition count.") },
      { icon: FileCheck, title: msg("Recorded as yours"), desc: msg("Authorship saved permanently.") },
    ],
    steps: [msg("Add details and image"), msg("Choose the edition count"), msg("Mint for free")],
    trustIcon: Gift,
    trustLead: msg("Creator-owned."),
    trust: msg("Minting is free."),
  },
} satisfies Record<string, RailProps>;

export function PageAside({ kind }: { kind: keyof typeof ASIDES }) {
  const t = useT();
  const { included = [], steps, trustLead, trust, trustIcon }: RailProps = ASIDES[kind];
  return (
    <ClaimRail
      trustIcon={trustIcon}
      included={included.map((item) => ({ ...item, title: t(item.title), desc: t(item.desc) }))}
      steps={steps.map((step) => t(step))}
      trustLead={trustLead ? t(trustLead) : undefined}
      trust={trust ? t(trust) : undefined}
    />
  );
}

"use client";

import type { ComponentProps } from "react";
import {
  LayoutGrid, UserCircle, Link2, Share2, Sparkles, Coins, TrendingUp, AtSign, BadgeCheck,
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

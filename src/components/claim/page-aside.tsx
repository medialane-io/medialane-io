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
      { icon: LayoutGrid, title: msg("Branded collection page"), desc: msg("Custom name, cover, banner and links — all editable.") },
      { icon: UserCircle, title: msg("Linked to your profile"), desc: msg("It shows up on your public profile.") },
      { icon: Link2, title: msg("One shareable URL"), desc: msg("Share your collection.") },
    ],
    steps: [msg("Paste your collection's contract address"), msg("We verify you own it on-chain"), msg("It goes live on your profile")],
    trustLead: msg("Non-custodial."),
    trust: msg("Claiming only links your collection to your profile — Medialane never moves or holds your assets. They stay in your contract."),
  },
  claimCollectionName: {
    included: [
      { icon: Link2, title: msg("A clean collection URL"), desc: msg("medialane.io/collection/your-name instead of a long address.") },
      { icon: Share2, title: msg("Easy to share"), desc: msg("Perfect for socials, bios and your fans.") },
      { icon: LayoutGrid, title: msg("Points to your page"), desc: msg("Sends people straight to your branded collection.") },
    ],
    steps: [msg("Pick one of your collections"), msg("Choose a custom name"), msg("We review it, then your URL goes live")],
    trustIcon: Sparkles,
    trustLead: msg("Free to claim."),
    trust: msg("Your custom URL is reviewed before it goes live, then it's yours to share."),
  },
  claimMemecoin: {
    included: [
      { icon: Coins, title: msg("Listed on the Coins page"), desc: msg("Where people discover and trade coins on Medialane.") },
      { icon: UserCircle, title: msg("On your profile"), desc: msg("It appears alongside the rest of your work.") },
      { icon: TrendingUp, title: msg("Discoverable & tradable"), desc: msg("Anyone can find your coin and trade it.") },
    ],
    steps: [msg("Paste your coin's contract address"), msg("We check on-chain that you own it"), msg("Ownership confirmed, your coin goes live")],
    trustLead: msg("Non-custodial."),
    trust: msg("Medialane never takes custody of your coin — claiming just links it to your account."),
  },
  claimUsername: {
    included: [
      { icon: AtSign, title: msg("Your own creator URL"), desc: msg("A clean address like medialane.io/creator/yourname.") },
      { icon: UserCircle, title: msg("One public profile"), desc: msg("Your work, collections and coins, all in one place.") },
      { icon: Sparkles, title: msg("Easy to find"), desc: msg("Fans reach the real you, not a copycat.") },
    ],
    steps: [msg("Pick the username you want"), msg("We check it's available"), msg("Reviewed by the DAO, then it's yours")],
    trustIcon: BadgeCheck,
    trustLead: msg("Yours to keep."),
    trust: msg("Usernames are reviewed by the Medialane DAO to prevent impersonation — once approved, the name is reserved to you."),
  },
  asset: {
    included: [
      { icon: Gem, title: msg("A unique piece"), desc: msg("Mint your work as a one-of-a-kind asset.") },
      { icon: Scale, title: msg("Licensing you control"), desc: msg("Set exactly how others can use it.") },
      { icon: LayoutGrid, title: msg("On your profile"), desc: msg("It shows up on your profile and collection.") },
    ],
    steps: [msg("Upload your work and add details"), msg("Choose your licensing terms"), msg("Mint it — it's free")],
    trustIcon: Gift,
    trustLead: msg("It's yours, free."),
    trust: msg("You own it — Medialane never takes custody, and authorship is recorded permanently."),
  },
  club: {
    included: [
      { icon: Users, title: msg("One club, many tiers"), desc: msg("Create as many membership tiers as you need without publishing again.") },
      { icon: ChevronRight, title: msg("You keep full control"), desc: msg("Only you can create tiers and mint membership cards.") },
    ],
    steps: [msg("Create your club — set name, symbol, and cover image"), msg("Create membership tiers — each gets its own supply and optional validity window"), msg("Mint membership cards and sell them on the marketplace like any asset")],
    trustIcon: Users,
    trustLead: msg("Your club, your rules."),
    trust: msg("Members keep their cards and trade them freely."),
  },
  coin: {
    included: [
      { icon: ShieldCheck, title: msg("Fixed supply forever"), desc: msg("Minting is disabled the moment your coin is created.") },
      { icon: Wallet, title: msg("Purchased at market price"), desc: msg("Capped at 10% and bought from the pool at your own price.") },
      { icon: KeyRound, title: msg("Ownership renounced"), desc: msg("Verifiable on any explorer. Control transfers away automatically at launch.") },
      { icon: ArrowLeftRight, title: msg("You choose the pair"), desc: msg("Price and pair are entirely your choice, from STRK, ETH, WBTC, USDC, or USDT.") },
    ],
    steps: [msg("Design your coin's face and story"), msg("Set your coin's economics"), msg("Launch your coin")],
    trustIcon: Lock,
    trustLead: msg("Locked forever."),
    trust: msg("Liquidity moves into a dedicated locker contract permanently. Only trading fees stay collectible."),
  },
  collection: {
    included: [
      { icon: Layers, title: msg("Your own collection"), desc: msg("A collection that's yours to keep — you own it.") },
      { icon: LayoutGrid, title: msg("A branded page"), desc: msg("Custom cover, banner, name and a shareable URL.") },
      { icon: Plus, title: msg("Mint your work into it"), desc: msg("Add as many pieces as you like, whenever you like.") },
    ],
    steps: [msg("Add a name, symbol and image"), msg("Publish it — it's free"), msg("Start minting your work")],
    trustIcon: Gift,
    trustLead: msg("It's yours, free."),
    trust: msg("You own the collection — Medialane never takes custody, and there are no fees to publish."),
  },
  editions: {
    included: [
      { icon: Layers, title: msg("Multi-edition collection"), desc: msg("Each piece can have many editions to sell or share.") },
      { icon: LayoutGrid, title: msg("A branded page"), desc: msg("Custom cover, name and a shareable URL.") },
      { icon: Plus, title: msg("Mint editions anytime"), desc: msg("Add new editions whenever you like.") },
    ],
    steps: [msg("Add a name, symbol and image"), msg("Publish it — it's free"), msg("Mint editions into it")],
    trustIcon: Gift,
    trustLead: msg("It's yours, free."),
    trust: msg("You own the collection — Medialane never takes custody, and there are no fees to publish."),
  },
  pop: {
    included: [
      { icon: Award, title: msg("An immutable certificate"), desc: msg("A digital asset certificate for authenticity.") },
      { icon: Ticket, title: msg("Theirs to keep"), desc: msg("It stays in their account — a real record they were there.") },
      { icon: LayoutGrid, title: msg("A branded event page"), desc: msg("A page for the event, with a shareable claim link.") },
    ],
    steps: [msg("Add the event details and image"), msg("Publish it — it's free"), msg("Share the link")],
    trustIcon: Gift,
    trustLead: msg("Owned outright, free."),
    trust: msg("The creator owns the collection — Medialane never takes custody, and there are no fees to publish."),
  },
  tickets: {
    included: [
      { icon: Ticket, title: msg("One collection, many tickets"), desc: msg("Create as many tickets as you need without publishing again.") },
      { icon: ChevronRight, title: msg("You keep full control"), desc: msg("Only you can create and mint tickets.") },
    ],
    steps: [msg("Create your tickets collection — set name, symbol, and cover image"), msg("Create tickets — each gets its own supply and optional validity window"), msg("Mint tickets to your audience directly from your collection page")],
    trustIcon: Ticket,
    trustLead: msg("Your tickets, your rules."),
    trust: msg("Holders keep their tickets forever."),
  },
  drop: {
    included: [
      { icon: Share2, title: msg("A drop page to share"), desc: msg("Collectors mint straight from your page.") },
      { icon: Coins, title: msg("Your price, your supply"), desc: msg("Free or paid, as many copies as you choose.") },
      { icon: Scale, title: msg("Licensing you control"), desc: msg("Set how collectors can use the work.") },
    ],
    steps: [msg("Add your artwork and details"), msg("Set the price, copies and timing"), msg("Launch, then share your drop page")],
  },
  mintEdition: {
    included: [
      { icon: Sparkles, title: msg("A new piece"), desc: msg("Mint a new artwork into your collection.") },
      { icon: Layers, title: msg("As many copies as you want"), desc: msg("Choose how many editions to mint.") },
      { icon: FileCheck, title: msg("Recorded as yours"), desc: msg("Authorship is saved permanently with the piece.") },
    ],
    steps: [msg("Add the piece's details and image"), msg("Choose how many editions"), msg("Mint it — it's free")],
    trustIcon: Gift,
    trustLead: msg("It's yours, free."),
    trust: msg("You keep full ownership — Medialane never takes custody, and there are no fees to mint."),
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

import type { ComponentProps } from "react";
import {
  LayoutGrid, UserCircle, Link2, Share2, Sparkles, Coins, TrendingUp, AtSign, BadgeCheck,
  Gem, Scale, Gift, Users, ChevronRight, Lock, ShieldCheck, Wallet, KeyRound, ArrowLeftRight,
  Layers, Plus, Award, Ticket, FileCheck,
} from "lucide-react";
import { ClaimRail } from "@medialane/ui/claim-rail";

type RailProps = ComponentProps<typeof ClaimRail>;

const ASIDES = {
  claimCollection: {
    included: [
      { icon: LayoutGrid, title: "Branded collection page", desc: "Custom name, cover, banner and links — all editable." },
      { icon: UserCircle, title: "Linked to your profile", desc: "It shows up on your public profile." },
      { icon: Link2, title: "One shareable URL", desc: "Share your collection in a single, clean link." },
    ],
    steps: [
      "Paste your collection's contract address",
      "We verify you own it on-chain",
      "It goes live on your profile",
    ],
    trustLead: "Non-custodial.",
    trust: "Claiming only links your collection to your profile — Medialane never moves or holds your assets. They stay in your contract.",
  },
  claimCollectionName: {
    included: [
      { icon: Link2, title: "A clean collection URL", desc: "medialane.io/collection/your-name instead of a long address." },
      { icon: Share2, title: "Easy to share", desc: "Perfect for socials, bios and your fans." },
      { icon: LayoutGrid, title: "Points to your page", desc: "Sends people straight to your branded collection." },
    ],
    steps: [
      "Pick one of your collections",
      "Choose a custom name",
      "We review it, then your URL goes live",
    ],
    trustIcon: Sparkles,
    trustLead: "Free to claim.",
    trust: "Your custom URL is reviewed before it goes live, then it's yours to share.",
  },
  claimMemecoin: {
    included: [
      { icon: Coins, title: "Listed on the Coins page", desc: "Where people discover and trade coins on Medialane." },
      { icon: UserCircle, title: "On your profile", desc: "It appears alongside the rest of your work." },
      { icon: TrendingUp, title: "Discoverable & tradable", desc: "Anyone can find your coin and trade it." },
    ],
    steps: [
      "Paste your coin's contract address",
      "We check on-chain that you own it",
      "Ownership confirmed, your coin goes live",
    ],
    trustLead: "Non-custodial.",
    trust: "Medialane never takes custody of your coin — claiming just links it to your account.",
  },
  claimUsername: {
    included: [
      { icon: AtSign, title: "Your own creator URL", desc: "A clean address like medialane.io/creator/yourname." },
      { icon: UserCircle, title: "One public profile", desc: "Your work, collections and coins, all in one place." },
      { icon: Sparkles, title: "Easy to find", desc: "Fans reach the real you, not a copycat." },
    ],
    steps: [
      "Pick the username you want",
      "We check it's available",
      "Reviewed by the DAO, then it's yours",
    ],
    trustIcon: BadgeCheck,
    trustLead: "Yours to keep.",
    trust: "Usernames are reviewed by the Medialane DAO to prevent impersonation — once approved, the name is reserved to you.",
  },
  asset: {
    included: [
      { icon: Gem, title: "A unique piece", desc: "Mint your work as a one-of-a-kind asset." },
      { icon: Scale, title: "Licensing you control", desc: "Set exactly how others can use it." },
      { icon: LayoutGrid, title: "On your profile", desc: "It shows up on your profile and collection." },
    ],
    steps: [
      "Upload your work and add details",
      "Choose your licensing terms",
      "Mint it — it's free",
    ],
    trustIcon: Gift,
    trustLead: "It's yours, free.",
    trust: "You own it — Medialane never takes custody, and authorship is recorded permanently.",
  },
  club: {
    included: [
      { icon: Users, title: "One club, many tiers", desc: "Create as many membership tiers as you need without publishing again." },
      { icon: ChevronRight, title: "You keep full control", desc: "Only you can create tiers and mint membership cards." },
    ],
    steps: [
      "Create your club — set name, symbol, and cover image",
      "Create membership tiers — each gets its own supply and optional validity window",
      "Mint membership cards and sell them on the marketplace like any asset",
    ],
    trustIcon: Users,
    trustLead: "Your club, your rules.",
    trust: "Only you can create tiers and mint cards. Members keep their cards and trade them freely.",
  },
  coin: {
    included: [
      { icon: ShieldCheck, title: "Fixed supply forever", desc: "Minting is disabled the moment your coin is created." },
      { icon: Wallet, title: "Purchased at market price", desc: "Capped at 10% and bought from the pool at your own price." },
      { icon: KeyRound, title: "Ownership renounced", desc: "Verifiable on any explorer. Control transfers away automatically at launch." },
      { icon: ArrowLeftRight, title: "You choose the pair", desc: "Price and pair are entirely your choice, from STRK, ETH, WBTC, USDC, or USDT." },
    ],
    includedAccentClass: "bg-brand-orange/10 text-brand-orange",
    steps: [
      "Design your coin's face and story",
      "Set your coin's economics",
      "Launch your coin",
    ],
    stepAccentClass: "bg-brand-maeve/10 text-brand-maeve",
    trustIcon: Lock,
    trustAccentClass: "text-brand-orange",
    trustLead: "Locked forever.",
    trust: "Liquidity moves into a dedicated locker contract permanently. Only trading fees stay collectible.",
  },
  collection: {
    included: [
      { icon: Layers, title: "Your own collection", desc: "A collection that's yours to keep — you own it." },
      { icon: LayoutGrid, title: "A branded page", desc: "Custom cover, banner, name and a shareable URL." },
      { icon: Plus, title: "Mint your work into it", desc: "Add as many pieces as you like, whenever you like." },
    ],
    steps: [
      "Add a name, symbol and image",
      "Publish it — it's free",
      "Start minting your work",
    ],
    trustIcon: Gift,
    trustLead: "It's yours, free.",
    trust: "You own the collection — Medialane never takes custody, and there are no fees to publish.",
  },
  editions: {
    included: [
      { icon: Layers, title: "Multi-edition collection", desc: "Each piece can have many editions to sell or share." },
      { icon: LayoutGrid, title: "A branded page", desc: "Custom cover, name and a shareable URL." },
      { icon: Plus, title: "Mint editions anytime", desc: "Add new editions whenever you like." },
    ],
    steps: [
      "Add a name, symbol and image",
      "Publish it — it's free",
      "Mint editions into it",
    ],
    trustIcon: Gift,
    trustLead: "It's yours, free.",
    trust: "You own the collection — Medialane never takes custody, and there are no fees to publish.",
  },
  pop: {
    included: [
      { icon: Award, title: "An immutable certificate", desc: "A digital asset certificate for authenticity." },
      { icon: Ticket, title: "Theirs to keep", desc: "It stays in their account — a real record they were there." },
      { icon: LayoutGrid, title: "A branded event page", desc: "A page for the event, with a shareable claim link." },
    ],
    steps: [
      "Add the event details and image",
      "Publish it — it's free",
      "Share the claim link with attendees",
    ],
    trustIcon: Gift,
    trustLead: "Owned outright, free.",
    trust: "The creator owns the collection — Medialane never takes custody, and there are no fees to publish.",
  },
  tickets: {
    included: [
      { icon: Ticket, title: "One collection, many tickets", desc: "Create as many tickets as you need without publishing again." },
      { icon: ChevronRight, title: "You keep full control", desc: "Only you can create and mint tickets." },
    ],
    steps: [
      "Create your tickets collection — set name, symbol, and cover image",
      "Create tickets — each gets its own supply and optional validity window",
      "Mint tickets to your audience directly from your collection page",
    ],
    trustIcon: Ticket,
    trustLead: "Your tickets, your rules.",
    trust: "Only you can create and mint tickets. Holders keep their tickets forever.",
  },
  mintEdition: {
    included: [
      { icon: Sparkles, title: "A new piece", desc: "Mint a new artwork into your collection." },
      { icon: Layers, title: "As many copies as you want", desc: "Choose how many editions to mint." },
      { icon: FileCheck, title: "Recorded as yours", desc: "Authorship is saved permanently with the piece." },
    ],
    steps: [
      "Add the piece's details and image",
      "Choose how many editions",
      "Mint it — it's free",
    ],
    trustIcon: Gift,
    trustLead: "It's yours, free.",
    trust: "You keep full ownership — Medialane never takes custody, and there are no fees to mint.",
  },
} satisfies Record<string, RailProps>;

export function PageAside({ kind }: { kind: keyof typeof ASIDES }) {
  return <ClaimRail {...ASIDES[kind]} />;
}

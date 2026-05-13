import type { NavCommandGroup } from "@medialane/ui";
import {
  Telescope, Store, LayoutGrid, Users, Activity, Trophy, Gift,
  Briefcase, Search, Music, Palette, Film, Camera, Gem,
  Plus, Layers, Repeat2, Ticket, Zap, BookOpen, FileText,
  ShieldCheck, Wallet, Settings, List, Tag, ScrollText,
} from "lucide-react";

export const NAV_COMMANDS: NavCommandGroup[] = [
  {
    heading: "Navigate",
    items: [
      { id: "discover",    label: "Discover",     icon: Telescope,  href: "/discover",    keywords: ["home", "feed", "explore"] },
      { id: "marketplace", label: "Marketplace",  icon: Store,      href: "/marketplace", keywords: ["buy", "sell", "trade", "listings", "browse"] },
      { id: "collections", label: "Collections",  icon: LayoutGrid, href: "/collections", keywords: ["nft", "drops", "browse"] },
      { id: "creators",    label: "Creators",     icon: Users,      href: "/creators",    keywords: ["artists", "profile", "profile"] },
      { id: "activities",  label: "Activity",     icon: Activity,   href: "/activities",  keywords: ["history", "transactions", "feed", "events"] },
      { id: "rewards",     label: "Rewards",      icon: Trophy,     href: "/rewards",     keywords: ["xp", "points", "leaderboard", "badges", "rank"] },
      { id: "airdrop",     label: "Airdrop",      icon: Gift,       href: "/airdrop",     keywords: ["claim", "free", "drop", "genesis"] },
      { id: "search",      label: "Search",       icon: Search,     href: "/search",      keywords: ["find", "lookup", "query"] },
    ],
  },
  {
    heading: "Create & Mint",
    items: [
      { id: "launchpad",            label: "Launchpad",                    icon: Zap,      href: "/launchpad",                    keywords: ["start", "launch", "creator", "overview"] },
      { id: "mint-ip-asset",        label: "Mint Unique NFT",              icon: Plus,     href: "/create/asset",                 keywords: ["mint", "upload", "publish", "token", "erc721", "singular", "unique", "original"] },
      { id: "create-collection",    label: "Create NFT Collection",        icon: LayoutGrid, href: "/create/collection",          keywords: ["deploy", "series", "erc721", "collection", "branded"] },
      { id: "mint-editions",        label: "Mint Limited Edition",         icon: Layers,   href: "/launchpad/nfteditions",        keywords: ["mint", "edition", "erc1155", "multi", "copies", "limited"] },
      { id: "create-1155",          label: "Create Limited Edition Contract", icon: Layers, href: "/launchpad/nfteditions/create", keywords: ["deploy", "erc1155", "edition", "contract", "limited", "multi-edition"] },
      { id: "collection-drop",      label: "Launch Collection Drop",       icon: Gift,     href: "/launchpad/drop/create",        keywords: ["drop", "timed", "fixed supply", "release", "erc721"] },
      { id: "browse-drops",         label: "Browse Drops",                 icon: Store,    href: "/launchpad/drop",               keywords: ["drop", "browse", "active"] },
      { id: "pop-create",           label: "Create POP Event",             icon: Ticket,   href: "/launchpad/pop/create",         keywords: ["pop", "proof of participation", "event", "community", "soulbound"] },
      { id: "pop-browse",           label: "Browse POP Events",            icon: Ticket,   href: "/launchpad/pop",                keywords: ["pop", "events", "proof of participation"] },
      { id: "remix",                label: "Remix an Asset",               icon: Repeat2,  href: "/marketplace",                  keywords: ["remix", "derivative", "attribution", "fork"] },
    ],
  },
  {
    heading: "Portfolio",
    items: [
      { id: "portfolio",            label: "My Portfolio",     icon: Briefcase, href: "/portfolio",              keywords: ["owned", "my nfts", "wallet", "account"] },
      { id: "portfolio-assets",     label: "My Assets",        icon: Gem,       href: "/portfolio/assets",       keywords: ["owned", "nfts", "tokens", "collected"] },
      { id: "portfolio-listings",   label: "My Listings",      icon: Tag,       href: "/portfolio/listings",     keywords: ["sell", "listed", "active listings"] },
      { id: "portfolio-offers",     label: "My Offers",        icon: List,      href: "/portfolio/offers",       keywords: ["bids", "made", "sent offers"] },
      { id: "portfolio-received",   label: "Received Offers",  icon: ScrollText, href: "/portfolio/received",   keywords: ["incoming", "bids", "offers received"] },
      { id: "portfolio-collections",label: "My Collections",   icon: LayoutGrid, href: "/portfolio/collections", keywords: ["deployed", "created", "my contracts"] },
      { id: "portfolio-activity",   label: "My Activity",      icon: Activity,  href: "/portfolio/activity",    keywords: ["history", "transactions", "events"] },
      { id: "portfolio-wallet",     label: "My Wallet",        icon: Wallet,    href: "/portfolio/wallet",       keywords: ["address", "starknet", "balance"] },
      { id: "portfolio-settings",   label: "Account Settings", icon: Settings,  href: "/portfolio/settings",    keywords: ["profile", "username", "preferences"] },
    ],
  },
  {
    heading: "Explore by type",
    items: [
      { id: "audio",       label: "Audio",       icon: Music,    href: "/audio",       keywords: ["music", "sound", "track", "podcast"] },
      { id: "art",         label: "Art",         icon: Palette,  href: "/art",         keywords: ["illustration", "drawing", "painting", "digital art"] },
      { id: "video",       label: "Video",       icon: Film,     href: "/video",       keywords: ["film", "clip", "animation", "short"] },
      { id: "photography", label: "Photography", icon: Camera,   href: "/photography", keywords: ["photo", "image", "picture", "shot"] },
      { id: "nft",         label: "NFT",         icon: Gem,      href: "/nft",         keywords: ["collectible", "token", "generative"] },
    ],
  },
  {
    heading: "Documentation",
    items: [
      { id: "docs",          label: "Docs — Overview",          icon: BookOpen,   action: () => window.open("https://docs.medialane.io", "_blank"),                              keywords: ["docs", "help", "guide", "documentation"] },
      { id: "docs-market",   label: "Docs — Marketplace",       icon: Store,      action: () => window.open("https://docs.medialane.io/marketplace", "_blank"),                  keywords: ["docs", "buy", "sell", "orders", "guide"] },
      { id: "docs-launchpad",label: "Docs — Launchpad",         icon: Zap,        action: () => window.open("https://docs.medialane.io/launchpad", "_blank"),                   keywords: ["docs", "creator", "mint", "deploy", "guide"] },
      { id: "docs-ip",       label: "Docs — IP & Licensing",    icon: ShieldCheck, action: () => window.open("https://docs.medialane.io/ip-licensing", "_blank"),              keywords: ["docs", "license", "ip", "rights", "royalty"] },
      { id: "docs-sdk",      label: "Docs — SDK & API",         icon: FileText,   action: () => window.open("https://docs.medialane.io/sdk", "_blank"),                         keywords: ["docs", "developer", "api", "sdk", "integration"] },
      { id: "docs-terms",    label: "Terms of Service",         icon: FileText,   action: () => window.open("https://docs.medialane.io/guidelines/terms", "_blank"),            keywords: ["legal", "terms", "tos"] },
      { id: "docs-privacy",  label: "Privacy Policy",           icon: ShieldCheck, action: () => window.open("https://docs.medialane.io/guidelines/privacy", "_blank"),        keywords: ["privacy", "data", "gdpr"] },
    ],
  },
];

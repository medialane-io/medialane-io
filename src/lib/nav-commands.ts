import type { NavCommandGroup } from "@medialane/ui";
import {
  Home, Telescope, Store, LayoutGrid, Users, Activity, Trophy, Gift,
  Briefcase, Search, Music, Palette, Film, Camera, Gem,
  Plus, Layers, Repeat2, Ticket, Zap, BookOpen, FileText,
  ShieldCheck, Wallet, Settings, List, Tag, ScrollText, Coins,
  FolderInput, AtSign, Link2,
} from "lucide-react";

export const NAV_COMMANDS: NavCommandGroup[] = [
  // Primary navigation — no heading: renders first and emphasized as the
  // top-level menu. Keep this to the few most important destinations.
  {
    items: [
      { id: "home",        label: "Start",        icon: Home,      href: "/",            keywords: ["frontpage", "start", "homepage", "main"] },
      { id: "discover",    label: "Discover",    icon: Telescope, href: "/discover",    keywords: ["feed", "explore", "trending"] },
      { id: "marketplace", label: "Marketplace", icon: Store,     href: "/marketplace", keywords: ["buy", "sell", "trade", "listings", "browse"] },
      { id: "launchpad",   label: "Launchpad",   icon: Zap,       href: "/launchpad",   keywords: ["start", "launch", "creator", "mint", "create"] },
      { id: "portfolio",   label: "Portfolio",   icon: Briefcase, href: "/portfolio",   keywords: ["owned", "my nfts", "wallet", "account"] },
    ],
  },
  {
    heading: "Navigate",
    items: [
      { id: "collections", label: "Collections",  icon: LayoutGrid, href: "/collections", keywords: ["nft", "drops", "browse"] },
      { id: "coins",       label: "Coins",        icon: Coins,      href: "/coins",       keywords: ["token", "creator coin", "memecoin", "discover", "trade"] },
      { id: "creators",    label: "Creators",     icon: Users,      href: "/creators",    keywords: ["artists", "profile", "profile"] },
      { id: "activities",  label: "Activity",     icon: Activity,   href: "/activities",  keywords: ["history", "transactions", "feed", "events"] },
      { id: "rewards",     label: "Rewards",      icon: Trophy,     href: "/rewards",     keywords: ["xp", "points", "scoreboard", "leaderboard", "badges", "rank"] },
      { id: "airdrop",     label: "Airdrop",      icon: Gift,       href: "/airdrop",     keywords: ["claim", "free", "drop", "genesis"] },
      { id: "search",      label: "Search",       icon: Search,     href: "/search",      keywords: ["find", "lookup", "query"] },
    ],
  },
  {
    heading: "Create & Mint",
    items: [
      { id: "mint-ip-asset",        label: "Mint Unique NFT",              icon: Plus,     href: "/create/asset",                 keywords: ["mint", "upload", "publish", "token", "erc721", "singular", "unique", "original"] },
      { id: "create-collection",    label: "Create NFT Collection",        icon: LayoutGrid, href: "/create/collection",          keywords: ["deploy", "series", "erc721", "collection", "branded"] },
      { id: "mint-editions",        label: "Mint Limited Edition",         icon: Layers,   href: "/launchpad/nfteditions",        keywords: ["mint", "edition", "erc1155", "multi", "copies", "limited"] },
      { id: "create-1155",          label: "Create Limited Edition Contract", icon: Layers, href: "/launchpad/nfteditions/create", keywords: ["deploy", "erc1155", "edition", "contract", "limited", "multi-edition"] },
      { id: "collection-drop",      label: "Launch Collection Drop",       icon: Gift,     href: "/launchpad/drop/create",        keywords: ["drop", "timed", "fixed supply", "release", "erc721"] },
      { id: "browse-drops",         label: "Browse Drops",                 icon: Store,    href: "/launchpad/drop",               keywords: ["drop", "browse", "active"] },
      { id: "pop-create",           label: "Create POP Event",             icon: Ticket,   href: "/launchpad/pop/create",         keywords: ["pop", "proof of participation", "event", "community", "soulbound"] },
      { id: "pop-browse",           label: "Browse POP Events",            icon: Ticket,   href: "/launchpad/pop",                keywords: ["pop", "events", "proof of participation"] },
      { id: "launch-coin",          label: "Launch a Creator Coin",        icon: Coins,    href: "/launchpad/coin/create",        keywords: ["coin", "creator coin", "erc20", "token", "ekubo", "liquidity", "launch"] },
      { id: "claim-memecoin",       label: "Claim a Memecoin",             icon: Coins,    href: "/launchpad/memecoin",           keywords: ["memecoin", "claim", "coin", "starknet", "unrug", "token"] },
      { id: "remix",                label: "Remix an Asset",               icon: Repeat2,  href: "/marketplace",                  keywords: ["remix", "derivative", "attribution", "fork"] },
    ],
  },
  {
    heading: "Claim",
    items: [
      { id: "claim-collection",      label: "Claim a Collection",      icon: FolderInput, href: "/claim/collection",      keywords: ["claim", "import", "existing", "erc721", "collection", "external"] },
      { id: "claim-username",        label: "Claim your Username",     icon: AtSign,      href: "/claim/username",        keywords: ["claim", "username", "creator page", "url", "reserve", "handle"] },
      { id: "claim-collection-name", label: "Claim a Collection Name", icon: Link2,       href: "/claim/collection-name", keywords: ["claim", "collection", "slug", "url", "name", "vanity"] },
    ],
  },
  {
    heading: "Portfolio",
    items: [
      { id: "portfolio-collections",label: "My Collections",   icon: LayoutGrid, href: "/portfolio/collections", keywords: ["deployed", "created", "my contracts"] },
      { id: "portfolio-assets",     label: "My Assets",        icon: Gem,       href: "/portfolio/assets",       keywords: ["owned", "nfts", "tokens", "collected"] },
      { id: "portfolio-listings",   label: "My Listings",      icon: Tag,       href: "/portfolio/listings",     keywords: ["sell", "listed", "active listings"] },
      { id: "portfolio-offers",     label: "My Offers",        icon: List,      href: "/portfolio/offers",       keywords: ["bids", "made", "sent offers"] },
      { id: "portfolio-received",   label: "Received Offers",  icon: ScrollText, href: "/portfolio/received",   keywords: ["incoming", "bids", "offers received"] },
      { id: "portfolio-activity",   label: "My Activity",      icon: Activity,  href: "/portfolio/activity",    keywords: ["history", "transactions", "events"] },
      { id: "portfolio-wallet",     label: "My Wallet",        icon: Wallet,    href: "/portfolio/wallet",       keywords: ["address", "starknet", "balance"] },
      { id: "portfolio-settings",   label: "Account Settings", icon: Settings,  href: "/portfolio/settings",    keywords: ["profile", "username", "preferences"] },
    ],
  },
  {
    heading: "Explore",
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

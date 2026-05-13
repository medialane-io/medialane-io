import type { NavCommandGroup } from "@medialane/ui";
import {
  Telescope, Store, LayoutGrid, Users, Activity, Trophy, Gift,
  Plus, Briefcase, Search, Music, Palette, Film, Camera, Gem,
} from "lucide-react";

export const NAV_COMMANDS: NavCommandGroup[] = [
  {
    heading: "Navigate",
    items: [
      { id: "discover",    label: "Discover",     icon: Telescope,  href: "/discover",    keywords: ["home", "feed", "explore"] },
      { id: "marketplace", label: "Marketplace",  icon: Store,      href: "/marketplace", keywords: ["buy", "sell", "trade", "listings"] },
      { id: "collections", label: "Collections",  icon: LayoutGrid, href: "/collections", keywords: ["nft", "drops"] },
      { id: "creators",    label: "Creators",     icon: Users,      href: "/creators",    keywords: ["artists", "profile"] },
      { id: "activities",  label: "Activity",     icon: Activity,   href: "/activities",  keywords: ["history", "transactions", "feed"] },
      { id: "rewards",     label: "Rewards",      icon: Trophy,     href: "/rewards",     keywords: ["xp", "points", "leaderboard", "badges"] },
      { id: "airdrop",     label: "Airdrop",      icon: Gift,       href: "/airdrop",     keywords: ["claim", "free", "drop"] },
    ],
  },
  {
    heading: "Create",
    items: [
      { id: "launchpad",         label: "Launchpad",          icon: Plus,      href: "/launchpad",         keywords: ["start", "launch", "creator"] },
      { id: "create-asset",      label: "Mint NFT",           icon: Plus,      href: "/create/asset",      keywords: ["mint", "upload", "publish", "token"] },
      { id: "create-collection", label: "Create Collection",  icon: LayoutGrid, href: "/create/collection", keywords: ["deploy", "series", "drop"] },
    ],
  },
  {
    heading: "Explore by type",
    items: [
      { id: "audio",       label: "Audio",       icon: Music,    href: "/audio",       keywords: ["music", "sound", "track"] },
      { id: "art",         label: "Art",         icon: Palette,  href: "/art",         keywords: ["illustration", "drawing", "painting"] },
      { id: "video",       label: "Video",       icon: Film,     href: "/video",       keywords: ["film", "clip", "animation"] },
      { id: "photography", label: "Photography", icon: Camera,   href: "/photography", keywords: ["photo", "image", "picture"] },
      { id: "nft",         label: "NFT",         icon: Gem,      href: "/nft",         keywords: ["collectible", "token"] },
    ],
  },
  {
    heading: "Account",
    items: [
      { id: "portfolio",   label: "Portfolio",  icon: Briefcase, href: "/portfolio", keywords: ["wallet", "my nfts", "owned", "offers"] },
      { id: "search",      label: "Search",     icon: Search,    href: "/search",    keywords: ["find", "lookup"] },
    ],
  },
];

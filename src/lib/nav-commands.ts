import { navGroups } from "@medialane/ui";
import { AtSign, Coins, FolderInput, Link2 } from "lucide-react";

export const NAV_COMMANDS = navGroups([
  {
    items: [
      "home", "discover", "marketplace", "launchpad", "portfolio",
    ],
  },
  {
    heading: "Navigate",
    items: [
      "collections", "coins", "creators", "activities", "rewards", "airdrop",
      { id: "claims", label: "Claims", icon: FolderInput, href: "/claim", keywords: ["username", "reserve", "import", "collection name", "memecoin"] },
      "settings",
    ],
  },
  {
    heading: "Create & Mint",
    items: [
      "mint-ip-asset", "create-collection", "mint-editions", "create-1155", "collection-drop", "browse-drops",
      "pop-create", "pop-browse", "tickets-create", "tickets-browse", "club-create", "club-browse",
      "sponsorship-create", "sponsorship-browse", "launch-coin",
      { id: "claim-memecoin", label: "Claim a Memecoin", icon: Coins, href: "/claim/memecoin", keywords: ["memecoin", "claim", "coin", "starknet", "unrug", "token"] },
      "remix",
    ],
  },
  {
    heading: "Claim",
    items: [
      { id: "claim-collection", label: "Claim a Collection", icon: FolderInput, href: "/claim/collection", keywords: ["claim", "import", "existing", "erc721", "collection", "external"] },
      { id: "claim-username", label: "Claim your Username", icon: AtSign, href: "/claim/username", keywords: ["claim", "username", "creator page", "url", "reserve", "handle"] },
      { id: "claim-collection-name", label: "Claim a Collection Name", icon: Link2, href: "/claim/collection-name", keywords: ["claim", "collection", "slug", "url", "name", "vanity"] },
    ],
  },
  {
    heading: "Portfolio",
    items: [
      "portfolio-collections", "portfolio-assets", "portfolio-listings", "portfolio-offers", "portfolio-received",
      "portfolio-activity",
    ],
  },
  {
    heading: "Explore",
    items: [
      "audio", "art", "video", "photography", "publications", "nft",
    ],
  },
  {
    heading: "Documentation",
    items: [
      "docs", "docs-market", "docs-launchpad", "docs-ip", "docs-sdk", "docs-terms", "docs-privacy",
    ],
  },
]);

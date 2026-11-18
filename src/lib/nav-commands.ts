import { navGroups } from "@medialane/ui";
import { AtSign, Coins, FolderInput, Link2 } from "lucide-react";
import { msg } from "@medialane/ui/i18n";

export const NAV_COMMANDS = navGroups([
  {
    items: [
      "home", "discover", "marketplace", "launchpad", "portfolio",
    ],
  },
  {
    heading: msg("Navigate"),
    items: [
      "collections", "coins", "accounts", "activities", "rewards", "airdrop",
      { id: "claims", label: msg("Claims"), icon: FolderInput, href: "/claim", keywords: ["username", "reserve", "import", "collection name", "memecoin"] },
      "settings",
    ],
  },
  {
    heading: msg("Create & Mint"),
    items: [
      "mint-ip-asset", "create-collection", "mint-editions", "create-1155", "collection-drop", "browse-drops",
      "pop-create", "pop-browse", "tickets-create", "tickets-browse", "club-create", "club-browse",
      "sponsorship-create", "sponsorship-browse", "launch-coin",
      { id: "claim-memecoin", label: msg("Claim a Memecoin"), icon: Coins, href: "/claim/memecoin", keywords: ["memecoin", "claim", "coin", "starknet", "unrug", "token"] },
      "remix",
    ],
  },
  {
    heading: msg("Claim"),
    items: [
      { id: "claim-collection", label: msg("Claim a collection"), icon: FolderInput, href: "/claim/collection", keywords: ["claim", "import", "existing", "erc721", "collection", "external"] },
      { id: "claim-username", label: msg("Claim Username"), icon: AtSign, href: "/claim/username", keywords: ["claim", "username", "creator page", "url", "reserve", "handle"] },
      { id: "claim-collection-name", label: msg("Claim a Collection Name"), icon: Link2, href: "/claim/collection-name", keywords: ["claim", "collection", "slug", "url", "name", "vanity"] },
    ],
  },
  {
    heading: msg("Portfolio"),
    items: [
      "portfolio-collections", "portfolio-assets", "portfolio-listings", "portfolio-offers", "portfolio-received",
      "portfolio-activity",
    ],
  },
  {
    heading: msg("Explore"),
    items: [
      "audio", "art", "video", "photography", "publications", "nft",
    ],
  },
  {
    heading: msg("Documentation"),
    items: [
      "docs", "docs-market", "docs-launchpad", "docs-ip", "docs-sdk", "docs-terms", "docs-privacy",
    ],
  },
]);

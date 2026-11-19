import { navGroups } from "@medialane/ui";
import { Coins, FolderInput } from "lucide-react";
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
      "collections", "coins", "rewards", "airdrop",
      { id: "claims", label: msg("Claims"), icon: FolderInput, href: "/claim", keywords: ["username", "reserve", "import", "collection name", "memecoin"] },
      "audio", "art", "video", "photography", "publications", "nft",
      "settings",
    ],
  },
  {
    heading: msg("Create & mint"),
    items: [
      "mint-ip-asset", "create-collection", "mint-editions", "create-1155",
      "pop-create", "pop-browse", "tickets-create", "club-create",
      "sponsorship-create", "launch-coin",
      { id: "claim-memecoin", label: msg("Claim a memecoin"), icon: Coins, href: "/claim/memecoin", keywords: ["memecoin", "claim", "coin", "starknet", "unrug", "token"] },
      "remix",
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
    heading: msg("Documentation"),
    items: [
      "docs", "docs-terms", "docs-privacy",
    ],
  },
]);

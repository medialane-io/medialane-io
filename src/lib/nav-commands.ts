import { navGroups } from "@medialane/ui";
import { FolderInput } from "lucide-react";
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
    heading: msg("Creator Launchpad"),
    items: [
      "mint-ip-asset", "mint-editions", "remix", "create-collection", "create-1155", "nft-drop",
      "launch-coin", "pop-create", "tickets-create", "club-create", "sponsorship-create",
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

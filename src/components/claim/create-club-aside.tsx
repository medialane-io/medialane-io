import { Users, ChevronRight } from "lucide-react";
import { ClaimRail } from "@medialane/ui";

/** Right-rail content for /launchpad/club/create. */

export function CreateClubAside() {
  return (
    <ClaimRail
      included={[
        { icon: Users, title: "One club, many tiers", desc: "Create as many membership tiers as you need without publishing again." },
        { icon: ChevronRight, title: "You keep full control", desc: "Only you can create tiers and mint membership cards." },
      ]}
      steps={[
        "Create your club — set name, symbol, and cover image",
        "Create membership tiers — each gets its own supply and optional validity window",
        "Mint membership cards and sell them on the marketplace like any asset",
      ]}
      trustIcon={Users}
      trustLead="Your club, your rules."
      trust="Only you can create tiers and mint cards. Members keep their cards and trade them freely."
    />
  );
}

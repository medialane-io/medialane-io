import { Link2, Share2, LayoutGrid, Sparkles } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /claim/collection-name. */
export function ClaimCollectionNameAside() {
  return (
    <ClaimRail
      included={[
        { icon: Link2, title: "A clean collection URL", desc: "medialane.io/collection/your-name instead of a long address." },
        { icon: Share2, title: "Easy to share", desc: "Perfect for socials, bios and your fans." },
        { icon: LayoutGrid, title: "Points to your page", desc: "Sends people straight to your branded collection." },
      ]}
      steps={[
        "Pick one of your collections",
        "Choose a custom name",
        "We review it, then your URL goes live",
      ]}
      trustIcon={Sparkles}
      trustLead="Free to claim."
      trust="Your custom URL is reviewed before it goes live, then it's yours to share."
    />
  );
}
